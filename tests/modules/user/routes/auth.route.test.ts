import { promisify } from 'util';
import { JwtPayload, sign, verify } from 'jsonwebtoken';

import {
  Admin,
  AdminOTP,
  Customer,
  CustomerEmail,
  CustomerOTP,
  CustomerPassword,
  Email,
} from '@app/modules/user/models';
import tokenService from '@app/modules/user/services/token.service';
import { ROLES } from '@app/modules/user/utils/constants';

import { getTokenFrom, request } from 'tests/supertest.helper';
import {
  createAdmin,
  createCustomer,
  createCustomerAndIdentity,
  createRoles,
} from '../helper-functions';

import 'tests/db-setup';

const BASE_URL = '/api/auth';

const raw = true;

beforeAll(async () => {
  await createRoles();
});

describe('Email Authentication', () => {
  describe(`POST ${BASE_URL}/register`, () => {
    const data = {
      firstName: 'Jessica',
      lastName: 'Doe',
      email: 'jessicadoe@gmail.com',
      password: 'jessicaD0epa$$',
    };

    it(`should pass for valid data`, async () => {
      const response = await request.post(`${BASE_URL}/register`).send(data);
      expect(response.status).toBe(200);

      const token = getTokenFrom(
        response.headers['set-cookie'],
        'access-token',
      );
      expect(token).not.toEqual('');

      const user = await Customer.findOne({
        where: { firstName: data.firstName, lastName: data.lastName },
        raw,
      });

      const email = await Email.findOne({
        where: { email: data.email },
        raw,
      });

      const acct = await CustomerEmail.findOne({
        where: {
          customerId: user?.customerId || -1,
          emailId: email?.emailId || -1,
        },
        raw,
      });

      const password = await CustomerPassword.findOne({
        where: { customerId: user?.customerId || -1 },
        raw,
      });

      expect(user).not.toBeNull();
      expect(email).not.toBeNull();
      expect(acct).not.toBeNull();
      expect(password).not.toBeNull();
    });

    it(`should fail for duplicate email`, async () => {
      await request.post(`${BASE_URL}/register`).send(data).expect(409);
    });
  });

  describe(`POST ${BASE_URL}/login`, () => {
    describe('customer', () => {
      it('should pass for correct credentials', async () => {
        const email = 'joandoe@gmail.com';
        const password = 'joanD0ePa$$';

        await createCustomer('Joan', 'Doe', email, password, 'active');
        const response = await request
          .post(`${BASE_URL}/login`)
          .send({ email, password });

        expect(response.status).toBe(200);

        const token = getTokenFrom(
          response.headers['set-cookie'],
          'access-token',
        );
        expect(token).not.toEqual('');
      });

      it('should fail for wrong password', async () => {
        const email = 'notjoandoe@gmail.com';

        await createCustomer('Joan', 'Doe', email, 'D0epa$$w0rd', 'active');

        const response = await request
          .post(`${BASE_URL}/login`)
          .send({ email, password: 'wrong-password' });

        expect(response.status).toBe(401);

        const token = getTokenFrom(
          response.headers['set-cookie'],
          'access-token',
        );
        expect(token).toEqual('');
      });

      it('should fail for user_account with null password', async () => {
        const email = 'jolenedoe@gmail.com';

        await createCustomerAndIdentity(
          'Jolene',
          'Doe',
          email,
          null,
          'active',
          [{ identityId: '2453675876525431', provider: 'google' }],
        );

        const response = await request
          .post(`${BASE_URL}/login`)
          .send({ email, password: 'wrong-password' });

        expect(response.status).toBe(401);

        const token = getTokenFrom(
          response.headers['set-cookie'],
          'access-token',
        );
        expect(token).toEqual('');
      });

      it('should fail for deactivated account', async () => {
        const email = 'jeandoe@gmail.com';
        const password = 'jeanD0ePa$$';

        await createCustomer('Jean', 'Doe', email, password, 'deactivated');

        const response = await request
          .post(`${BASE_URL}/login`)
          .send({ email, password });

        expect(response.status).toBe(401);

        const token = getTokenFrom(
          response.headers['set-cookie'],
          'access-token',
        );
        expect(token).toEqual('');

        const { accessToken, user } = response.body;

        expect(user).toBeDefined();
        expect(accessToken).toBeDefined();
      });

      it('should fail for suspended account', async () => {
        const email = 'notdoe@gmail.com';
        const password = 'joanD0ePa$$';

        await createCustomer('Jolene', 'Doe', email, password, 'suspended');

        const response = await request
          .post(`${BASE_URL}/login`)
          .send({ email, password });

        expect(response.status).toBe(401);

        const token = getTokenFrom(
          response.headers['set-cookie'],
          'access-token',
        );
        expect(token).toEqual('');
      });
    });

    describe('admin', () => {
      const email = 'jonathan@gmail.com';
      const password = 'jonathanD0ePa$$';

      beforeEach(async () => {
        await Email.destroy({ where: {} });
        await Admin.destroy({ where: {} });
      });

      it('should pass for correct credentials', async () => {
        await createAdmin('Jonathan', 'Doe', email, password, 'active', [
          ROLES.CUSTOMER_SUPPORT.roleId,
        ]);

        const response = await request
          .post(`${BASE_URL}/login`)
          .send({ email, password });

        expect(response.status).toBe(200);
        expect(response.body.user).toBeDefined();

        const token = getTokenFrom(
          response.headers['set-cookie'],
          'access-token',
        );
        expect(token).toEqual('');
      });

      it('should fail for disabled user', async () => {
        await createAdmin('Jonathan', 'Doe', email, password, 'disabled', [
          ROLES.CUSTOMER_SUPPORT.roleId,
        ]);

        const response = await request
          .post(`${BASE_URL}/login`)
          .send({ email, password });

        expect(response.status).toBe(401);

        const token = getTokenFrom(
          response.headers['set-cookie'],
          'access-token',
        );
        expect(token).toEqual('');
      });
    });
  });

  describe(`POST ${BASE_URL}/login/:id/:otp`, () => {
    const email = 'jonathan@gmail.com';
    const password = 'jonathanD0ePa$$';

    const mockOTP = '12345';

    let adminId: number;

    beforeAll(async () => {
      await Email.destroy({ where: {} });
      await Admin.destroy({ where: {} });

      const { admin } = await createAdmin(
        'Jonathan',
        'Doe',
        email,
        password,
        'active',
        [ROLES.CUSTOMER_SUPPORT.roleId],
      );

      adminId = admin.adminId;
    });

    it('should pass on correct credentials', async () => {
      await AdminOTP.destroy({
        where: { adminId, type: 'login' },
      });

      await AdminOTP.create({
        adminId,
        type: 'login',
        password: mockOTP,
        expiresAt: CustomerOTP.getExpiration(),
      });

      const response = await request
        .post(`${BASE_URL}/login/${adminId}/${mockOTP}`)
        .send({ email, password });

      expect(response.status).toBe(200);

      const token = getTokenFrom(
        response.headers['set-cookie'],
        'access-token',
      );
      expect(token).not.toEqual('');
    });

    it('should fail for invalid credentials', async () => {
      const response = await request
        .post(`${BASE_URL}/login/2/${mockOTP}`)
        .send({ email, password });

      expect(response.status).toBe(401);

      const token = getTokenFrom(
        response.headers['set-cookie'],
        'access-token',
      );
      expect(token).toEqual('');
    });
  });

  it(`POST ${BASE_URL}/logout`, async () => {
    const response = await request.post(`${BASE_URL}/logout`);
    expect(response.status).toBe(200);

    const token = getTokenFrom(response.headers['set-cookie'], 'access-token');
    expect(token).toEqual('');
  });
});

describe('Recover Password', () => {
  const mockOTP = '123456';

  describe(`POST ${BASE_URL}/recover`, () => {
    it('should create a new recover password otp for customer', async () => {
      const email = 'janetdoe@gmail.com';

      const { customerId } = await createCustomer(
        'Janet',
        'Doe',
        email,
        'janetD0epa$$',
        'active',
      );

      await request.post(`${BASE_URL}/recover`).send({ email }).expect(200);

      const otp = await CustomerOTP.findOne({
        where: { customerId, type: 'password' },
        raw,
      });
      expect(otp).not.toBeNull();

      await request.post(`${BASE_URL}/recover`).send({ email }).expect(200);

      const newOTP = await CustomerOTP.findOne({
        where: { customerId, type: 'password' },
        raw,
      });
      expect(newOTP).not.toBeNull();
      expect(newOTP?.otpId).not.toEqual(otp?.otpId);
    });

    it('should create a new recover password otp for admin', async () => {
      const email = 'janetdoe.admin@gmail.com';

      const { adminId } = await createAdmin(
        'Janet',
        'Doe',
        email,
        'janetD0epa$$',
        'active',
        [ROLES.CUSTOMER_SUPPORT.roleId],
      );

      await request.post(`${BASE_URL}/recover`).send({ email }).expect(200);

      const otp = await AdminOTP.findOne({
        where: { adminId, type: 'password' },
        raw,
      });
      expect(otp).not.toBeNull();

      await request.post(`${BASE_URL}/recover`).send({ email }).expect(200);

      const newOTP = await AdminOTP.findOne({
        where: { adminId, type: 'password' },
        raw,
      });
      expect(newOTP).not.toBeNull();
      expect(newOTP?.otpId).not.toEqual(otp?.otpId);
    });

    it('should fail to create new otp on user_account with null password', async () => {
      const email = 'jadoe@gmail.com';

      await createCustomerAndIdentity('Ja', 'Doe', email, null, 'active', [
        { identityId: '253689876543245342', provider: 'google' },
      ]);

      await request.post(`${BASE_URL}/recover`).send({ email }).expect(403);
    });
  });

  describe(`POST ${BASE_URL}/recover/:otp`, () => {
    const email = 'jdoe@gmail.com';

    it('should verify customer account for recovery', async () => {
      const { customerId } = await createCustomer(
        'J',
        'Doe',
        email,
        'jD0ePa$$',
        'active',
      );

      await CustomerOTP.destroy({
        where: { customerId, type: 'password' },
      });

      await CustomerOTP.create({
        customerId,
        type: 'password',
        password: mockOTP,
        expiresAt: CustomerOTP.getExpiration(),
      });

      await request
        .post(`${BASE_URL}/recover/${mockOTP}`)
        .send({ email })
        .expect(200);
    });

    it('should verify admin account for recovery', async () => {
      const { adminId } = await createAdmin(
        'J',
        'Doe',
        'j.doe@gmail.com',
        'jD0ePa$$',
        'active',
        [ROLES.MANAGER.roleId],
      );

      await AdminOTP.destroy({
        where: { adminId, type: 'password' },
      });

      await AdminOTP.create({
        adminId,
        type: 'password',
        password: mockOTP,
        expiresAt: CustomerOTP.getExpiration(),
      });

      await request
        .post(`${BASE_URL}/recover/${mockOTP}`)
        .send({ email })
        .expect(200);
    });

    it('should fail for non-numeric otp', async () => {
      await request
        .post(`${BASE_URL}/recover/nonnumeric`)
        .send({ email })
        .expect(400);
    });

    it('should fail for wrong otp', async () => {
      await request
        .post(`${BASE_URL}/recover/121241`)
        .send({ email })
        .expect(401);
    });
  });

  describe(`PATCH ${BASE_URL}/recover/:otp`, () => {
    const newPassword = 'jinsNewD0epa$$';
    const email = 'jindoe@gmail.com';

    let customerId: number;

    beforeAll(async () => {
      const { customer } = await createCustomer(
        'Jin',
        'Doe',
        email,
        'jinD0ePa$$',
        'active',
      );
      customerId = customer.customerId;
    });

    it('should fail on invalid password', async () => {
      await request
        .patch(`${BASE_URL}/recover/${mockOTP}`)
        .send({ email, password: 'newpassword' })
        .expect(400);
    });

    it('should fail on non-numeric otp', async () => {
      await request
        .patch(`${BASE_URL}/recover/non0numeric`)
        .send({ email, password: 'newPa$$w0rd' })
        .expect(400);
    });

    it('should fail on wrong otp', async () => {
      await request
        .patch(`${BASE_URL}/recover/0111`)
        .send({ email, password: newPassword })
        .expect(401);
    });

    it('should fail on expired otp', async () => {
      await CustomerOTP.destroy({
        where: { customerId, type: 'password' },
      });

      await CustomerOTP.create({
        customerId,
        type: 'password',
        password: mockOTP,
        expiresAt: new Date(),
      });

      await request
        .patch(`${BASE_URL}/recover/${mockOTP}`)
        .send({ email, password: newPassword })
        .expect(401);
    });

    it('should reset customer password', async () => {
      await CustomerOTP.destroy({
        where: { customerId, type: 'password' },
      });

      await CustomerOTP.create({
        customerId,
        type: 'password',
        password: mockOTP,
        expiresAt: CustomerOTP.getExpiration(),
      });

      await request
        .patch(`${BASE_URL}/recover/${mockOTP}`)
        .send({ email, password: newPassword })
        .expect(200);

      await request
        .post(`/api/auth/login`)
        .send({ email, password: newPassword })
        .expect(200);

      const usedOTP = await CustomerOTP.findOne({
        where: { customerId, type: 'password' },
        raw,
      });

      expect(usedOTP).toBeNull();
    });

    it('should reset admin password', async () => {
      const adminEmail = 'janelle@gmail.com';

      const { adminId } = await createAdmin(
        'Janelle',
        'Doe',
        adminEmail,
        'jD0ePa$$',
        'active',
        [ROLES.ROOT.roleId],
      );

      await AdminOTP.destroy({
        where: { adminId, type: 'password' },
      });

      await AdminOTP.create({
        adminId,
        type: 'password',
        password: mockOTP,
        expiresAt: AdminOTP.getExpiration(),
      });

      await request
        .patch(`${BASE_URL}/recover/${mockOTP}`)
        .send({ email: adminEmail, password: newPassword })
        .expect(200);

      await request
        .post(`/api/auth/login`)
        .send({ email, password: newPassword })
        .expect(200);

      const usedOTP = await AdminOTP.findOne({
        where: { adminId, type: 'password' },
        raw,
      });

      expect(usedOTP).toBeNull();
    });
  });
});

describe(`PATCH ${BASE_URL}/reactivate`, () => {
  it('should reactivate inactive user', async () => {
    const status = 'deactivated';

    const { customerId, email } = await createCustomer(
      'Janelle',
      'Doe',
      'janelledoe@gmail.com',
      'janelleD0ePa$$',
      status,
    );

    const token = tokenService.generateAccessToken(email.email, 'email');

    let c = Customer.findOne({ where: { customerId, status }, raw });
    expect(c).resolves.not.toBeNull();

    await request
      .patch(`${BASE_URL}/reactivate`)
      .auth(token, { type: 'bearer' })
      .expect(200);

    c = Customer.findOne({ where: { customerId, status: 'active' }, raw });
    expect(c).resolves.not.toBeNull();
  });

  it('should fail for active user', async () => {
    const status = 'active';

    const { customerId, email } = await createCustomer(
      'Josee',
      'Doe',
      'joseedoe@gmail.com',
      'joseeD0ePa$$',
      status,
    );

    const token = tokenService.generateAccessToken(email.email, 'email');

    let c = Customer.findOne({ where: { customerId, status }, raw });
    expect(c).resolves.not.toBeNull();

    await request
      .patch(`${BASE_URL}/reactivate`)
      .auth(token, { type: 'bearer' })
      .expect(401);

    c = Customer.findOne({ where: { customerId, status }, raw });
    expect(c).not.toBeNull();
  });

  it('should fail for pending user', async () => {
    const status = 'pending';

    const { customerId, email } = await createCustomer(
      'Jaclyn',
      'Doe',
      'jaclyndoe@gmail.com',
      'jaclynD0ePa$$',
      status,
    );

    const token = tokenService.generateAccessToken(email.email, 'email');

    let c = Customer.findOne({ where: { customerId, status }, raw });
    expect(c).resolves.not.toBeNull();

    await request
      .patch(`${BASE_URL}/reactivate`)
      .auth(token, { type: 'bearer' })
      .expect(401);

    c = Customer.findOne({ where: { customerId, status }, raw });
    expect(c).not.toBeNull();
  });
});

describe(`POST ${BASE_URL}/set-cookie`, () => {
  beforeEach(async () => {
    await Customer.destroy({ where: {} });
    await Email.destroy({ where: {} });
  });

  it('should successfully set cookies', async () => {
    const email = 'johndoe@gmail.com';

    const { customerId } = await createCustomer(
      'John',
      'Doe',
      email,
      'johnD0ePa$$',
      'active',
    );

    const { accessToken, refreshToken } = await tokenService.generateTokens(
      false,
      customerId,
      email,
      'email',
    );

    const response = await request
      .post(`${BASE_URL}/set-cookie`)
      .send({ accessToken, refreshToken });

    expect(response.status).toBe(200);

    const accessT = getTokenFrom(
      response.headers['set-cookie'],
      'access-token',
    );
    expect(accessT).not.toEqual('');

    const refreshT = getTokenFrom(
      response.headers['set-cookie'],
      'refresh-token',
    );
    expect(refreshT).toEqual(refreshToken);
  });

  it('should fail to set cookies on expired access-token', async () => {
    const email = 'johndoe@gmail.com';

    const accessToken = sign(
      { email, provider: 'email' },
      process.env.JWT_SECRET,
      { expiresIn: '1s' },
    );

    const setTimeoutPromise = promisify(setTimeout);
    await setTimeoutPromise(1000);

    const { customerId } = await createCustomer(
      'John',
      'Doe',
      email,
      'johnD0ePa$$',
      'active',
    );

    const { refreshToken } = await tokenService.generateTokens(
      false,
      customerId,
      email,
      'email',
    );

    const response = await request
      .post(`${BASE_URL}/set-cookie`)
      .send({ accessToken, refreshToken });

    expect(response.status).toBe(401);

    const accessT = getTokenFrom(
      response.headers['set-cookie'],
      'access-token',
    );
    const refreshT = getTokenFrom(
      response.headers['set-cookie'],
      'refresh-token',
    );

    expect(accessT).toEqual('');
    expect(refreshT).toEqual('');
  });

  it('should fail to set cookies on invalid refresh-token', async () => {
    const email = 'johndoe@gmail.com';

    const refreshToken = sign(
      { tokenId: 1, token: '21331', email, provider: 'email' },
      process.env.JWT_SECRET,
      { expiresIn: '1s' },
    );

    const { customerId } = await createCustomer(
      'John',
      'Doe',
      email,
      'johnD0ePa$$',
      'active',
    );

    const { accessToken } = await tokenService.generateTokens(
      false,
      customerId,
      email,
      'email',
    );

    const response = await request
      .post(`${BASE_URL}/set-cookie`)
      .send({ accessToken, refreshToken });

    expect(response.status).toBe(401);

    const accessT = getTokenFrom(
      response.headers['set-cookie'],
      'access-token',
    );
    const refreshT = getTokenFrom(
      response.headers['set-cookie'],
      'refresh-token',
    );

    expect(accessT).toEqual('');
    expect(refreshT).toEqual('');
  });
});

describe(`POST ${BASE_URL}/refresh`, () => {
  beforeEach(async () => {
    await Customer.destroy({ where: {} });
    await Email.destroy({ where: {} });
  });

  it('should successfully refresh cookies', async () => {
    const email = 'johndoe@gmail.com';

    const { customerId } = await createCustomer(
      'John',
      'Doe',
      email,
      'johnD0ePa$$',
      'active',
    );

    const { refreshToken } = await tokenService.generateTokens(
      false,
      customerId,
      email,
      'email',
    );

    const { tokenId: id1, token: token1 } = verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    ) as JwtPayload;

    const response = await request
      .post(`${BASE_URL}/refresh`)
      .set('Cookie', [`refresh-token=${refreshToken}`]);

    expect(response.status).toBe(200);

    const { tokenId: id2, token: token2 } = verify(
      getTokenFrom(response.headers['set-cookie'], 'refresh-token'),
      process.env.REFRESH_TOKEN_SECRET,
    ) as JwtPayload;

    expect(id1).not.toBe(id2);
    expect(token1).not.toBe(token2);

    const accessToken = getTokenFrom(
      response.headers['set-cookie'],
      'access-token',
    );
    await request
      .get('/api/users/me')
      .auth(accessToken, { type: 'bearer' })
      .expect(200);
  });

  it('should fail on undefined refresh-token cookie', async () => {
    await request.post(`${BASE_URL}/refresh`).expect(401);
  });
});
