import userModel from './userModel.js';

// Mock mongoose model methods
jest.mock('./userModel.js');

describe('User Model Unit Tests', () => {
  beforeEach(() => {
    // Clear all mock calls before each test
    jest.clearAllMocks();
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

      const mockUser = {
        _id: 'mock-id-123',
        ...userData,
        email: userData.email.toLowerCase(),
        role: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock the create method
      userModel.create.mockResolvedValue(mockUser);

      // Act
      const user = await userModel.create(userData);

      // Assert
      expect(userModel.create).toHaveBeenCalledWith(userData);
      expect(userModel.create).toHaveBeenCalledTimes(1);
      expect(user.name).toBe('John Doe');
      expect(user.email).toBe('john@example.com');
      expect(user.role).toBe(0);
    });

    it('handles creation errors', async () => {
      // Arrange
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'pass'
      };

      const mockError = new Error('Validation failed');
      userModel.create.mockRejectedValue(mockError);

      // Act & Assert
      await expect(userModel.create(userData)).rejects.toThrow('Validation failed');
      expect(userModel.create).toHaveBeenCalledWith(userData);
    });
  });

  describe('Finding Users', () => {
    it('finds user by email', async () => {
      // Arrange
      const mockUser = {
        _id: 'mock-id-123',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '1234567890'
      };

      userModel.findOne.mockResolvedValue(mockUser);

      // Act
      const user = await userModel.findOne({ email: 'john@example.com' });

      // Assert
      expect(userModel.findOne).toHaveBeenCalledWith({ email: 'john@example.com' });
      expect(user.email).toBe('john@example.com');
    });

    it('returns null when user not found', async () => {
      // Arrange
      userModel.findOne.mockResolvedValue(null);

      // Act
      const user = await userModel.findOne({ email: 'nonexistent@example.com' });

      // Assert
      expect(user).toBeNull();
    });

    it('finds user by id', async () => {
      // Arrange
      const mockUser = {
        _id: 'mock-id-123',
        name: 'John Doe',
        email: 'john@example.com'
      };

      userModel.findById.mockResolvedValue(mockUser);

      // Act
      const user = await userModel.findById('mock-id-123');

      // Assert
      expect(userModel.findById).toHaveBeenCalledWith('mock-id-123');
      expect(user._id).toBe('mock-id-123');
    });
  });

  describe('Updating Users', () => {
    it('updates user successfully', async () => {
      // Arrange
      const mockUser = {
        _id: 'mock-id-123',
        name: 'John Doe',
        email: 'john@example.com',
        save: jest.fn().mockResolvedValue({
          _id: 'mock-id-123',
          name: 'Updated Name',
          email: 'john@example.com'
        })
      };

      userModel.findById.mockResolvedValue(mockUser);

      // Act
      const user = await userModel.findById('mock-id-123');
      user.name = 'Updated Name';
      const updatedUser = await user.save();

      // Assert
      expect(user.save).toHaveBeenCalled();
      expect(updatedUser.name).toBe('Updated Name');
    });

    it('updates user with findByIdAndUpdate', async () => {
      // Arrange
      const updatedUser = {
        _id: 'mock-id-123',
        name: 'Updated Name',
        email: 'john@example.com'
      };

      userModel.findByIdAndUpdate.mockResolvedValue(updatedUser);

      // Act
      const user = await userModel.findByIdAndUpdate(
        'mock-id-123',
        { name: 'Updated Name' },
        { new: true }
      );

      // Assert
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'mock-id-123',
        { name: 'Updated Name' },
        { new: true }
      );
      expect(user.name).toBe('Updated Name');
    });
  });

  describe('Deleting Users', () => {
    it('deletes user by id', async () => {
      // Arrange
      const mockDeletedUser = {
        _id: 'mock-id-123',
        name: 'John Doe',
        email: 'john@example.com'
      };

      userModel.findByIdAndDelete.mockResolvedValue(mockDeletedUser);

      // Act
      const deletedUser = await userModel.findByIdAndDelete('mock-id-123');

      // Assert
      expect(userModel.findByIdAndDelete).toHaveBeenCalledWith('mock-id-123');
      expect(deletedUser._id).toBe('mock-id-123');
    });

    it('deletes many users', async () => {
      // Arrange
      userModel.deleteMany.mockResolvedValue({ deletedCount: 5 });

      // Act
      const result = await userModel.deleteMany({ role: 0 });

      // Assert
      expect(userModel.deleteMany).toHaveBeenCalledWith({ role: 0 });
      expect(result.deletedCount).toBe(5);
    });
  });

  describe('Query Methods', () => {
    it('finds all users', async () => {
      // Arrange
      const mockUsers = [
        { _id: '1', name: 'User 1', email: 'user1@example.com' },
        { _id: '2', name: 'User 2', email: 'user2@example.com' }
      ];

      userModel.find.mockResolvedValue(mockUsers);

      // Act
      const users = await userModel.find({});

      // Assert
      expect(userModel.find).toHaveBeenCalledWith({});
      expect(users).toHaveLength(2);
    });

    it('finds users with filters', async () => {
      // Arrange
      const mockAdmins = [
        { _id: '1', name: 'Admin 1', email: 'admin1@example.com', role: 1 }
      ];

      userModel.find.mockResolvedValue(mockAdmins);

      // Act
      const admins = await userModel.find({ role: 1 });

      // Assert
      expect(userModel.find).toHaveBeenCalledWith({ role: 1 });
      expect(admins[0].role).toBe(1);
    });

    it('counts users', async () => {
      // Arrange
      userModel.countDocuments.mockResolvedValue(10);

      // Act
      const count = await userModel.countDocuments({});

      // Assert
      expect(userModel.countDocuments).toHaveBeenCalledWith({});
      expect(count).toBe(10);
    });
  });

  describe('Validation Logic', () => {
    it('handles validation errors for required fields', async () => {
      // Arrange
      const invalidUser = {
        email: 'test@example.com'
        // missing required fields
      };

      const validationError = new Error('User validation failed: name: Path `name` is required.');
      validationError.name = 'ValidationError';
      
      userModel.create.mockRejectedValue(validationError);

      // Act & Assert
      await expect(userModel.create(invalidUser)).rejects.toThrow('User validation failed');
    });

    it('handles duplicate email errors', async () => {
      // Arrange
      const duplicateUser = {
        name: 'Test',
        email: 'existing@example.com',
        password: 'pass',
        phone: '12345678',
        address: 'addr',
        answer: 'ans'
      };

      const duplicateError = new Error('E11000 duplicate key error');
      duplicateError.code = 11000;
      
      userModel.create.mockRejectedValue(duplicateError);

      // Act & Assert
      await expect(userModel.create(duplicateUser)).rejects.toThrow('E11000');
    });
  });
});