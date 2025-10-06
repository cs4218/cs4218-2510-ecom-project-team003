import bcrypt from 'bcrypt';
import { hashPassword, comparePassword } from './authHelper.js';

jest.mock('bcrypt');

describe('Auth Helper Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hashPassword', () => {
    it('hashes password successfully with saltRounds of 10', async () => {
      // Arrange
      const password = 'mySecurePassword123';
      const mockHashedPassword = '$2b$10$hashedPasswordString';
      bcrypt.hash.mockResolvedValue(mockHashedPassword);

      // Act
      const result = await hashPassword(password);

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(result).toBe(mockHashedPassword);
    });
  });

  describe('comparePassword', () => {
    it('returns true when passwords match', async () => {
      // Arrange
      const password = 'myPassword123';
      const hashedPassword = '$2b$10$hashedPasswordString';
      bcrypt.compare.mockResolvedValue(true);

      // Act
      const result = await comparePassword(password, hashedPassword);

      // Assert
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(result).toBe(true);
    });

    it('returns false when passwords do not match', async () => {
      // Arrange
      const password = 'wrongPassword';
      const hashedPassword = '$2b$10$hashedPasswordString';
      bcrypt.compare.mockResolvedValue(false);

      // Act
      const result = await comparePassword(password, hashedPassword);

      // Assert
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(result).toBe(false);
    });
  });
});