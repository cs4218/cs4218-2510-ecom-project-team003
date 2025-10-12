import { createAndConnectTestDB, clearTestDB, closeTestDB } from './config/testDb';

beforeAll(async () => {
  await createAndConnectTestDB();
  await clearTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await closeTestDB();
});