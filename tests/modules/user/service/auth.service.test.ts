import { sign } from 'jsonwebtoken';

import {
  Customer,
  CustomerAccount,
  CustomerIdentity,
  CustomerOTP,
  CustomerPassword,
  Email,
} from '@user/models';
import authService from '@user/services/auth.service';
import { ROLES } from '@user/utils/constants';

import {
  createAdmin,
  createCustomer,
  createRoles,
  createCustomerAndIdentity,
} from 'tests/modules/user/helper-functions';

import 'tests/db-setup';

const raw = true;

beforeAll(async () => {
  await createRoles();
});

describe('generate JWT token', () => {
  const email = 'janicedoe@gmail.com';

  it('should generate a token for email', async () => {
    const token = authService.generateJWT(email, 'email');
    const decoded = sign(
      { email, provider: 'email' },
      `${process.env.JWT_SECRET}`,
      { expiresIn: '1 day' },
    );

    expect(token).toEqual(decoded);
  });

  it('should generate a token for google', async () => {
    const token = authService.generateJWT(email, 'google');
    const decoded = sign(
      { email, provider: 'google' },
      `${process.env.JWT_SECRET}`,
      { expiresIn: '1 day' },
    );

    expect(token).toEqual(decoded);
  });

  it('should generate a token for facebook', async () => {
    const token = authService.generateJWT(email, 'facebook');
    const decoded = sign(
      { email, provider: 'facebook' },
      `${process.env.JWT_SECRET}`,
      { expiresIn: '1 day' },
    );

    expect(token).toEqual(decoded);
  });
});

describe('create identity for customer', () => {
  it('should create identity for customer and change account status to active', async () => {
    const status = 'pending';

    const { customerId } = await createCustomer(
      'James',
      'Doe',
      'jamesdoe@gmail.com',
      'jamesD0epa$$',
      status,
    );

    const identityId = '923849719836872649';
    const provider = 'google';

    const result = await authService.createIdentityForCustomer(
      identityId,
      customerId,
      status,
      provider,
    );
    expect(result.identityId).toBe(identityId);

    const i = CustomerIdentity.findOne({
      where: { customerId, provider },
      raw,
    });
    expect(i).not.toBeNull();

    const a = await CustomerAccount.findOne({
      where: { customerId, status: 'active' },
      raw,
    });
    expect(a).not.toBeNull();
  });
});

describe('create customer and identity', () => {
  it('should create user, user account, and user identity', async () => {
    const identityId = '98098976576567';
    const firstName = 'Jamal';
    const lastName = 'Doe';
    const email = 'jamaldoe@gmail.com';

    const c = await Customer.findOne({
      where: { firstName, lastName },
      raw,
    });
    const e = await Email.findOne({ where: { email }, raw });
    const i = await CustomerIdentity.findOne({
      where: { identityId, provider: 'google' },
      raw,
    });

    expect(c).toBeNull();
    expect(e).toBeNull();
    expect(i).toBeNull();

    const result = await authService.createCustomerAndIdentity(
      identityId,
      firstName,
      lastName,
      email,
      'google',
    );

    expect(result.identityId).toBe(identityId);

    const createdCustomer = await Customer.findOne({
      where: { firstName, lastName },
      raw,
    });
    expect(createdCustomer).not.toBeNull();

    const createdEmail = await Email.findOne({ where: { email } });
    expect(createdEmail).not.toBeNull();

    const createdAccount = await CustomerAccount.findOne({
      where: {
        customerId: createdCustomer?.customerId,
        emailId: createdEmail?.emailId,
        status: 'active',
      },
      raw,
    });
    expect(createdAccount).not.toBeNull();

    const createdIdentity = await CustomerIdentity.findOne({
      where: { identityId },
      raw,
    });
    expect(createdIdentity).not.toBeNull();
  });
});

describe('create customer', () => {
  it('should successfully create customer', async () => {
    const jacquePassword = 'jacqueD0epas$$';

    const { customerId, password: otp } = await authService.createCustomer(
      'Jacqueline',
      'Doe',
      'jacquelinedoe@gmail.com',
      jacquePassword,
    );

    const customer = await Customer.findByPk(customerId, { raw });
    const account = await CustomerAccount.findByPk(customerId, { raw });
    const password = await CustomerPassword.findByPk(customerId);

    expect(customer).not.toBeNull();
    expect(account).not.toBeNull();
    expect(password).not.toBeNull();
    expect(password?.comparePasswords(jacquePassword)).toBe(true);

    const emailOTP = await CustomerOTP.findOne({
      where: { customerId, type: 'email' },
    });

    expect(emailOTP).not.toBeNull();
    expect(emailOTP?.comparePasswords(otp)).toBe(true);
  });
});

describe('login', () => {
  it('should login admin on valid data', async () => {
    const email = 'january@gmail.com';
    const password = 'janD0epas$$';

    const { adminId } = await createAdmin(
      'Jan',
      'Doe',
      email,
      password,
      'active',
      [ROLES.CUSTOMER_SUPPORT.roleId],
    );

    const userId = await authService.loginUser(email, password);
    expect(userId).toBe(adminId);
  });

  it('should login customer on valid data', async () => {
    const email = 'jandoe@gmail.com';
    const password = 'janD0epas$$';

    const { customerId } = await createCustomer(
      'Jan',
      'Doe',
      email,
      password,
      'active',
    );

    const userId = await authService.loginUser(email, password);
    expect(userId).toBe(customerId);
  });

  it('should fail login if customer has no password', async () => {
    const email = 'jaffdoe@gmail.com';

    const { customerId } = await createCustomerAndIdentity(
      'Jeff',
      'Doe',
      email,
      null,
      'active',
      [{ identityId: '23427678575423245', provider: 'google' }],
    );

    const password = await CustomerPassword.findOne({
      where: { customerId },
      raw,
    });
    expect(password).toBeNull();

    const userId = await authService.loginUser(email, 'jazzd0ePa$$');
    expect(userId).toBeNull();
  });

  it('should fail login on wrong credentials', async () => {
    let userId = await authService.loginUser('jandoe@gmail.com', '1234567890');
    expect(userId).toBe(null);

    userId = await authService.loginUser('january@gmail.com', '1234567890');
    expect(userId).toBe(null);

    userId = await authService.loginUser('notjanuary@gmail.com', '1234567890');
    expect(userId).toBe(null);
  });
});

describe('recover password otp', () => {
  it('should recover the password successfully', async () => {
    const { customerId } = await createCustomer(
      'Jack',
      'Doe',
      'jackdoe@gmail.com',
      'jackD0epas$$',
      'active',
    );

    const newPassword = 'newD0epa$$word';

    await authService.recoverCustomerPassword(customerId, newPassword);

    const password = await CustomerPassword.findOne({ where: { customerId } });
    expect(password?.comparePasswords(newPassword)).toBe(true);
  });
});

describe('reactivate customer', () => {
  it('should update status if user is deactivated', async () => {
    const { customerId } = await createCustomer(
      'Jery',
      'Doe',
      'jerydoe@gmail.com',
      'jerryD0ePa$$',
      'deactivated',
    );

    const result = await authService.reactivateCustomer(customerId);
    expect(result).toBe(true);

    const account = await CustomerAccount.findByPk(customerId, { raw });
    expect(account?.status).toBe('active');
  });

  it('should fail to update status if user is not deactivated', async () => {
    const { customerId } = await createCustomer(
      'Jery',
      'Doe',
      'jerry@gmail.com',
      'jerryD0ePa$$',
      'suspended',
    );

    const result = await authService.reactivateCustomer(customerId);
    expect(result).toBe(false);

    const account = await CustomerAccount.findByPk(customerId, { raw });
    expect(account?.status).toBe('suspended');
  });
});
