import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per `window`
  standardHeaders: true, 
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again in 15 minutes!'
});

export const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 5, // Limit each IP to 5 requests per minute for auth routes
  message: 'Too many auth attempts from this IP, please try again later.'
});
