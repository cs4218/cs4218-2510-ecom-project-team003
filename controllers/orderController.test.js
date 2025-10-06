import orderModel from "../models/orderModel.js";
import mockRequestResponse from '../testUtils/requests.js';
import { expectDatabaseError } from "../testUtils/database.js";
import JWT from 'jsonwebtoken';
import { getAllOrdersController, getOrdersController, updateOrderStatusController } from "./orderController.js";

jest.mock('../models/orderModel.js');

describe('Order Controller', () => {
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
      const logSpy = jest.spyOn(console, "log").mockImplementation(() => { });
      let [req, res] = mockRequestResponse();
      req.user = { _id: "user123" };
      orderModel.find.mockImplementation(() => { throw new Error("DB failure"); });

      await getOrdersController(req, res);

      expectDatabaseError(res, logSpy);
    });
  });

  describe("getAllOrdersController", () => {
    it("should return all orders successfully", async () => {
      let [req, res] = mockRequestResponse();
      const fakeOrders = [
        { _id: "1", buyer: { name: "Alice" }, products: [{ name: "Item1" }] },
        { _id: "2", buyer: { name: "Bob" }, products: [{ name: "Item2" }] },
      ];

      const sortMock = jest.fn().mockResolvedValue(fakeOrders);
      const populateBuyerMock = jest.fn().mockReturnValue({ sort: sortMock });
      const populateProductsMock = jest.fn().mockReturnValue({ populate: populateBuyerMock });
      orderModel.find.mockReturnValue({ populate: populateProductsMock });

      await getAllOrdersController(req, res);

      expect(orderModel.find).toHaveBeenCalledWith({});
      expect(populateProductsMock).toHaveBeenCalledWith("products", "-photo");
      expect(populateBuyerMock).toHaveBeenCalledWith("buyer", "name");
      expect(sortMock).toHaveBeenCalledWith({ createdAt: "descending" });
      expect(res.json).toHaveBeenCalledWith(fakeOrders);
    });

    it("should handle errors and return 500", async () => {
      const logSpy = jest.spyOn(console, "log").mockImplementation(() => { });
      let [req, res] = mockRequestResponse();
      orderModel.find.mockImplementation(() => { throw new Error("DB failure"); });

      await getAllOrdersController(req, res);

      expectDatabaseError(res, logSpy);

    });
  });

  describe("updateOrderStatusController", () => {
    it("should update the order status successfully", async () => {
      const updatedOrder = {
        _id: "order123",
        status: "Shipped",
        buyer: "user123",
      };
      let [req, res] = mockRequestResponse();
      req.params = { orderId: "order123" };
      req.body = { status: "Shipped" };

      orderModel.findByIdAndUpdate.mockResolvedValue(updatedOrder);

      await updateOrderStatusController(req, res);

      expect(orderModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "order123",
        { status: "Shipped" },
        { new: true }
      );
      expect(res.json).toHaveBeenCalledWith(updatedOrder);
    });

    it("should handle errors and return 500", async () => {
      let [req, res] = mockRequestResponse();
      req.params = { orderId: "order123" };
      req.body = { status: "Shipped" };

      const logSpy = jest.spyOn(console, "log").mockImplementation(() => { });
      orderModel.findByIdAndUpdate.mockImplementation(() => {
        throw new Error("DB failure");
      });
      await updateOrderStatusController(req, res);
      expectDatabaseError(res, logSpy);
    });
  });
});
