import { Router } from 'express';
import {
  loginController,
  dataRequestController,
  logoutController,
  meController,
  refreshController,
  registerController,
  resendVerificationController,
  sendWelcomePerkController,
  trackAuthEventController,
  updateOnboardingController,
  verifyEmailController,
} from '../controllers/auth.controller';
import { authGuard } from '../middleware/auth';

const authRouter = Router();

authRouter.post('/register', registerController);
authRouter.post('/login', loginController);
authRouter.post('/refresh', refreshController);
authRouter.post('/logout', logoutController);
authRouter.post('/verify-email', verifyEmailController);
authRouter.post('/resend-verification', resendVerificationController);
authRouter.post('/track', trackAuthEventController);
authRouter.post('/data-request', authGuard, dataRequestController);
authRouter.post('/welcome-perk', authGuard, sendWelcomePerkController);
authRouter.get('/me', authGuard, meController);
authRouter.patch('/onboarding', authGuard, updateOnboardingController);

export default authRouter;
