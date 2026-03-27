import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import User from '../models/User';
import OTP from '../models/OTP';
import RefreshToken from '../models/RefreshToken';
import { AppError } from '../utils/errors';
import asyncHandler from '../utils/asyncHandler';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import { generateOTP } from '../utils/otp';
import { sendEmail } from '../utils/email';

const hashPassword = async (password: string) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const register = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { name, email, phone, password } = req.body;
  
  const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
  if (existingUser) {
    return next(new AppError('User with this email or phone already exists', 400));
  }

  const hashedPassword = await hashPassword(password);
  
  const user = await User.create({
    name, email, phone, password: hashedPassword, isVerified: false
  });

  const otpCode = generateOTP();
  const expiresAt = new Date(Date.now() + parseInt(process.env.OTP_EXPIRY || '5') * 60 * 1000);
  
  await OTP.create({ userId: user._id, email, otp: otpCode, expiresAt });
  
  try {
    await sendEmail(email, 'Verify your account', `Your OTP is: ${otpCode}. It will expire in ${process.env.OTP_EXPIRY || 5} minutes.`);
  } catch (error) {
    console.log('Email failed, but user created. OTP:', otpCode);
  }

  res.status(201).json({
    status: 'success',
    message: 'User registered. Please verify your email with the OTP sent.',
    data: { user: { id: user._id, name: user.name, email: user.email } }
  });
});

export const verifyOtp = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { email, phone, otp } = req.body;
  
  const query = email ? { email } : { phone };
  const user = await User.findOne(query);
  
  if (!user) return next(new AppError('User not found', 404));

  const otpRecord = await OTP.findOne({ $or: [{ userId: user._id }, { email }], otp });
  
  if (!otpRecord) {
    return next(new AppError('Invalid OTP', 400));
  }

  if (otpRecord.expiresAt < new Date()) {
    await OTP.deleteOne({ _id: otpRecord._id });
    return next(new AppError('OTP expired', 400));
  }

  user.isVerified = true;
  await user.save();
  await OTP.deleteOne({ _id: otpRecord._id });

  res.status(200).json({ status: 'success', message: 'Account verified successfully' });
});

export const login = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user || !user.password) {
    return next(new AppError('Incorrect email or password', 401));
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  if (!isPasswordCorrect) {
    return next(new AppError('Incorrect email or password', 401));
  }

  if (!user.isVerified) {
    return next(new AppError('Please verify your account first', 403));
  }

  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id);
  
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await RefreshToken.create({ userId: user._id, token: refreshToken, expiresAt });

  res.status(200).json({
    status: 'success',
    accessToken,
    refreshToken,
    data: { user: { id: user._id, name: user.name, email: user.email, role: user.role } }
  });
});

export const loginOtp = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { email, phone } = req.body;
  const user = await User.findOne(email ? { email } : { phone });
  
  if (!user) return next(new AppError('User not found', 404));

  const otpCode = generateOTP();
  const expiresAt = new Date(Date.now() + parseInt(process.env.OTP_EXPIRY || '5') * 60 * 1000);
  
  await OTP.create({ userId: user._id, email: user.email, otp: otpCode, expiresAt });

  try {
    if (email) await sendEmail(user.email, 'Your Login OTP', `Your login OTP is: ${otpCode}`);
  } catch (error) {
    console.log('Email sending failed for login OTP:', otpCode);
  }

  res.status(200).json({ status: 'success', message: 'OTP sent successfully for login' });
});

export const refreshToken = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { refreshToken } = req.body;
  
  const tokenRecord = await RefreshToken.findOne({ token: refreshToken });
  if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
    if (tokenRecord) await RefreshToken.deleteOne({ _id: tokenRecord._id });
    return next(new AppError('Invalid or expired refresh token', 401));
  }

  const user = await User.findById(tokenRecord.userId);
  if (!user) return next(new AppError('User no longer exists', 401));

  const newAccessToken = generateAccessToken(user.id, user.role);
  res.status(200).json({ status: 'success', accessToken: newAccessToken });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  
  if (!user) return next(new AppError('There is no user with that email address.', 404));

  const resetToken = generateOTP();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  
  await OTP.create({ userId: user._id, email, otp: resetToken, expiresAt });

  try {
    await sendEmail(email, 'Password Reset Token', `Your password reset token is: ${resetToken}. It is valid for 15 minutes.`);
    res.status(200).json({ status: 'success', message: 'Token sent to email!' });
  } catch (error) {
    return next(new AppError('There was an error sending the email. Try again later!', 500));
  }
});

export const resetPassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { token, newPassword } = req.body;
  
  const otpRecord = await OTP.findOne({ otp: token });
  if (!otpRecord || otpRecord.expiresAt < new Date()) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  
  const user = await User.findById(otpRecord.userId);
  if (!user) return next(new AppError('User not found', 404));

  user.password = await hashPassword(newPassword);
  await user.save();
  await OTP.deleteOne({ _id: otpRecord._id });
  
  res.status(200).json({ status: 'success', message: 'Password reset successful. Please log in.' });
});

export const logout = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await RefreshToken.deleteOne({ token: refreshToken });
  }
  res.status(200).json({ status: 'success', message: 'Logged out successfully' });
});

export const getMe = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  res.status(200).json({
    status: 'success',
    data: { user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role } }
  });
});
