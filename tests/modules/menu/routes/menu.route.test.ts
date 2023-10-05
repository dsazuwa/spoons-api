import { request } from 'tests/supertest.helper';

import { createMenu } from 'tests/modules/menu/helper-functions';

import 'tests/db-setup';

const BASE_URL = '/api/menu';

beforeAll(async () => {
  await createMenu();
});

it(`GET ${BASE_URL} should return current menu`, async () => {
  const response = await request.get(BASE_URL);
  expect(response.status).toBe(200);

  const { menu } = response.body;
  expect(menu.length).toBe(3);
});

it(`GET ${BASE_URL}/grouped should return current menu grouped by category`, async () => {
  const response = await request.get(`${BASE_URL}/grouped`);
  expect(response.status).toBe(200);

  const { menu } = response.body;

  const { bowls } = menu;
  expect(bowls.items.length).toBe(2);

  const { kids } = menu;
  expect(kids.items.length).toBe(1);
});
