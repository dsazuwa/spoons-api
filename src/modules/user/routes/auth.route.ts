import { Router } from 'express';
import passport from 'passport';

import { trimRequestBody, validate } from '../../../middleware';
import {
  facebookLogin,
  googleLogin,
  login,
  loginAdmin,
  logout,
  reactivate,
  recoverPassword,
  refreshJwt,
  register,
  requestPasswordRecovery,
  setCookieAfterCallBack,
  verifyRecoveryOTP,
} from '../controllers/auth.controller';
import { authenticateInactive } from '../middleware/auth';
import {
  loginAdminSchema,
  loginSchema,
  recoverPasswordSchema,
  registerSchema,
  requestRecoverySchema,
  setCookieSchema,
  verifyRecoveryOTPSchema,
} from '../middleware/validators/auth.validator';

const authRouter = Router();

authRouter.post(
  '/register',
  trimRequestBody,
  validate(registerSchema),
  register,
);

authRouter.post('/login', trimRequestBody, validate(loginSchema), login);
authRouter.post('/login/:id/:otp', validate(loginAdminSchema), loginAdmin);

authRouter.post('/logout', logout);

authRouter.post(
  '/recover',
  validate(requestRecoverySchema),
  requestPasswordRecovery,
);
authRouter.post(
  '/recover/:otp',
  validate(verifyRecoveryOTPSchema),
  verifyRecoveryOTP,
);
authRouter.patch(
  '/recover/:otp',
  validate(recoverPasswordSchema),
  recoverPassword,
);

authRouter.patch('/reactivate', authenticateInactive, reactivate);

authRouter.get(
  '/google',
  passport.authenticate('google', {
    session: false,
    scope: ['profile', 'email'],
  }),
);
authRouter.get(
  '/google/callback',
  passport.authenticate('google', { session: false }),
  googleLogin,
);

authRouter.get(
  '/facebook',
  passport.authenticate('facebook', {
    session: false,
    scope: ['profile', 'email'],
  }),
);
authRouter.get(
  '/facebook/callback',
  passport.authenticate('facebook', { session: false }),
  facebookLogin,
);

authRouter.post(
  '/set-cookie',
  trimRequestBody,
  validate(setCookieSchema),
  setCookieAfterCallBack,
);

authRouter.post('/refresh', refreshJwt);

export default authRouter;
