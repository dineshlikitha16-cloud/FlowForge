import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { validate } from '../middleware/validate.middleware';
import { protect } from '../middleware/auth.middleware';
import { restrictTo } from '../middleware/role.middleware';
import { authLimiter } from '../middleware/rateLimiter';
import * as validators from '../validators/auth.validator';

const router = Router();

router.use(authLimiter); // Apply rate limiting to all auth routes

router.post('/register', validate(validators.registerSchema), authController.register);
router.post('/login', validate(validators.loginSchema), authController.login);
router.post('/login-otp', validate(validators.loginOtpSchema), authController.loginOtp);
router.post('/verify-otp', validate(validators.verifyOtpSchema), authController.verifyOtp);
router.post('/refresh-token', validate(validators.refreshTokenSchema), authController.refreshToken);
router.post('/forgot-password', validate(validators.forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(validators.resetPasswordSchema), authController.resetPassword);
router.post('/logout', authController.logout);

router.get('/me', protect, authController.getMe);
// Example of a role-restricted route
router.get('/admin-only', protect, restrictTo('admin', 'super_admin'), (req, res) => {
  res.status(200).json({ status: 'success', message: 'Hello Admin!' });
});

export default router;
