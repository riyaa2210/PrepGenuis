const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const TokenBlacklist = require('../models/TokenBlacklist.model');
const AppError = require('../utils/AppError');

exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) throw new AppError('Not authenticated. Please log in.', 401);

  // Check blacklist
  const blacklisted = await TokenBlacklist.findOne({ token });
  if (blacklisted) throw new AppError('Token has been invalidated. Please log in again.', 401);

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id);
  if (!user) throw new AppError('User no longer exists.', 401);

  req.user = user;
  next();
};

exports.restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    throw new AppError('You do not have permission to perform this action.', 403);
  }
  next();
};
