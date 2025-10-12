import request from 'supertest';
import app from '../server.js';
import userModel from '../models/userModel.js';
import orderModel from '../models/orderModel.js';
import { createAndConnectTestDB, clearTestDB, closeTestDB } from '../config/testDb.js';
import { comparePassword ,hashPassword } from '../helpers/authHelper.js';
import JWT from 'jsonwebtoken';

console.log = jest.fn();

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
    describe('Successful Registration', () => {
      it('should register a new user successfully with status 200', async () => {
        // Arrange (handled globally via VALID_USER)

        // Act
        const res = await request(app)
          .post('/api/v1/auth/register')
          .send(VALID_USER);

        // Assert
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

    describe('Validation Errors', () => {
      it('should return 400 when name is missing', async () => {
        // Arrange
        const userData = { ...VALID_USER };
        delete userData.name;

        // Act
        const res = await request(app)
          .post('/api/v1/auth/register')
          .send(userData);

        // Assert
        expect(res.status).toBe(400);
        expect(res.body).toEqual({
          success: false,
          message: 'Name is required'
        });
      });

      it('should return 400 when email is missing', async () => {
        // Arrange
        const userData = { ...VALID_USER };
        delete userData.email;

        // Act
        const res = await request(app)
          .post('/api/v1/auth/register')
          .send(userData);

        // Assert
        expect(res.status).toBe(400);
        expect(res.body).toEqual({
          success: false,
          message: 'Email is required'
        });
      });

      it('should return 400 when password is missing', async () => {
        // Arrange
        const userData = { ...VALID_USER };
        delete userData.password;

        // Act
        const res = await request(app)
          .post('/api/v1/auth/register')
          .send(userData);

        // Assert
        expect(res.status).toBe(400);
        expect(res.body).toEqual({
          success: false,
          message: 'Password is required'
        });
      });

      it('should return 400 when phone is missing', async () => {
        // Arrange
        const userData = { ...VALID_USER };
        delete userData.phone;

        // Act
        const res = await request(app)
          .post('/api/v1/auth/register')
          .send(userData);

        // Assert
        expect(res.status).toBe(400);
        expect(res.body).toEqual({
          success: false,
          message: 'Phone number is required'
        });
      });

      it('should return 400 when address is missing', async () => {
        // Arrange
        const userData = { ...VALID_USER };
        delete userData.address;

        // Act
        const res = await request(app)
          .post('/api/v1/auth/register')
          .send(userData);

        // Assert
        expect(res.status).toBe(400);
        expect(res.body).toEqual({
          success: false,
          message: 'Address is required'
        });
      });

      it('should return 400 when answer is missing', async () => {
        // Arrange
        const userData = { ...VALID_USER };
        delete userData.answer;

        // Act
        const res = await request(app)
          .post('/api/v1/auth/register')
          .send(userData);

        // Assert
        expect(res.status).toBe(400);
        expect(res.body).toEqual({
          success: false,
          message: 'Answer is required'
        });
      });
    });

    describe('Duplicate User', () => {
      it('should return 409 when user already exists', async () => {
        // Arrange
        // First registration
        await request(app)
          .post('/api/v1/auth/register')
          .send(VALID_USER);

        // Act
        // Attempt duplicate registration
        const res = await request(app)
          .post('/api/v1/auth/register')
          .send(VALID_USER);

        // Assert
        expect(res.status).toBe(409);
        expect(res.body).toEqual({
          success: false,
          message: 'Already Register please login'
        });
      });
    });

    describe('Server Error Handling', () => {
      it('should return 500 if an exception occurs', async () => {
        // Arrange
        jest.spyOn(userModel, 'findOne').mockImplementationOnce(() => { throw new Error('DB error'); });

        // Act
        const res = await request(app).post('/api/v1/auth/register').send(VALID_USER);

        // Assert
        expect(res.status).toBe(500);
        expect(res.body).toEqual(expect.objectContaining({
          success: false,
          message: 'Error in Registration',
        }));
      });
    });
  });
});