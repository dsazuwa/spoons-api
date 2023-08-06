import { Request, Response } from 'express';

import { facebookLogin, googleLogin } from '@user/controllers/auth.controller';
import { User, UserAccount, UserIdentity } from '@user/models';
import authService from '@user/services/auth.service';
import userService from '@user/services/user.service';

import { request } from 'tests/supertest.helper';

import 'tests/db-setup';

const BASE_URL = '/api/auth';

describe('Google Login', () => {
  it(`GET ${BASE_URL}/google`, async () => {
    await request.get(`${BASE_URL}/google`).expect(302);
    await request.get(`${BASE_URL}/google/callback`).expect(302);
  });

  it('google callback controller', async () => {
    const { userId } = await User.create({ firstName: 'Jay', lastName: 'Doe' });

    await UserAccount.create({
      userId,
      email: 'jaydoe@gmail.com',
      password: 'jayD0ePa$$',
    });

    await UserIdentity.create({
      userId,
      id: '428402371863284',
      providerType: 'google',
    });

    const req = { user: { userId, status: 'active' } } as Request;
    const res = { redirect: jest.fn() } as unknown as Response;
    const next = jest.fn();

    const token = authService.generateJWT(userId, 'google');
    const userData = await userService.getUserData(userId);

    await googleLogin(req, res, next);

    expect(res.redirect).toHaveBeenCalledWith(
      `${
        process.env.FRONTEND_BASE_URL
      }/OAuthRedirecting?token=${token}&user=${encodeURIComponent(
        JSON.stringify(userData),
      )}`,
    );
  });
});

describe('Facebook Login', () => {
  // it(`GET ${BASE_URL}/facebook`, async () => {
  //   await request.get(`${BASE_URL}/facebook`).expect(302);
  //   await request.get(`${BASE_URL}/facebook/callback`).expect(302);
  // });

  it('facebook callback controller', async () => {
    const { userId } = await User.create({ firstName: 'Jaz', lastName: 'Doe' });

    await UserAccount.create({
      userId,
      email: 'jazdoe@gmail.com',
      password: 'jazD0ePa$$',
    });

    await UserIdentity.create({
      userId,
      id: '42942742739273298',
      providerType: 'facebook',
    });

    const req = { user: { userId, status: 'active' } } as Request;
    const res = { redirect: jest.fn() } as unknown as Response;
    const next = jest.fn();

    const token = authService.generateJWT(userId, 'facebook');
    const userData = await userService.getUserData(userId);

    await facebookLogin(req, res, next);

    expect(res.redirect).toHaveBeenCalledWith(
      `${
        process.env.FRONTEND_BASE_URL
      }/OAuthRedirecting?token=${token}&user=${encodeURIComponent(
        JSON.stringify(userData),
      )}`,
    );
  });
});
