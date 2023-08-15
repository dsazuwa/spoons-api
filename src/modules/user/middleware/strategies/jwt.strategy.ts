import { PassportStatic } from 'passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import authService from '@user/services/auth.service';

const { JWT_SECRET } = process.env;

export const configureJWTStrategy = (passportStatic: PassportStatic) => {
  passportStatic.use(
    new Strategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: JWT_SECRET,
      },
      async (jwt_payload, done) => {
        try {
          const { userId, provider } = jwt_payload;

          const user = await authService.getUserData(userId, provider);

          done(null, user);
        } catch (err) {
          done(err, false);
        }
      },
    ),
  );
};