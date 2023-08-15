import { AuthOTP, UserAccount } from '@user/models';
import { ROLES } from '@user/utils/constants';

import { createUserAccount } from '../helper-functions';

import 'tests/user.db-setup';

const raw = true;

describe('AuthOTP Model', () => {
  let userId: number;

  beforeAll(async () => {
    const { user } = await createUserAccount(
      'Jacque',
      'Doe',
      'jaquedoe@gmail.com',
      'jacqueD0epa$$',
      'pending',
      [ROLES.CUSTOMER.roleId],
    );
    userId = user.userId;
  });

  describe('create OTP', () => {
    it('should create OTP', async () => {
      await AuthOTP.create({
        userId,
        type: 'email',
        password: '12345',
        expiresAt: new Date(),
      });

      let retrievedOTP = await AuthOTP.findOne({
        where: { userId, type: 'email' },
        raw,
      });

      expect(retrievedOTP).not.toBeNull();

      await AuthOTP.create({
        userId,
        type: 'password',
        password: '12345',
        expiresAt: new Date(),
      });

      retrievedOTP = await AuthOTP.findOne({
        where: { userId, type: 'password' },
        raw,
      });

      expect(retrievedOTP).not.toBeNull();
    });

    it('should fail on invalid userID', async () => {
      expect(
        AuthOTP.create({
          userId: 1000,
          type: 'password',
          password: '12345',
          expiresAt: new Date(),
        }),
      ).rejects.toThrow();
    });

    it('should fail to create duplicate OTP', async () => {
      expect(
        AuthOTP.create({
          userId,
          type: 'email',
          password: '12345',
          expiresAt: new Date(),
        }),
      ).rejects.toThrow();

      expect(
        AuthOTP.create({
          userId,
          type: 'email',
          password: '12345',
          expiresAt: new Date(),
        }),
      ).rejects.toThrow();
    });
  });

  it('should retrieve OTP', async () => {
    let otp = await AuthOTP.findOne({ where: { userId, type: 'email' }, raw });
    expect(otp).not.toBeNull();

    otp = await AuthOTP.findOne({ where: { userId, type: 'password' }, raw });
    expect(otp).not.toBeNull();
  });

  it('should delete OTP', async () => {
    const numOTPs = (await AuthOTP.findAll({ where: { userId }, raw })).length;
    const numDeleted = await AuthOTP.destroy({ where: { userId } });

    expect(numOTPs).toBe(numDeleted);

    const passwordOTP = await AuthOTP.create({
      userId,
      type: 'password',
      password: '12345',
      expiresAt: new Date(),
    });

    await passwordOTP.destroy();

    const otp = await AuthOTP.findOne({
      where: { userId, type: 'password' },
      raw,
    });
    expect(otp).toBeNull();
  });

  describe('hash password', () => {
    it('should hash the password on create', async () => {
      const password = '12345';

      const otp = await AuthOTP.create({
        userId,
        type: 'email',
        password,
        expiresAt: new Date(),
      });

      expect(otp.password).not.toEqual(password);
      expect(otp.comparePasswords(password)).toBeTruthy();

      await otp.destroy();
    });

    it('should hash the password on update', async () => {
      const password = '12345';

      const otp = await AuthOTP.create({
        userId,
        type: 'email',
        password,
        expiresAt: new Date(),
      });

      const newPassword = '67890';

      await otp.update({ password: newPassword });

      expect(otp.comparePasswords(password)).toBeFalsy();
      expect(otp.comparePasswords(newPassword)).toBeTruthy();
    });
  });

  it('should generate a 5-digit password', async () => {
    const code = AuthOTP.generatePassword();
    expect(code.length).toBe(5);
    expect(parseInt(code, 10)).toBeDefined();
  });

  it('should generate a date 30 minutes from now', () => {
    const expiration = AuthOTP.getExpiration();
    const now = new Date();
    const thirtyMinsFromNow = new Date(now.getTime() + 30 * 60000);

    expect(expiration).toBeInstanceOf(Date);
    expect(expiration.getTime()).toBeGreaterThan(now.getTime());
    expect(expiration.getTime()).toBeLessThanOrEqual(
      thirtyMinsFromNow.getTime(),
    );
  });
});

describe('OTP and User Account Relationship', () => {
  it('deleting OTP should not delete User Account', async () => {
    const { userId } = await createUserAccount(
      'Jasmine',
      'Doe',
      'jasminedoe@gmail.com',
      'jasmineD0epa$$',
      'active',
      [ROLES.CUSTOMER.roleId],
    );

    await AuthOTP.create({
      userId,
      type: 'password',
      password: '12345',
      expiresAt: new Date(),
    });

    await AuthOTP.destroy({ where: { userId, type: 'password' } });

    const otp = await AuthOTP.findOne({
      where: { userId, type: 'password' },
      raw,
    });
    expect(otp).toBeNull();

    const retrievedAccount = await UserAccount.findByPk(userId, { raw });
    expect(retrievedAccount).not.toBeNull();
  });

  it('deleting User Account should delete OTP', async () => {
    const { userId } = await createUserAccount(
      'Jessica',
      'Doe',
      'jessicadoe@gmail.com',
      'JessicaD0ePa$$',
      'active',
      [ROLES.CUSTOMER.roleId],
    );

    await AuthOTP.create({
      userId,
      type: 'password',
      password: '12345',
      expiresAt: AuthOTP.getExpiration(),
    });

    await UserAccount.destroy({ where: { userId } });

    const retrievedAccount = await UserAccount.findByPk(userId, { raw });
    expect(retrievedAccount).toBeNull();

    const otp = await AuthOTP.findOne({
      where: { userId, type: 'password' },
      raw,
    });
    expect(otp).toBeNull();
  });
});
