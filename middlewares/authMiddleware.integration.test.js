import request from 'supertest';
import app from '../server.js';
import userModel from '../models/userModel.js';
import { createAndConnectTestDB, clearTestDB, closeTestDB } from '../config/testDb.js';
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

describe('Auth Middleware', () => {
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

  let validToken;
  let adminToken;
  let validUser;
  let adminUser;

  beforeEach(async () => {
    // Register users
    validUser = await userModel.create(VALID_USER);
    adminUser = await userModel.create(ADMIN_USER);

    // Generate JWT tokens for both users
    validToken = JWT.sign({ _id: validUser._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    adminToken = JWT.sign({ _id: adminUser._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  });

  describe('requireSignIn Middleware', () => {
    it('should pass if a valid token is provided', async () => {
      // Act
      const res = await request(app)
        .get('/api/v1/auth/user-auth')
        .set('Authorization', `Bearer ${validToken}`);

      // Assert
      expect(res.status).toBe(200);
      expect(res.body).toEqual(expect.objectContaining({
        "ok": true,
      }));
    });

    it('should pass if a admin token is provided', async () => {
      // Act
      const res = await request(app)
        .get('/api/v1/auth/user-auth')
        .set('Authorization', `Bearer ${adminToken}`);

      // Assert
      expect(res.status).toBe(200);
      expect(res.body).toEqual(expect.objectContaining({
        "ok": true,
      }));
    });

    it('should return 401 if no token is provided', async () => {
      // Act
      const res = await request(app)
        .get('/api/v1/auth/user-auth');

      // Assert
      expect(res.status).toBe(401);
      expect(res.body).toEqual({
        success: false,
        message: 'Invalid or expired token'
      });
    });

    it('should return 401 if token is invalid', async () => {
      // Act
      const res = await request(app)
        .get('/api/v1/auth/user-auth')
        .set('Authorization', 'Bearer invalid-token');

      // Assert
      expect(res.status).toBe(401);
      expect(res.body).toEqual({
        success: false,
        message: 'Invalid or expired token'
      });
    });

    it('should return 401 if token is expired', async () => {
      // Arrange
      const expiredToken = JWT.sign(
        { _id: validUser._id }, 
        process.env.JWT_SECRET, 
        { expiresIn: '1s' }
      );

      await new Promise(resolve => setTimeout(resolve, 2000));

      // Act
      const res = await request(app)
        .get('/api/v1/auth/user-auth')
        .set('Authorization', `Bearer ${expiredToken}`);

      // Assert
      expect(res.status).toBe(401);
      expect(res.body).toEqual({
        success: false,
        message: 'Invalid or expired token'
      });
    });

    it('should return 401 if Authorization header is malformed', async () => {
      // Act
      const res = await request(app)
        .get('/api/v1/auth/user-auth')
        .set('Authorization', validToken); // missing "Bearer"

      // Assert
      expect(res.status).toBe(401);
      expect(res.body).toEqual({
        success: false,
        message: 'Invalid or expired token'
      });
    });
  });

  describe('isAdmin Middleware', () => {
    it('should allow access for admin users', async () => {
      // Act
      const res = await request(app)
        .get('/api/v1/auth/admin-auth')
        .set('Authorization', `Bearer ${adminToken}`);

      // Assert
      expect(res.status).toBe(200);
      expect(res.body).toEqual(expect.objectContaining({
        "ok": true
      }));
    });

    it('should deny access for non-admin users', async () => {
      // Act
      const res = await request(app)
        .get('/api/v1/auth/admin-auth')
        .set('Authorization', `Bearer ${validToken}`);

      // Assert
      expect(res.status).toBe(401);
      expect(res.body).toEqual({
        success: false,
        message: 'UnAuthorized Access'
      });
    });

    it('should deny access for invalid token even if user is admin', async () => {
      // Act
      const res = await request(app)
        .get('/api/v1/auth/admin-auth')
        .set('Authorization', 'Bearer invalid-token');

      // Assert
      expect(res.status).toBe(401);
      expect(res.body).toEqual({
        success: false,
        message: 'Invalid or expired token'
      });
    });
  });
});
