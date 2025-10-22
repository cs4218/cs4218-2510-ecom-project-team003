import { 
  registerController,
  loginController,
  forgotPasswordController,
  updateProfileController,
} from "../controllers/authController.js";
import userModel from "../models/userModel.js";
import mockRequestResponse from '../testUtils/requests.js';
import { comparePassword, hashPassword } from "../helpers/authHelper.js";
import JWT from 'jsonwebtoken';

jest.mock('../models/userModel.js'); // Mock userModel
jest.mock('../helpers/authHelper.js'); // Mock authHerlp for hashPassword and comparePassword functions
jest.mock('jsonwebtoken'); // Mock JWT

describe('Auth Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      user: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn()
    };
    
    // jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.clearAllMocks();
  });

  afterEach(() => {
    // console.log.mockRestore();
  });

  describe('registerController', () => {
    const validUserData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      phone: '1234567890',
      address: '123 Street',
      answer: 'Football'
    };

    describe('Validation - Missing Fields', () => {
      it('returns 400 when name is missing', async () => {
        // Arrange
        req.body = { ...validUserData, name: '' };

        // Act
        await registerController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: 'Name is required'
        });
      });

      it('returns 400 when email is missing', async () => {
        // Arrange
        req.body = { ...validUserData, email: '' };

        // Act
        await registerController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: 'Email is required'
        });
      });

      it('returns 400 when password is missing', async () => {
        // Arrange
        req.body = { ...validUserData, password: '' };

        // Act
        await registerController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: 'Password is required'
        });
      });

      it('returns 400 when phone is missing', async () => {
        // Arrange
        req.body = { ...validUserData, phone: '' };

        // Act
        await registerController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: 'Phone number is required'
        });
      });

      it('returns 400 when address is missing', async () => {
        // Arrange
        req.body = { ...validUserData, address: '' };

        // Act
        await registerController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: 'Address is required'
        });
      });
    });

    describe('User Already Exists', () => {
      it('returns 409 when email already registered', async () => {
        // Arrange
        req.body = validUserData;
        userModel.findOne.mockResolvedValue({
          email: 'john@example.com'
        });

        // Act
        await registerController(req, res);

        // Assert
        expect(userModel.findOne).toHaveBeenCalledWith({ email: 'john@example.com' });
        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: 'Already Register please login'
        });
      });
    });

    describe('Successful Registration', () => {
      it('registers new user successfully', async () => {
        // Arrange
        req.body = validUserData;
        userModel.findOne.mockResolvedValue(null);
        hashPassword.mockResolvedValue('hashedPassword123');

        const mockUser = {
          _id: 'user123',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '1234567890',
          address: '123 Street',
          password: 'hashedPassword123',
          answer: 'Football'
        };

        const mockSave = jest.fn().mockResolvedValue(mockUser);
        userModel.mockImplementation(() => ({ save: mockSave }));

        // Act
        await registerController(req, res);

        // Assert
        expect(hashPassword).toHaveBeenCalledWith('password123');
        expect(mockSave).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
          success: true,
          message: 'User Register Successfully',
          user: mockUser
        });
      });
    });

    describe('Error Handling', () => {
      it('returns 500 on database error', async () => {
        // Arrange
        req.body = validUserData;
        const dbError = new Error('Database connection failed');
        userModel.findOne.mockRejectedValue(dbError);

        // Act
        await registerController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: 'Error in Registration',
          error: dbError
        });
      });
    });
  });

  describe('loginController', () => {
    describe('Validation - Missing Fields', () => {
      it('returns error when email is missing', async () => {
        // Arrange
        req.body = { password: 'password123' };

        // Act
        await loginController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: 'Email and password are required'
        });
      });

      it('returns error when password is missing', async () => {
        // Arrange
        req.body = { email: 'john@example.com' };

        // Act
        await loginController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: 'Email and password are required'
        });
      });

      it('returns error when both email and password are missing', async () => {
        // Arrange
        req.body = {};

        // Act
        await loginController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: 'Email and password are required'
        });
      });
    });

    describe('Invalid Credentials', () => {
      it('returns 401 when user does not exist', async () => {
        // Arrange
        req.body = {
          email: 'nonexistent@example.com',
          password: 'password123'
        };
        userModel.findOne.mockResolvedValue(null);

        // Act
        await loginController(req, res);

        // Assert
        expect(userModel.findOne).toHaveBeenCalledWith({ email: 'nonexistent@example.com' });
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: 'Invalid email or password'
        });
      });

      it('returns 401 when password is incorrect', async () => {
        // Arrange
        req.body = {
          email: 'john@example.com',
          password: 'wrongpassword'
        };
        userModel.findOne.mockResolvedValue({
          _id: 'user123',
          email: 'john@example.com',
          password: 'hashedPassword'
        });
        comparePassword.mockResolvedValue(false);

        // Act
        await loginController(req, res);

        // Assert
        expect(comparePassword).toHaveBeenCalledWith('wrongpassword', 'hashedPassword');
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: 'Invalid email or password'
        });
      });
    });

    describe('Successful Login', () => {
      it('logs in user successfully with valid credentials', async () => {
        // Arrange
        req.body = {
          email: 'john@example.com',
          password: 'password123'
        };

        const mockUser = {
          _id: 'user123',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '1234567890',
          address: '123 Street',
          password: 'hashedPassword',
          role: 0
        };

        userModel.findOne.mockResolvedValue(mockUser);
        comparePassword.mockResolvedValue(true);
        JWT.sign.mockResolvedValue('mockJWTToken123');

        // Act
        await loginController(req, res);

        // Assert
        expect(JWT.sign).toHaveBeenCalledWith(
          { _id: 'user123' },
          process.env.JWT_SECRET,
          { expiresIn: '7d' }
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
          success: true,
          message: 'Login successfully',
          user: {
            _id: 'user123',
            name: 'John Doe',
            email: 'john@example.com',
            phone: '1234567890',
            address: '123 Street',
            role: 0
          },
          token: 'mockJWTToken123'
        });
      });
    });
    
    describe('Error Handling', () => {
      it('returns 500 on database error', async () => {
        // Arrange
        req.body = {
          email: 'john@example.com',
          password: 'password123'
        };
        const dbError = new Error('Database error');
        userModel.findOne.mockRejectedValue(dbError);

        // Act
        await loginController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: 'Error in login',
          error: dbError
        });
      });
    });
  });

  describe('forgotPasswordController', () => {
    describe('Validation - Missing Fields', () => {
      it('returns 400 when email is missing', async () => {
        // Arrange
        req.body = {
          answer: 'Football',
          newPassword: 'newpass123'
        };

        // Act
        await forgotPasswordController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: 'Email is required'
        });
      });

      it('returns 400 when answer is missing', async () => {
        // Arrange
        req.body = {
          email: 'john@example.com',
          newPassword: 'newpass123'
        };

        // Act
        await forgotPasswordController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: 'Answer is required'
        });
      });

      it('returns 400 when newPassword is missing', async () => {
        // Arrange
        req.body = {
          email: 'john@example.com',
          answer: 'Football'
        };

        // Act
        await forgotPasswordController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: 'New Password is required'
        });
      });
    });

    describe('User Not Found', () => {
      it('returns 401 when email or answer is incorrect', async () => {
        // Arrange
        req.body = {
          email: 'john@example.com',
          answer: 'WrongAnswer',
          newPassword: 'newpass123'
        };
        userModel.findOne.mockResolvedValue(null);

        // Act
        await forgotPasswordController(req, res);

        // Assert
        expect(userModel.findOne).toHaveBeenCalledWith({
          email: 'john@example.com',
          answer: 'WrongAnswer'
        });
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: 'Wrong Email Or Answer'
        });
      });
    });

    describe('Successful Password Reset', () => {
      it('resets password successfully', async () => {
        // Arrange
        req.body = {
          email: 'john@example.com',
          answer: 'Football',
          newPassword: 'newpass123'
        };

        const mockUser = {
          _id: 'user123',
          email: 'john@example.com',
          answer: 'Football'
        };

        userModel.findOne.mockResolvedValue(mockUser);
        hashPassword.mockResolvedValue('hashedNewPassword');
        userModel.findByIdAndUpdate.mockResolvedValue({});

        // Act
        await forgotPasswordController(req, res);

        // Assert
        expect(hashPassword).toHaveBeenCalledWith('newpass123');
        expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
          'user123',
          { password: 'hashedNewPassword' }
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
          success: true,
          message: 'Password Reset Successfully'
        });
      });
    });

    describe('Error Handling', () => {
      it('returns 500 on database error', async () => {
        // Arrange
        req.body = {
          email: 'john@example.com',
          answer: 'Football',
          newPassword: 'newpass123'
        };
        const dbError = new Error('Database error');
        userModel.findOne.mockRejectedValue(dbError);

        // Act
        await forgotPasswordController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: 'Something went wrong',
          error: dbError
        });
      });
    });
  });

  describe("updateProfileController", () => {
    it("should update the profile successfully", async () => {
      const fakeUser = {
        _id: "user123",
        name: "Old Name",
        password: "oldpassword",
        phone: "123",
        address: "Old Address",
      };
      const updatedUser = {
        ...fakeUser,
        name: "New Name",
        phone: "456",
      };

      userModel.findById.mockResolvedValue(fakeUser);
      userModel.findByIdAndUpdate.mockResolvedValue(updatedUser);

      const [req, res] = mockRequestResponse({
        body: { name: "New Name", phone: "456" },
        user: { _id: "user123" }
      });

      await updateProfileController(req, res);

      expect(userModel.findById).toHaveBeenCalledWith("user123");
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "user123",
        {
          name: "New Name",
          password: fakeUser.password,
          phone: "456",
          address: fakeUser.address,
        },
        { new: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Profile Updated Successfully",
          updatedUser,
        })
      );
    });
    
    it("should hash the password if provided and update successfully", async () => {
      const fakeUser = { _id: "user123", password: "oldpass" };
      const hashed = "hashedPass123";

      userModel.findById.mockResolvedValue(fakeUser);
      userModel.findByIdAndUpdate.mockResolvedValue({ ...fakeUser, password: hashed });
      hashPassword.mockResolvedValue(hashed);

      const [req, res] = mockRequestResponse({
        body: { password: "newpassword" },
        user: { _id: "user123" },
      });

      await updateProfileController(req, res);

      expect(hashPassword).toHaveBeenCalledWith("newpassword");
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "user123",
        expect.objectContaining({ password: hashed }),
        { new: true }
      );
    });

    it("should return error if req.user is missing", async () => {
      const [req, res] = mockRequestResponse({ body: { name: "New" }, user: null });
      const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

      await updateProfileController(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ 
          success: false, 
          message: "Missing user" 
        }));
      logSpy.mockRestore();
    });

    it("should return an error if password is too short", async () => {
      const [req, res] = mockRequestResponse({
        body: { password: "123" },
        user: { _id: "user123" }
      });

      await updateProfileController(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false, 
          message: "Password is required and must be at least 6 characters long."
        })
      );
      expect(userModel.findById).toHaveBeenCalledWith("user123");
      expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("should handle errors and return 500", async () => {
      let [req, res] = mockRequestResponse();
      const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
      userModel.findById.mockImplementation(() => { throw new Error("DB failure"); });

      await updateProfileController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error While Updating Profile",
          error: expect.any(String),
        })
      );

      logSpy.mockRestore();
    });
  });
});
