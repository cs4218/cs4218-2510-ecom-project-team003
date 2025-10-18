import JWT from 'jsonwebtoken';
import userModel from '../models/userModel.js';
import { requireSignIn, isAdmin } from './authMiddleware.js';

jest.mock('jsonwebtoken');
jest.mock('../models/userModel.js');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      user: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };
    next = jest.fn();
    
    jest.clearAllMocks();
  });

  describe('requireSignIn', () => {
    it('verifies token and calls next on valid token', async () => {
      // Arrange
      const mockToken = 'validToken123';
      const mockDecoded = { _id: 'user123', email: 'test@example.com' };
      
      req.headers.authorization = `Bearer ${mockToken}`;
      JWT.verify.mockReturnValue(mockDecoded);

      // Act
      await requireSignIn(req, res, next);

      // Assert
      expect(JWT.verify).toHaveBeenCalledWith(mockToken, process.env.JWT_SECRET);
      expect(req.user).toEqual(mockDecoded);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('returns 401 when token is invalid', async () => {
      // Arrange
      const invalidToken = 'invalidToken';
      req.headers.authorization = `Bearer ${invalidToken}`;
      JWT.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act
      await requireSignIn(req, res, next);

      // Assert
      expect(JWT.verify).toHaveBeenCalledWith('invalidToken', process.env.JWT_SECRET);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired token'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 when token is missing', async () => {
      // Arrange
      req.headers.authorization = undefined;
      JWT.verify.mockImplementation(() => {
        throw new Error('jwt must be provided');
      });

      // Act
      await requireSignIn(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired token'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 when token is expired', async () => {
      // Arrange
      req.headers.authorization = 'expiredToken';
      JWT.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      // Act
      await requireSignIn(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired token'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('isAdmin', () => {
    it('calls next when user is admin (role = 1)', async () => {
      // Arrange
      req.user = { _id: 'user123' };
      const mockUser = { _id: 'user123', role: 1, name: 'Admin User' };
      userModel.findById.mockResolvedValue(mockUser);

      // Act
      await isAdmin(req, res, next);

      // Assert
      expect(userModel.findById).toHaveBeenCalledWith('user123');
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('returns 401 when user is not admin (role = 0)', async () => {
      // Arrange
      req.user = { _id: 'user456' };
      const mockUser = { _id: 'user456', role: 0, name: 'Regular User' };
      userModel.findById.mockResolvedValue(mockUser);

      // Act
      await isAdmin(req, res, next);

      // Assert
      expect(userModel.findById).toHaveBeenCalledWith('user456');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Unauthorized Access'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 when user does not exist (null)', async () => {
      // Arrange
      req.user = { _id: 'nonexistent' };
      userModel.findById.mockResolvedValue(null);

      // Act
      await isAdmin(req, res, next);

      // Assert
      expect(userModel.findById).toHaveBeenCalledWith('nonexistent');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Unauthorized Access'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 on database error', async () => {
      // Arrange
      req.user = { _id: 'user123' };
      const dbError = new Error('Database connection failed');
      userModel.findById.mockRejectedValue(dbError);

      // Act
      await isAdmin(req, res, next);

      // Assert
      expect(userModel.findById).toHaveBeenCalledWith('user123');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Error in admin middleware'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 when user has different role (role = 2)', async () => {
      // Arrange
      req.user = { _id: 'user789' };
      const mockUser = { _id: 'user789', role: 2, name: 'User' };
      userModel.findById.mockResolvedValue(mockUser);

      // Act
      await isAdmin(req, res, next);

      // Assert
      expect(userModel.findById).toHaveBeenCalledWith('user789');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Unauthorized Access'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});