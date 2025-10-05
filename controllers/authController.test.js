import { registerController } from "../controllers/authController.js";
import userModel from "../models/userModel.js";
import { hashPassword } from "../helpers/authHelper.js";

jest.mock("../models/userModel.js");
jest.mock("../helpers/authHelper.js");

const mockRequestResponse = (body = {}) => {
  const req = { body };
  const res = {
    status: jest.fn().mockReturnThis(),
    send: jest.fn(),
  };
  return [req, res];
};

describe("registerController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 400 if name is missing", async () => {
    const [req, res] = mockRequestResponse({ email: "test@test.com" });

    await registerController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Name is required" })
    );
  });

  it("should return 409 if user already exists", async () => {
    userModel.findOne.mockResolvedValue({ email: "existing@test.com" });

    const [req, res] = mockRequestResponse({
      name: "User",
      email: "existing@test.com",
      password: "123456",
      phone: "123",
      address: "abc",
      answer: "yes",
    });

    await registerController(req, res);

    expect(userModel.findOne).toHaveBeenCalledWith({ email: "existing@test.com" });
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Already Register please login" })
    );
  });

  it("should register a new user successfully", async () => {
    userModel.findOne.mockResolvedValue(null);
    hashPassword.mockResolvedValue("hashed123");
    const mockSave = jest.fn().mockResolvedValue({ name: "User" });
    userModel.mockImplementation(() => ({ save: mockSave }));

    const [req, res] = mockRequestResponse({
      name: "User",
      email: "test@test.com",
      password: "123456",
      phone: "123",
      address: "abc",
      answer: "yes",
    });

    await registerController(req, res);

    expect(hashPassword).toHaveBeenCalledWith("123456");
    expect(mockSave).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "User Register Successfully",
      })
    );
  });

  it("should return 500 if there is a server error", async () => {
    
    // silences console
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    userModel.findOne.mockImplementation(() => {
      throw new Error("DB error");
    });

    const [req, res] = mockRequestResponse({
      name: "User",
      email: "test@test.com",
      password: "123456",
      phone: "123",
      address: "abc",
      answer: "yes",
    });

    await registerController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Error in Registeration",
      })
    );
    logSpy.mockRestore(); // restore console
  });
});
