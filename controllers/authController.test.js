import { getOrdersController } from "../controllers/authController.js";
import orderModel from "../models/orderModel.js";
import mockRequestResponse from '../testUtils/requests.js';
import { expectDatabaseError } from "../testUtils/database.js";

jest.mock("../models/orderModel.js");

describe("getOrdersController", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    [req, res] = mockRequestResponse();
    req.user = { _id: "user123" }; // ensure user is present
  });

  it("should return orders for the user", async () => {
    const fakeOrders = [
      { _id: "1", buyer: "user123", products: [{ name: "item1" }] },
      { _id: "2", buyer: "user123", products: [{ name: "item2" }] },
    ];

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

    orderModel.find.mockImplementation(() => { throw new Error("DB failure"); });

    await getOrdersController(req, res);

    expectDatabaseError(res, logSpy);
  });
});
