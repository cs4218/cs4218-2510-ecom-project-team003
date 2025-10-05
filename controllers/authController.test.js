import { 
  getOrdersController,
  updateProfileController
} from "../controllers/authController.js";
import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import mockRequestResponse from '../testUtils/requests.js';
import { expectDatabaseError } from "../testUtils/database.js";
import { comparePassword, hashPassword } from "../helpers/authHelper.js";

jest.mock("../models/orderModel.js");
jest.mock("../models/userModel.js");
jest.mock("../helpers/authHelper.js")

describe('Auth Controller', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getOrdersController", () => {
    it("should return orders for the user", async () => {
      const fakeOrders = [
        { _id: "1", buyer: "user123", products: [{ name: "item1" }] },
        { _id: "2", buyer: "user123", products: [{ name: "item2" }] },
      ];

      let [req, res] = mockRequestResponse();
      req.user = { _id: "user123" }
      const populateBuyer = jest.fn().mockResolvedValue(fakeOrders);
      const populateProducts = jest.fn().mockReturnValue({ populate: populateBuyer });
      orderModel.find.mockReturnValue({ populate: populateProducts });

      await getOrdersController(req, res);

      expect(orderModel.find).toHaveBeenCalledWith({ buyer: "user123" });
      expect(populateProducts).toHaveBeenCalledWith("products", "-photo");
      expect(populateBuyer).toHaveBeenCalledWith("buyer", "name");
      expect(res.json).toHaveBeenCalledWith(fakeOrders);
    });

    it("should handle errors and return 500", async () => {
      const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
      let [req, res] = mockRequestResponse();
      req.user = { _id: "user123" };
      orderModel.find.mockImplementation(() => { throw new Error("DB failure"); });

      await getOrdersController(req, res);

      expectDatabaseError(res, logSpy);
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
      const [req, res] = mockRequestResponse({ body: { name: "New" }, user: undefined });
      const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

      await updateProfileController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: "Error While Updating Profile", error: "Missing User" })
      );
      logSpy.mockRestore();
    });

    it("should return an error if password is too short", async () => {
      const [req, res] = mockRequestResponse({
        body: { password: "123" },
        user: { _id: "user123" }
      });

      await updateProfileController(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "A password is required and has to be at least 6 characters long.",
        })
      );
      expect(userModel.findById).toHaveBeenCalledWith("user123");
      expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("should handle errors and return 400", async () => {
      let [req, res] = mockRequestResponse();
      const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
      userModel.findById.mockImplementation(() => { throw new Error("DB failure"); });

      await updateProfileController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
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

  describe("getAllOrdersController", () => {
    
  });

});
