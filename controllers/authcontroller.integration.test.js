import request from 'supertest';
import app from '../server.js';
import userModel from '../models/userModel.js';
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
    jest.clearAllMocks();
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

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      // Create a user for login tests
      const hashedPassword = await hashPassword(VALID_USER.password);
      await userModel.create({
        ...VALID_USER,
        password: hashedPassword
      });
    });

    describe('Successful Login', () => {
      it('should login successfully with valid credentials', async () => {

        // Act
        const res = await request(app)
          .post('/api/v1/auth/login')
          .send({
            email: VALID_USER.email,
            password: VALID_USER.password
          });

        // Arrange
        expect(res.status).toBe(200);
        expect(res.body).toEqual(expect.objectContaining({
          success: true,
          message: 'Login successfully',
          user: expect.objectContaining({
            _id: expect.any(String),
            name: VALID_USER.name,
            email: VALID_USER.email,
            phone: VALID_USER.phone,
            address: VALID_USER.address,
            role: 0
          }),
          token: expect.any(String)
        }));

        // Verify token is valid
        const decoded = JWT.verify(res.body.token, process.env.JWT_SECRET);
        expect(decoded._id).toBeTruthy();
      });
    });

    describe('Missing Fields', () => {
      it('should return 200 with error when email is missing', async () => {
        const res = await request(app)
          .post('/api/v1/auth/login')
          .send({
            password: VALID_USER.password
          });

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
          success: false,
          message: 'Email and password are required'
        });
      });

      it('should return 200 with error when password is missing', async () => {
        const res = await request(app)
          .post('/api/v1/auth/login')
          .send({
            email: VALID_USER.email
          });

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
          success: false,
          message: 'Email and password are required'
        });
      });
    });

    describe('Invalid Email or Password', () => {
      it('should return 401 with invalid email', async () => {
        const res = await request(app)
          .post('/api/v1/auth/login')
          .send({
            email: 'nonexistent@example.com',
            password: VALID_USER.password
          });

        expect(res.status).toBe(401);
        expect(res.body).toEqual({
          success: false,
          message: 'Invalid email or password'
        });
      });

      it('should return 401 with invalid password', async () => {
        const res = await request(app)
          .post('/api/v1/auth/login')
          .send({
            email: VALID_USER.email,
            password: 'wrongpassword'
          });

        expect(res.status).toBe(401);
        expect(res.body).toEqual({
          success: false,
          message: 'Invalid email or password'
        });
      });
    });

    describe('Server Error', () => {
      it('should return 500 if a server error occurs', async () => {
        // Arrange
        jest.spyOn(userModel, 'findOne').mockImplementationOnce(() => {
          throw new Error('DB error');
        });

        // Act
        const res = await request(app)
          .post('/api/v1/auth/login')
          .send({ email: 'some@example.com', password: '123456' });

        // Assert
        expect(res.status).toBe(500);
        expect(res.body).toEqual(expect.objectContaining({
          success: false,
          message: 'Error in login',
        }));
      });
    });
  });

  describe('POST /api/v1/auth/forgot-password', () => {
    beforeEach(async () => {
      const hashedPassword = await hashPassword(VALID_USER.password);
      await userModel.create({
        ...VALID_USER,
        password: hashedPassword
      });
    });

    describe('Successful Reset', () => {
      it('should reset password successfully with valid data', async () => {
        // Arrange
        const newPassword = 'newpassword123';

        // Act
        const res = await request(app)
          .post('/api/v1/auth/forgot-password')
          .send({
            email: VALID_USER.email,
            answer: VALID_USER.answer,
            newPassword: newPassword
          });

        // Assert
        expect(res.status).toBe(200);
        expect(res.body).toEqual({
          success: true,
          message: 'Password Reset Successfully'
        });

        // Verify password was actually updated in database
        const user = await userModel.findOne({ email: VALID_USER.email });
        const isNewPasswordValid = await comparePassword(newPassword, user.password);
        expect(isNewPasswordValid).toBe(true);

        // Verify old password no longer works
        const isOldPasswordValid = await comparePassword(VALID_USER.password, user.password);
        expect(isOldPasswordValid).toBe(false);
      });
    });

    describe('Missing Fields', () => {
      it('should return 400 when email is missing', async () => {
        // Arrange & Act
        const res = await request(app)
          .post('/api/v1/auth/forgot-password')
          .send({
            answer: VALID_USER.answer,
            newPassword: 'newpass'
          });
        
        // Assert
        expect(res.status).toBe(400);
        expect(res.body).toEqual({
          success: false,
          message: 'Email is required'
        });
      });

      it('should return 400 when answer is missing', async () => {
        // Arrange & Act
        const res = await request(app)
          .post('/api/v1/auth/forgot-password')
          .send({
            email: VALID_USER.email,
            newPassword: 'newpass'
          });

        // Assert
        expect(res.status).toBe(400);
        expect(res.body).toEqual({
          success: false,
          message: 'Answer is required'
        });
      });

      it('should return 400 when newPassword is missing', async () => {
        // Arrange & Act
        const res = await request(app)
          .post('/api/v1/auth/forgot-password')
          .send({
            email: VALID_USER.email,
            answer: VALID_USER.answer
          });

        // Assert
        expect(res.status).toBe(400);
        expect(res.body).toEqual({
          success: false,
          message: 'New Password is required'
        });
      });
    });

    describe('Invalid Credentials', () => {
      it('should return 401 with wrong email', async () => {
        // Arrange & Act
        const res = await request(app)
          .post('/api/v1/auth/forgot-password')
          .send({
            email: 'wrong@example.com',
            answer: VALID_USER.answer,
            newPassword: 'newpass'
          });
        
        // Assert
        expect(res.status).toBe(401);
        expect(res.body).toEqual({
          success: false,
          message: 'Wrong Email Or Answer'
        });
      });

      it('should return 401 with wrong answer', async () => {
        // Arrange & Act
        const res = await request(app)
          .post('/api/v1/auth/forgot-password')
          .send({
            email: VALID_USER.email,
            answer: 'WrongAnswer',
            newPassword: 'newpass'
          });

        // Assert
        expect(res.status).toBe(401);
        expect(res.body).toEqual({
          success: false,
          message: 'Wrong Email Or Answer'
        });
      });
    });
    
    describe('Server Error', () => {
      it('should return 500 if a network error occurs during password reset', async () => {
        // Arrange
        jest.spyOn(userModel, 'findOne').mockRejectedValueOnce(new Error('Network error'));

        // Act
        const res = await request(app)
          .post('/api/v1/auth/forgot-password')
          .send({
            email: 'user@example.com',
            answer: 'My favorite color',
            newPassword: 'newpassword123',
          });

        // Assert
        expect(res.status).toBe(500);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Something went wrong');
        expect(res.body.error).toBeDefined();
      });    
    });
  });

  describe('PUT /api/v1/auth/profile', () => {
    let authToken;
    let userId;

    beforeEach(async () => {
      // Create a user for profile update tests
      const hashedPassword = await hashPassword(VALID_USER.password);
      const user = await userModel.create({
        ...VALID_USER,
        password: hashedPassword
      });
      userId = user._id.toString();

      // Generate token for authenticated requests
      authToken = JWT.sign({ _id: userId }, process.env.JWT_SECRET, {
        expiresIn: '7d'
      });
    });

    describe('Successful Profile Update', () => {
      it('should update profile successfully with all fields', async () => {
        // Arrange
        const updateData = {
          name: 'Updated Name',
          password: 'newpassword123',
          phone: '99999999',
          address: '999 New Address'
        };

        // Act
        const res = await request(app)
          .put('/api/v1/auth/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData);

        // Assert
        expect(res.status).toBe(200);
        expect(res.body).toEqual(expect.objectContaining({
          success: true,
          message: 'Profile Updated Successfully',
          updatedUser: expect.objectContaining({
            name: updateData.name,
            phone: updateData.phone,
            address: updateData.address
          })
        }));

        // Verify updates in database
        const user = await userModel.findById(userId);
        expect(user.name).toBe(updateData.name);
        expect(user.phone).toBe(updateData.phone);
        expect(user.address).toBe(updateData.address);
        
        // Verify password was updated
        const isPasswordValid = await comparePassword(updateData.password, user.password);
        expect(isPasswordValid).toBe(true);
      });

      it('should update only name when other fields not provided', async () => {
        // Arrange
        const updateData = {
          name: 'Updated Name',
        };

        const originalUser = await userModel.findById(userId);

        // Act
        const res = await request(app)
          .put('/api/v1/auth/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData);

        // Assert
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        const updatedUser = await userModel.findById(userId);
        expect(updatedUser.name).toBe('Updated Name');
        expect(updatedUser.phone).toBe(originalUser.phone);
        expect(updatedUser.address).toBe(originalUser.address);
      });

      it('should update only phone when other fields not provided', async () => {
        // Arrange
        const originalUser = await userModel.findById(userId);
        const newPhone = '88888888';

        // Act
        const res = await request(app)
          .put('/api/v1/auth/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ phone: newPhone });

        // Assert
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.updatedUser.phone).toBe(newPhone);

        const updatedUser = await userModel.findById(userId);
        expect(updatedUser.phone).toBe(newPhone);
        expect(updatedUser.name).toBe(originalUser.name);
        expect(updatedUser.address).toBe(originalUser.address);
        expect(updatedUser.password).toBe(originalUser.password);
      });

      it('should update only address when other fields not provided', async () => {
        // Arrange
        const originalUser = await userModel.findById(userId);
        const newAddress = '999 New Street, New City';

        // Act
        const res = await request(app)
          .put('/api/v1/auth/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ address: newAddress });

        // Assert
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.updatedUser.address).toBe(newAddress);

        const updatedUser = await userModel.findById(userId);
        expect(updatedUser.address).toBe(newAddress);
        expect(updatedUser.name).toBe(originalUser.name);
        expect(updatedUser.phone).toBe(originalUser.phone);
        expect(updatedUser.password).toBe(originalUser.password);
      });

      it('should update only password when other fields not provided', async () => {
        // Arrange
        const newPassword = 'newpass123';

        // Act
        const res = await request(app)
          .put('/api/v1/auth/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ password: newPassword });

        // Assert
        expect(res.status).toBe(200);
        
        const updatedUser = await userModel.findById(userId);
        const isNewPasswordValid = await comparePassword(newPassword, updatedUser.password);
        expect(isNewPasswordValid).toBe(true);
      });

      it('should update profile without changing password when password not provided', async () => {
        // Arrange
        const originalUser = await userModel.findById(userId);
        const originalPasswordHash = originalUser.password;

        // Act
        const res = await request(app)
          .put('/api/v1/auth/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ name: 'Updated Name', phone: '88888888' });

        // Assert
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        const updatedUser = await userModel.findById(userId);
        expect(updatedUser.password).toBe(originalPasswordHash);
      });

      it('should not update email even if provided', async () => {
        // Arrange
        const originalUser = await userModel.findById(userId);
        const originalEmail = originalUser.email;

        // Act
        const res = await request(app)
          .put('/api/v1/auth/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ 
            email: 'newemail@example.com',
            name: 'Updated Name'
          });

        // Assert
        expect(res.status).toBe(200);
        
        const updatedUser = await userModel.findById(userId);
        // Email should NOT change
        expect(updatedUser.email).toBe(originalEmail);
        expect(updatedUser.email).not.toBe('newemail@example.com');
        // But name should change
        expect(updatedUser.name).toBe('Updated Name');
      });

      it('should update multiple fields except email even though it is provided', async () => {
        // Arrange
        const originalUser = await userModel.findById(userId);
        const updateData = {
          name: 'New Name',
          phone: '77777777',
          address: '777 New Address',
          email: 'shouldnotchange@example.com' // This should be ignored
        };

        // Act
        const res = await request(app)
          .put('/api/v1/auth/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData);

        // Assert
        expect(res.status).toBe(200);

        const updatedUser = await userModel.findById(userId);
        expect(updatedUser.name).toBe(updateData.name);
        expect(updatedUser.phone).toBe(updateData.phone);
        expect(updatedUser.address).toBe(updateData.address);
        // Email should NOT change
        expect(updatedUser.email).toBe(originalUser.email);
        expect(updatedUser.email).not.toBe('shouldnotchange@example.com');
      });
    });

    describe('Authentication Errors', () => {
      it('should return 401 when authorization header is missing', async () => {
        // Act
        const res = await request(app)
          .put('/api/v1/auth/profile')
          .send({ name: 'Test' });

        // Assert
        expect(res.status).toBe(401);
      });

      it('should return 401 when token is invalid', async () => {
        // Act
        const res = await request(app)
          .put('/api/v1/auth/profile')
          .set('Authorization', 'Bearer invalid-token')
          .send({ name: 'Test' });

        // Assert
        expect(res.status).toBe(401);
      });

      it('should return 401 when user not found in database', async () => {
        // Arrange
        const mongoose = require('mongoose');
        const fakeUserId = new mongoose.Types.ObjectId();
        const fakeToken = JWT.sign({ _id: fakeUserId }, process.env.JWT_SECRET, {
          expiresIn: '7d'
        });

        // Act
        const res = await request(app)
          .put('/api/v1/auth/profile')
          .set('Authorization', `Bearer ${fakeToken}`)
          .send({ name: 'Test' });

        // Assert
        expect(res.status).toBe(401);
        expect(res.body).toEqual({
          success: false,
          message: 'User not found, please authenticate'
        });
      });
    });

    describe('Validation Errors', () => {
      it('should return 401 when password is too short', async () => {
        // Act
        const res = await request(app)
          .put('/api/v1/auth/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            password: '12345' // Only 5 characters, needs at least 6
          });

        // Assert
        expect(res.status).toBe(401);
        expect(res.body).toEqual({
          success: false,
          message: 'Password is required and must be at least 6 characters long.'
        });

        // Verify password was NOT updated
        const user = await userModel.findById(userId);
        const isOldPasswordStill = await comparePassword(VALID_USER.password, user.password);
        expect(isOldPasswordStill).toBe(true);
      });

      it('should accept password with 6 or more characters', async () => {
        // Act
        const res = await request(app)
          .put('/api/v1/auth/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            password: '123456' // Exactly 6 characters
          });

        // Assert
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });
    });

    describe('Server Error', () => {
      it('should return 500 if a server error occurs', async () => {
        // Arrange
        jest.spyOn(userModel, 'findById').mockImplementationOnce(() => {
          throw new Error('DB error');
        });

        // Act
        const res = await request(app)
          .put('/api/v1/auth/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ name: 'Test' });

        // Assert
        expect(res.status).toBe(500);
        expect(res.body).toEqual(expect.objectContaining({
          success: false,
          message: 'Error While Updating Profile',
        }));
      });
    });
  });
});