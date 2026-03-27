import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { AppError } from '../utils/errors';
import asyncHandler from '../utils/asyncHandler';
import User from '../models/User';

export const protect = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in! Please log in to get access.', 401));
  }

  try {
    const decoded = verifyAccessToken(token);
    const currentUser = await User.findById(decoded.userId);
    
    if (!currentUser) {
      return next(new AppError('The user belonging to this token does no longer exist.', 401));
    }
    
    // Add user to request object
    (req as any).user = currentUser;
    next();
  } catch (error) {
    return next(new AppError('Invalid or expired token', 401));
  }
});
