import request from 'supertest';
import app from '../server.js';
import userModel from '../models/userModel.js';
import orderModel from '../models/orderModel.js';
import { createAndConnectTestDB, clearTestDB, closeTestDB } from '../config/testDb.js';
import { comparePassword ,hashPassword } from '../helpers/authHelper.js';
import JWT from 'jsonwebtoken';

const VALID_USER = {
  name: 'John Doe',
  email: 'john@example.com',
  password: 'password123',
  phone: '12345678',
  address: '123 Main St',
  answer: 'Blue'
};

const ADMIN_USER = {
  name: 'Admin User',
  email: 'admin@example.com',
  password: 'adminpass123',
  phone: '87654321',
  address: '456 Admin Ave',
  answer: 'Red',
  role: 1
};

describe('Auth Controller', () => {
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

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully with status 200', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(VALID_USER);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(expect.objectContaining({
        success: true,
        message: 'User Register Successfully',
        user: expect.objectContaining({
          name: VALID_USER.name,
          email: VALID_USER.email,
          phone: VALID_USER.phone,
          address: VALID_USER.address,
          answer: VALID_USER.answer,
          role: 0
        })
      }));

      // Verify user exists in database
      const dbUser = await userModel.findOne({ email: VALID_USER.email });
      expect(dbUser).toBeTruthy();
      expect(dbUser.name).toBe(VALID_USER.name);
      
      // Verify password is hashed, not plain text
      expect(dbUser.password).not.toBe(VALID_USER.password);
      const isPasswordValid = await comparePassword(VALID_USER.password, dbUser.password);
      expect(isPasswordValid).toBe(true);
    });
  });
});