import { Request } from 'express';

import { AuthOTP, User, UserAccount, UserIdentity } from '@user/models';
import usersService from '@user/services/users.service';
import { ROLES } from '@user/utils/constants';

import {
  createUserAccount,
  createUserAccountAndIdentity,
} from 'tests/modules/user/helper-functions';

import 'tests/user.db-setup';

describe('get user', () => {
  it('pending user account', async () => {
    const firstName = 'Joan';
    const lastName = 'Doe';
    const email = 'joandoe@gmail.com';
    const password = 'joanD0epa$$';
    const status = 'pending';
    const roles = ['customer'];

    const req = {
      user: { firstName, lastName, email, password, status, roles },
    } as unknown as Request;

    const data = await usersService.getUserData(req);
    expect(data).toMatchObject({ firstName, lastName, email, status, roles });
  });

  it('active user account', async () => {
    const firstName = 'Jeronimo';
    const lastName = 'Doe';
    const email = 'jeronimodoe@gmail.com';
    const password = 'jeroD0ePa$$';
    const status = 'active';
    const roles = ['ceo', 'manager'];

    const req = {
      user: { firstName, lastName, email, password, status, roles },
    } as unknown as Request;

    const data = await usersService.getUserData(req);
    expect(data).toMatchObject({ firstName, lastName, email, status, roles });
  });
});

describe('verify email', () => {
  let userId: number;

  beforeAll(async () => {
    const { user } = await createUserAccount(
      'Jo',
      'Doe',
      'jodoe@gmail.com',
      'joD0ePa$$',
      'pending',
      [ROLES.CUSTOMER.roleId],
    );
    userId = user.userId;
  });

  it('should verify the email', async () => {
    await usersService.verifyEmail(userId);

    const otp = await AuthOTP.findOne({
      where: { userId, type: 'email' },
      raw: true,
    });
    expect(otp).toBeNull();

    const account = await UserAccount.findOne({
      where: { userId, status: 'active' },
      raw: true,
    });
    expect(account).not.toBeNull();
  });

  it('should roll back transaction when an error occurs', async () => {
    const { otpId } = await AuthOTP.create({
      userId,
      type: 'email',
      password: '123456',
      expiresAt: AuthOTP.getExpiration(),
    });

    const { update } = UserAccount;
    UserAccount.update = jest.fn().mockRejectedValue(new Error('Mock Error'));

    try {
      await usersService.verifyEmail(userId);

      expect(false).toBe(true);
    } catch (e) {
      const otp = await AuthOTP.findByPk(otpId, { raw: true });
      expect(otp).not.toBeNull();
    }

    UserAccount.update = update;
  });
});

describe('update user name ', () => {
  const firstName = 'Jazz';
  const lastName = 'Doe';

  const newFirst = 'Jasmine';
  const newLast = 'Dough';

  const userId = 1234;

  beforeEach(async () => {
    await User.destroy({ where: { userId } });

    await User.create({ userId, firstName, lastName });
    await UserAccount.create({
      userId,
      email: 'jazzdoe@gmail.com',
      password: 'JazzD0ePa$$',
      status: 'active',
    });
  });

  const testUpdateUser = async (
    fName: string | undefined,
    lName: string | undefined,
    expectedFirst: string,
    expectedLast: string,
    expectedResult: 1 | 0,
  ) => {
    const result = await usersService.updateUser(userId, fName, lName);
    expect(result[0]).toBe(expectedResult);

    const user = await User.findOne({
      where: { userId, firstName: expectedFirst, lastName: expectedLast },
      raw: true,
    });
    expect(user).not.toBeNull();
  };

  it('should update user if both firstName and lastName are provided', async () => {
    await testUpdateUser(newFirst, newLast, newFirst, newLast, 1);
  });

  describe('should update user if firstName is provided', () => {
    it('but lastName is an empty string', async () => {
      await testUpdateUser(newFirst, '', newFirst, lastName, 1);
    });

    it('but lastName is a blank space', async () => {
      await testUpdateUser(newFirst, ' ', newFirst, lastName, 1);
    });

    it('but lastName is undefined', async () => {
      await testUpdateUser(newFirst, undefined, newFirst, lastName, 1);
    });
  });

  describe('should update user if lastName is provided', () => {
    it('but firstName is an empty string', async () => {
      await testUpdateUser('', newLast, firstName, newLast, 1);
    });

    it('but firstName is a blank space', async () => {
      await testUpdateUser(' ', newLast, firstName, newLast, 1);
    });

    it('but firstName is undefined', async () => {
      await testUpdateUser(undefined, newLast, firstName, newLast, 1);
    });
  });

  describe('should not update user', () => {
    it('if both firstName and lastName are empty strings', async () => {
      await testUpdateUser('', '', firstName, lastName, 0);
    });

    it('if both firstName and lastName are blank spaces', async () => {
      await testUpdateUser(' ', ' ', firstName, lastName, 0);
    });

    it('if both firstName and lastName are undefined', async () => {
      await testUpdateUser(undefined, undefined, firstName, lastName, 0);
    });
  });
});

describe('create password', () => {
  it('should create password if user password is null', async () => {
    const { userId, account } = await createUserAccountAndIdentity(
      'Josephine',
      'Doe',
      'josephinedoe@gmail.com',
      null,
      'active',
      [{ identityId: '923042892739426871638', provider: 'google' }],
      [ROLES.CUSTOMER.roleId],
    );
    const password = 'josephineD0ePa$$';
    expect(account.comparePasswords(password)).toBe(false);

    const result = await usersService.createPassword(userId, password);
    expect(result[0]).toBe(1);

    const retrievedAcct = await UserAccount.findByPk(userId);
    expect(retrievedAcct?.comparePasswords(password)).toBe(true);
  });

  it('should not create password if user password is null', async () => {
    const { userId, account } = await createUserAccount(
      'Julie',
      'Doe',
      'juliedoe@gmail.com',
      'julieD0ePa$$',
      'active',
      [ROLES.CUSTOMER.roleId],
    );
    const newPassword = 'newjulieD0ePa$$';
    expect(account.comparePasswords(newPassword)).toBe(false);

    const result = await usersService.createPassword(userId, newPassword);
    expect(result[0]).toBe(0);

    const retrievedAcct = await UserAccount.findByPk(userId);
    expect(retrievedAcct?.comparePasswords(newPassword)).toBe(false);
  });
});

describe('change password', () => {
  it('should change password and return true for valid userId', async () => {
    const password = 'jeanD0epa$$';
    const newPassword = 'newjeanD0epa$$';

    const { userId } = await createUserAccount(
      'Jean Paul',
      'Doe',
      'jeanpauldoe@gmail.com',
      password,
      'active',
      [ROLES.CUSTOMER.roleId],
    );

    const result = await usersService.changePassword(
      userId,
      password,
      newPassword,
    );
    expect(result).toBe(true);

    const a = await UserAccount.findOne({ where: { userId } });
    expect(a?.comparePasswords(newPassword)).toBe(true);
  });

  it('should return false for wrong current password', async () => {
    const password = 'julietteD0epa$$';
    const newPassword = 'newjeanD0epa$$';

    const { userId } = await createUserAccount(
      'Juliette',
      'Doe',
      'juliettepauldoe@gmail.com',
      password,
      'active',
      [ROLES.CUSTOMER.roleId],
    );

    const result = await usersService.changePassword(
      userId,
      newPassword,
      newPassword,
    );

    expect(result).toBe(false);

    const a = await UserAccount.findOne({ where: { userId } });
    expect(a?.comparePasswords(newPassword)).toBe(false);
    expect(a?.comparePasswords(password)).toBe(true);
  });

  it('should return false if user_account password is null', async () => {
    const newPassword = 'newjolieD0epa$$';

    const { userId, account } = await createUserAccount(
      'Jolie',
      'Doe',
      'joliepauldoe@gmail.com',
      null,
      'active',
      [ROLES.CUSTOMER.roleId],
    );

    expect(account.password).toBeNull();

    const result = await usersService.changePassword(
      userId,
      'somePassword',
      newPassword,
    );

    expect(result).toBe(false);

    const a = await UserAccount.findByPk(userId, { raw: true });
    expect(a?.password).toBeNull();
  });

  it('should return false for invalid userId', async () => {
    const result = await usersService.changePassword(
      10000,
      'wrongOldPassword',
      'newpassword',
    );

    expect(result).toBe(false);
  });
});

describe('revoke social authentication', () => {
  it('should delete identity if user has an account with a password', async () => {
    const provider = 'google';

    const { userId, account } = await createUserAccountAndIdentity(
      'Jessica',
      'Doe',
      'jessicadoe@gmail.com',
      'jessicaD0ePa$$',
      'active',
      [{ identityId: '3654755345356474363', provider }],
      [ROLES.CUSTOMER.roleId],
    );

    expect(account.password).not.toBeNull();

    const result = await usersService.revokeSocialAuthentication(
      userId,
      provider,
    );

    expect(result.account).toBe(true);
    expect(result.user).toBeUndefined();
    expect(result.identity).toBeUndefined();
    expect(result.otherIdentity).toBeUndefined();

    const i = await UserIdentity.findOne({
      where: { userId, provider },
      raw: true,
    });
    expect(i).toBeNull();

    const a = await UserAccount.findByPk(userId, { raw: true });
    expect(a).not.toBeNull();

    const u = await User.findByPk(userId, { raw: true });
    expect(u).not.toBeNull();
  });

  it('should delete identity if user has no account with password but other identities', async () => {
    const { userId, account } = await createUserAccountAndIdentity(
      'Jack',
      'Doe',
      'jackdoe@gmail.com',
      null,
      'active',
      [
        { identityId: '52429584297428924', provider: 'google' },
        { identityId: '58991388923428739', provider: 'facebook' },
      ],
      [ROLES.CUSTOMER.roleId],
    );

    expect(account.password).toBeNull();

    const result = await usersService.revokeSocialAuthentication(
      userId,
      'facebook',
    );

    expect(result.account).toBeUndefined();
    expect(result.user).toBeUndefined();
    expect(result.identity).toBe(true);
    expect(result.otherIdentity).toBe('google');

    let i = await UserIdentity.findOne({
      where: { userId, provider: 'facebook' },
      raw: true,
    });
    expect(i).toBeNull();

    i = await UserIdentity.findOne({
      where: { userId, provider: 'google' },
      raw: true,
    });
    expect(i).not.toBeNull();

    const a = await UserAccount.findByPk(userId, { raw: true });
    expect(a).not.toBeNull();
    expect(a?.password).toBeNull();

    const u = await User.findByPk(userId, { raw: true });
    expect(u).not.toBeNull();
  });

  it('should delete user if user has neither an account with a password nor anothor identitiy', async () => {
    const provider = 'google';

    const { userId, account } = await createUserAccountAndIdentity(
      'Jess',
      'Doe',
      'jessdoe@gmail.com',
      null,
      'active',
      [{ identityId: '94044248328749827', provider }],
      [ROLES.CUSTOMER.roleId],
    );

    expect(account.password).toBeNull();

    const result = await usersService.revokeSocialAuthentication(
      userId,
      provider,
    );

    expect(result.account).toBeUndefined();
    expect(result.user).toBe(true);
    expect(result.identity).toBeUndefined();
    expect(result.otherIdentity).toBeUndefined();

    const i = await UserIdentity.findOne({
      where: { userId, provider },
      raw: true,
    });
    expect(i).toBeNull();

    const a = await UserAccount.findByPk(userId, { raw: true });
    expect(a).toBeNull();

    const u = await User.findByPk(userId, { raw: true });
    expect(u).toBeNull();
  });
});

describe('close account', () => {
  it('should deactivate account if user has an account password', async () => {
    const { userId, account } = await createUserAccountAndIdentity(
      'Jeff',
      'Doe',
      'jeffdoe@gmail.com',
      'jeffD0ePa$$',
      'active',
      [{ identityId: '2435674867433235', provider: 'google' }],
      [ROLES.CUSTOMER.roleId],
    );

    expect(account.password).not.toBeNull();

    await usersService.closeAccount(userId);

    const i = await UserIdentity.findOne({ where: { userId }, raw: true });
    expect(i).toBeNull();

    const a = await UserAccount.findByPk(userId, { raw: true });
    expect(a).not.toBeNull();

    const u = await User.findByPk(userId, { raw: true });
    expect(u).not.toBeNull();
  });

  it('should delete user if user does not have an account password', async () => {
    const { userId, account } = await createUserAccountAndIdentity(
      'James',
      'Doe',
      'jamesdoe@gmail.com',
      null,
      'active',
      [{ identityId: '23274274781623876298', provider: 'google' }],
      [ROLES.CUSTOMER.roleId],
    );

    expect(account.password).toBeNull();

    await usersService.closeAccount(userId);

    const i = await UserIdentity.findOne({ where: { userId }, raw: true });
    expect(i).toBeNull();

    const a = await UserAccount.findByPk(userId, { raw: true });
    expect(a).toBeNull();

    const u = await User.findByPk(userId, { raw: true });
    expect(u).toBeNull();
  });
});
