import { AdminOTP, AdminPhone, Phone } from '@app/modules/user/models';
import tokenService from '@app/modules/user/services/token.service';
import { ROLES } from '@app/modules/user/utils/constants';

import { request } from 'tests/supertest.helper';
import { createAdmin, createRoles } from '../helper-functions';

import 'tests/db-setup';

const BASE_URL = '/api/admins/me/phone';

describe('Phone number management', () => {
  const mockOTP = '12345';
  const phoneNumber = '1234567890';

  let adminId: number;
  let jwt: string;

  beforeAll(async () => {
    await createRoles();

    const { admin, email } = await createAdmin(
      'Jamal',
      'Doe',
      'jamaldoe@gmail.com',
      'jamalD0ePa$$',
      'active',
      [ROLES.CUSTOMER_SUPPORT.roleId],
    );

    adminId = admin.adminId;
    jwt = tokenService.generateAccessToken(email.email, 'email');
  });

  it(`POST ${BASE_URL} should register a new phone number`, async () => {
    let phone = await Phone.findOne({ where: { phoneNumber }, raw: true });

    let adminPhone = await AdminPhone.findOne({
      where: { adminId },
      raw: true,
    });

    let otp = await AdminOTP.findOne({
      where: { adminId, type: 'phone' },
      raw: true,
    });

    expect(phone).toBeNull();
    expect(adminPhone).toBeNull();
    expect(otp).toBeNull();

    await request
      .post(BASE_URL)
      .send({ phoneNumber })
      .auth(jwt, { type: 'bearer' })
      .expect(200);

    phone = await Phone.findOne({
      where: { phoneNumber },
      raw: true,
    });

    adminPhone = await AdminPhone.findOne({
      where: { adminId },
      raw: true,
    });

    otp = await AdminOTP.findOne({
      where: { adminId, type: 'phone' },
      raw: true,
    });

    expect(phone).not.toBeNull();
    expect(adminPhone).not.toBeNull();
    expect(otp).not.toBeNull();
  });

  it(`PATCH ${BASE_URL}/resend should create a new otp`, async () => {
    const otp1 = await AdminOTP.findOne({
      where: { adminId, type: 'phone' },
      raw: true,
    });

    await request
      .patch(`${BASE_URL}/resend`)
      .auth(jwt, { type: 'bearer' })
      .expect(200);

    const otp2 = await AdminOTP.findOne({
      where: { adminId, type: 'phone' },
      raw: true,
    });

    expect(otp1?.otpId).not.toBe(otp2?.otpId);
  });

  it(`PATCH ${BASE_URL}/:otp should fail to verify phone number on invalid otp`, async () => {
    let phone = await AdminPhone.findOne({
      where: { adminId, status: 'pending' },
      raw: true,
    });
    expect(phone).not.toBeNull();

    await request
      .patch(`${BASE_URL}/01010`)
      .auth(jwt, { type: 'bearer' })
      .expect(401);

    phone = await AdminPhone.findOne({
      where: { adminId, status: 'pending' },
      raw: true,
    });
    expect(phone).not.toBeNull();
  });

  it(`PATCH ${BASE_URL}/:otp should verify phone number on valid otp`, async () => {
    let phone = await AdminPhone.findOne({
      where: { adminId, status: 'pending' },
      raw: true,
    });
    expect(phone).not.toBeNull();

    let otp = await AdminOTP.findOne({
      where: { adminId, type: 'phone' },
      raw: true,
    });

    expect(otp).not.toBeNull();

    await request
      .patch(`${BASE_URL}/${mockOTP}`)
      .auth(jwt, { type: 'bearer' })
      .expect(200);

    phone = await AdminPhone.findOne({
      where: { adminId, status: 'active' },
      raw: true,
    });
    expect(phone).not.toBeNull();

    otp = await AdminOTP.findOne({
      where: { adminId, type: 'phone' },
      raw: true,
    });
    expect(otp).toBeNull();
  });

  it(`DELETE ${BASE_URL} should delete phone number`, async () => {
    let phone = await AdminPhone.findOne({ where: { adminId }, raw: true });
    expect(phone).not.toBeNull();

    await request
      .delete(`${BASE_URL}`)
      .auth(jwt, { type: 'bearer' })
      .expect(200);

    phone = await AdminPhone.findOne({ where: { adminId }, raw: true });
    expect(phone).toBeNull();
  });
});
