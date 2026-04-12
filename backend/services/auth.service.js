const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User.model');
const TokenBlacklist = require('../models/TokenBlacklist.model');
const { signAccessToken, signRefreshToken, verifyRefreshToken, getTokenExpiry } = require('../utils/tokenUtils');
const AppError = require('../utils/AppError');

// Lazy-init — avoids network call at module load when GOOGLE_CLIENT_ID is not set
let _googleClient = null;
const getGoogleClient = () => {
  if (!_googleClient) _googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  return _googleClient;
};

exports.register = async ({ name, email, password }) => {
  const existing = await User.findOne({ email });
  if (existing) throw new AppError('Email already registered.', 409);

  const user = await User.create({ name, email, password });
  const accessToken = signAccessToken(user._id);
  const refreshToken = signRefreshToken(user._id);

  user.refreshTokens.push(refreshToken);
  await user.save({ validateBeforeSave: false });

  return { user, accessToken, refreshToken };
};

exports.login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user || !user.password) throw new AppError('Invalid email or password.', 401);

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new AppError('Invalid email or password.', 401);

  const accessToken = signAccessToken(user._id);
  const refreshToken = signRefreshToken(user._id);

  user.refreshTokens.push(refreshToken);
  await user.save({ validateBeforeSave: false });

  return { user, accessToken, refreshToken };
};

exports.googleLogin = async (idToken) => {
  if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === 'your_google_client_id') {
    throw new AppError('Google OAuth is not configured on this server.', 501);
  }
  const ticket = await getGoogleClient().verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const { sub: googleId, email, name, picture } = ticket.getPayload();

  let user = await User.findOne({ $or: [{ googleId }, { email }] });
  if (!user) {
    user = await User.create({ name, email, googleId, avatar: picture, isEmailVerified: true });
  } else if (!user.googleId) {
    user.googleId = googleId;
    user.avatar = picture;
    await user.save({ validateBeforeSave: false });
  }

  const accessToken = signAccessToken(user._id);
  const refreshToken = signRefreshToken(user._id);
  user.refreshTokens.push(refreshToken);
  await user.save({ validateBeforeSave: false });

  return { user, accessToken, refreshToken };
};

exports.refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) throw new AppError('Refresh token required.', 401);

  const decoded = verifyRefreshToken(refreshToken);
  const user = await User.findById(decoded.id);
  if (!user || !user.refreshTokens.includes(refreshToken)) {
    throw new AppError('Invalid refresh token.', 401);
  }

  const newAccessToken = signAccessToken(user._id);
  return { accessToken: newAccessToken };
};

exports.logout = async (accessToken, refreshToken, userId) => {
  // Blacklist access token
  if (accessToken) {
    const expiry = getTokenExpiry(accessToken);
    await TokenBlacklist.create({ token: accessToken, expiresAt: expiry });
  }

  // Remove refresh token from user
  if (refreshToken && userId) {
    await User.findByIdAndUpdate(userId, { $pull: { refreshTokens: refreshToken } });
  }
};
