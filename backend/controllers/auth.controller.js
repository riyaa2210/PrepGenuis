const authService = require('../services/auth.service');
const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

const sendTokens = (res, user, accessToken, refreshToken, statusCode = 200) => {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.status(statusCode).json({ success: true, accessToken, user });
};

exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new AppError(errors.array()[0].msg, 400);
  const { user, accessToken, refreshToken } = await authService.register(req.body);
  sendTokens(res, user, accessToken, refreshToken, 201);
};

exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new AppError(errors.array()[0].msg, 400);
  const { user, accessToken, refreshToken } = await authService.login(req.body);
  sendTokens(res, user, accessToken, refreshToken);
};

exports.googleLogin = async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) throw new AppError('Google ID token required.', 400);
  const { user, accessToken, refreshToken } = await authService.googleLogin(idToken);
  sendTokens(res, user, accessToken, refreshToken);
};

exports.refreshToken = async (req, res) => {
  // Accept from cookie, body, or Authorization header (Bearer rt_...)
  const refreshToken =
    req.cookies?.refreshToken ||
    req.body?.refreshToken ||
    req.headers['x-refresh-token'];

  if (!refreshToken) {
    return res.status(401).json({ success: false, message: 'No refresh token provided.' });
  }
  const { accessToken } = await authService.refreshAccessToken(refreshToken);
  res.json({ success: true, accessToken });
};

exports.logout = async (req, res) => {
  const accessToken = req.headers.authorization?.split(' ')[1];
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
  await authService.logout(accessToken, refreshToken, req.user._id);
  res.clearCookie('refreshToken');
  res.json({ success: true, message: 'Logged out successfully.' });
};

exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

exports.updateProfile = async (req, res) => {
  const { name, avatar } = req.body;
  const User = require('../models/User.model');
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name, avatar },
    { new: true, runValidators: true }
  );
  res.json({ success: true, user });
};
