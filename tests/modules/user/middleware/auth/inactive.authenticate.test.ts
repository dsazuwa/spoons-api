import { tokenService } from '@app/modules/user/services';

import { request } from 'tests/supertest.helper';
import { createCustomer } from '../../helper-functions';

import 'tests/db-setup';

describe('Inative Authentication Middleware', () => {
  const URL = '/api/test/inactive/greeting';

  it('should authenticate the request with a valid access token', async () => {
    const { email } = await createCustomer(
      'Jess',
      'Doe',
      'jessdoe@gmail.com',
      'jessD0ePa$$',
      'deactivated',
    );
    const accessToken = tokenService.generateAccessToken(email.email, 'email');

    await request.get(URL).auth(accessToken, { type: 'bearer' }).expect(200);
  });

  it('should return 401 Unauthorized for an invalid/undefined access token', async () => {
    await request.get(URL).auth('badtoken', { type: 'bearer' }).expect(401);

    await request.get(URL).expect(401);
  });

  it('should return 401 Unauthorized for an active account', async () => {
    const { email } = await createCustomer(
      'Jessica',
      'Doe',
      'jessicadoe@gmail.com',
      'jessD0ePa$$',
      'active',
    );
    const accessToken = tokenService.generateAccessToken(email.email, 'email');

    await request.get(URL).auth(accessToken, { type: 'bearer' }).expect(401);
  });

  it('should return 401 Unauthorized for a pending account', async () => {
    const { email } = await createCustomer(
      'Jazz',
      'Doe',
      'jazzdoe@gmail.com',
      'jazzD0ePs$$',
      'pending',
    );
    const accessToken = tokenService.generateAccessToken(email.email, 'email');

    await request.get(URL).auth(accessToken, { type: 'bearer' }).expect(401);
  });
});
