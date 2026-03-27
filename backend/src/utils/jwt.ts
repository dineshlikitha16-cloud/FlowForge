import jwt, { SignOptions } from 'jsonwebtoken';
import mongoose from 'mongoose';

export const generateAccessToken = (userId: mongoose.Types.ObjectId | string, role: string): string => {
  const secret = process.env.JWT_SECRET || 'fallback_secret';
  const options: SignOptions = { expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as any };
  return jwt.sign({ userId: userId.toString(), role }, secret, options);
};

export const generateRefreshToken = (userId: mongoose.Types.ObjectId | string): string => {
  const secret = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret';
  const options: SignOptions = { expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as any };
  return jwt.sign({ userId: userId.toString() }, secret, options);
};

export const verifyAccessToken = (token: string): any => {
  const secret = process.env.JWT_SECRET || 'fallback_secret';
  return jwt.verify(token, secret);
};

export const verifyRefreshToken = (token: string): any => {
  const secret = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret';
  return jwt.verify(token, secret);
};
