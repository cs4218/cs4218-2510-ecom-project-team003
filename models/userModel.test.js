import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import userModel from './userModel.js';

jest.setTimeout(60000); // Increase timeout for MongoMemoryServer first run

describe('User Model Integration Tests', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    await userModel.deleteMany();
  });

  describe('User Creation', () => {
    it('creates a user successfully with valid data', async () => {
      // Arrange
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashedPassword',
        phone: '1234567890',
        address: '123 Street',
        answer: 'Football'
      };

      // Act
      const user = await userModel.create(userData);

      // Assert
      expect(user.name).toBe('John Doe');
      expect(user.email).toBe('john@example.com');
      expect(user.phone).toBe('1234567890');
      expect(user.address).toBe('123 Street');
      expect(user.answer).toBe('Football');
      expect(user.role).toBe(0);
    });

    it('creates timestamps on user creation', async () => {
      // Arrange
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'pass',
        phone: '12345678',
        address: 'addr',
        answer: 'ans'
      };

      // Act
      const user = await userModel.create(userData);

      // Assert
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });
    
    it('updates updatedAt when user is modified', async () => {
      // Arrange
      const userData = {
        name: 'Timestamp Test',
        email: 'timestamp@example.com',
        password: 'pass',
        phone: '12345678',
        address: 'addr',
        answer: 'ans'
      };
      const user = await userModel.create(userData);
      const oldUpdatedAt = user.updatedAt;

      // Act
      user.name = 'Updated Name';
      await user.save();

      // Assert
      expect(user.updatedAt).not.toEqual(oldUpdatedAt);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

  });

  describe('Required Fields Validation', () => {
    it('requires name field', async () => {
      // Arrange
      const userWithoutName = {
        email: 'test@example.com',
        password: 'pass',
        phone: '12345678',
        address: 'addr',
        answer: 'ans'
      };

      // Act & Assert
      await expect(userModel.create(userWithoutName)).rejects.toThrow();
    });

    it('requires email field', async () => {
      // Arrange
      const userWithoutEmail = {
        name: 'Test',
        password: 'pass',
        phone: '12345678',
        address: 'addr',
        answer: 'ans'
      };

      // Act & Assert
      await expect(userModel.create(userWithoutEmail)).rejects.toThrow();
    });

    it('requires password field', async () => {
      // Arrange
      const userWithoutPassword = {
        name: 'Test',
        email: 'test@example.com',
        phone: '12345678',
        address: 'addr',
        answer: 'ans'
      };

      // Act & Assert
      await expect(userModel.create(userWithoutPassword)).rejects.toThrow();
    });

    it('requires phone field', async () => {
      // Arrange
      const userWithoutPhone = {
        name: 'Test',
        email: 'test@example.com',
        password: 'pass',
        address: 'addr',
        answer: 'ans'
      };

      // Act & Assert
      await expect(userModel.create(userWithoutPhone)).rejects.toThrow();
    });

    it('requires address field', async () => {
      // Arrange
      const userWithoutAddress = {
        name: 'Test',
        email: 'test@example.com',
        password: 'pass',
        phone: '12345678',
        answer: 'ans'
      };

      // Act & Assert
      await expect(userModel.create(userWithoutAddress)).rejects.toThrow();
    });

    it('requires answer field', async () => {
      // Arrange
      const userWithoutAnswer = {
        name: 'Test',
        email: 'test@example.com',
        password: 'pass',
        phone: '12345678',
        address: 'addr'
      };

      // Act & Assert
      await expect(userModel.create(userWithoutAnswer)).rejects.toThrow();
    });
  });

  describe('Email Validation', () => {
    it('converts email to lowercase', async () => {
      // Arrange
      const userData = {
        name: 'Test',
        email: 'TEST@EXAMPLE.COM',
        password: 'pass',
        phone: '12345678',
        address: 'addr',
        answer: 'ans'
      };

      // Act
      const user = await userModel.create(userData);

      // Assert
      expect(user.email).toBe('test@example.com');
    });

    it('trims whitespace from email', async () => {
      // Arrange
      const userData = {
        name: 'Test',
        email: '  test@example.com  ',
        password: 'pass',
        phone: '12345678',
        address: 'addr',
        answer: 'ans'
      };

      // Act
      const user = await userModel.create(userData);

      // Assert
      expect(user.email).toBe('test@example.com');
    });

    it('rejects invalid email format', async () => {
      // Arrange
      const invalidEmailUser = {
        name: 'Test',
        email: 'notanemail',
        password: 'pass',
        phone: '12345678',
        address: 'addr',
        answer: 'ans'
      };

      // Act & Assert
      await expect(userModel.create(invalidEmailUser)).rejects.toThrow(/valid email/);
    });

    it('enforces unique email constraint', async () => {
      // Arrange
      await userModel.create({
        name: 'User 1',
        email: 'same@example.com',
        password: 'pass',
        phone: '12345678',
        address: 'addr',
        answer: 'ans'
      });

      // Act & Assert
      await expect(
        userModel.create({
          name: 'User 2',
          email: 'same@example.com',
          password: 'pass',
          phone: '87654321',
          address: 'addr',
          answer: 'ans'
        })
      ).rejects.toThrow();
    });

    it('rejects duplicate emails regardless of case', async () => {
      // Arrange
      await userModel.create({
        name: 'User 1',
        email: 'test@example.com',
        password: 'pass',
        phone: '12345678',
        address: 'addr',
        answer: 'ans'
      });

      // Act & Assert
      await expect(
        userModel.create({
          name: 'User 2',
          email: 'TEST@EXAMPLE.COM', // same as above but uppercase
          password: 'pass',
          phone: '87654321',
          address: 'addr',
          answer: 'ans'
        })
      ).rejects.toThrow();
    });
  });

  describe('Phone Validation', () => {
    it('accepts valid phone number with 8 digits', async () => {
      // Arrange
      const userData = {
        name: 'Test',
        email: 'test@example.com',
        password: 'pass',
        phone: '12345678',
        address: 'addr',
        answer: 'ans'
      };

      // Act
      const user = await userModel.create(userData);

      // Assert
      expect(user.phone).toBe('12345678');
    });

    it('accepts valid phone number with 15 digits', async () => {
      // Arrange
      const userData = {
        name: 'Test',
        email: 'test@example.com',
        password: 'pass',
        phone: '123456789012345',
        address: 'addr',
        answer: 'ans'
      };

      // Act
      const user = await userModel.create(userData);

      // Assert
      expect(user.phone).toBe('123456789012345');
    });

    it('rejects phone number with letters', async () => {
      // Arrange
      const invalidPhoneUser = {
        name: 'Test',
        email: 'test@example.com',
        password: 'pass',
        phone: 'abc12345',
        address: 'addr',
        answer: 'ans'
      };

      // Act & Assert
      await expect(userModel.create(invalidPhoneUser)).rejects.toThrow(/valid phone number/);
    });

    it('rejects phone number too short', async () => {
      // Arrange
      const shortPhoneUser = {
        name: 'Test',
        email: 'test@example.com',
        password: 'pass',
        phone: '1234567',
        address: 'addr',
        answer: 'ans'
      };

      // Act & Assert
      await expect(userModel.create(shortPhoneUser)).rejects.toThrow(/valid phone number/);
    });

    it('rejects phone number too long', async () => {
      // Arrange
      const longPhoneUser = {
        name: 'Test',
        email: 'test@example.com',
        password: 'pass',
        phone: '1234567890123456',
        address: 'addr',
        answer: 'ans'
      };

      // Act & Assert
      await expect(userModel.create(longPhoneUser)).rejects.toThrow(/valid phone number/);
    });
  });

  describe('Default Values', () => {
    it('sets default role to 0 for regular users', async () => {
      // Arrange
      const userData = {
        name: 'Test',
        email: 'test@example.com',
        password: 'pass',
        phone: '12345678',
        address: 'addr',
        answer: 'ans'
      };

      // Act
      const user = await userModel.create(userData);

      // Assert
      expect(user.role).toBe(0);
    });

    it('allows setting custom role', async () => {
      // Arrange
      const adminData = {
        name: 'Admin',
        email: 'admin@example.com',
        password: 'pass',
        phone: '12345678',
        address: 'addr',
        answer: 'ans',
        role: 1
      };

      // Act
      const admin = await userModel.create(adminData);

      // Assert
      expect(admin.role).toBe(1);
    });
  });
});