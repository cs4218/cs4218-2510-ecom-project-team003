import request from "supertest";
import app from "../server.js";
import { createAndConnectTestDB, clearTestDB, closeTestDB } from "../config/testDb.js";
import jwt from "jsonwebtoken";
import { USER } from "../client/tests/helpers/testData";
import mongoose from "mongoose";


const userToken = jwt.sign(
    { _id: USER._id},
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
);

const braintreeMocks = {
  mockGenerate: null,
  mockSale: null,
};

jest.mock("braintree", () => {
    braintreeMocks.mockGenerate = jest.fn((opts, cb) =>
        cb(null, { clientToken: "fake-client-token" })
    );

    braintreeMocks.mockSale = jest.fn((opts, cb) =>
        cb(null, { success: true, transaction: { id: "fake-tx" } })
    );
    return {
    BraintreeGateway: jest.fn(() => ({
      clientToken: { generate: braintreeMocks.mockGenerate },
      transaction: { sale: braintreeMocks.mockSale },
    })),
    Environment: { Sandbox: "sandbox" },
  };
});

const fakeProductId1 = new mongoose.Types.ObjectId();
const fakeProductId2 = new mongoose.Types.ObjectId();

const fakeCart = [
    { _id: fakeProductId1, price: 10 },
    { _id: fakeProductId2, price: 67 },
];

// ------------------------
// Test Data
// ------------------------

beforeAll(async () => {
  await createAndConnectTestDB();
  await clearTestDB();
});

afterAll(async () => {
  await clearTestDB();
  await closeTestDB();
});

// ------------------------
// Tests
// ------------------------
describe("Payment Controller Integration Tests", () => {
  it("should generate a client token", async () => {
    const res = await request(app).get("/api/v1/payment/braintree/token");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("clientToken", "fake-client-token");
    expect(braintreeMocks.mockGenerate).toHaveBeenCalled();
  });

  it("should process a payment successfully", async () => {
    const res = await request(app)
      .post("/api/v1/payment/braintree/payment")
      .set("Authorization", userToken)
      .send({ nonce: "fake-nonce", cart: fakeCart });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("ok", true);
    expect(braintreeMocks.mockSale).toHaveBeenCalled();
  });

  it("should fail payment if not logged in", async () => {
    const res = await request(app)
      .post("/api/v1/payment/braintree/payment")
      .send({ nonce: "fake-nonce", cart: [] });

    expect(res.status).toBe(401); // requireSignIn middleware
    expect(res.body).toHaveProperty("message", "Invalid or expired token");
  });

  it("should handle Braintree token errors gracefully", async () => {
    // Force Braintree generate to call callback with error
    braintreeMocks.mockGenerate.mockImplementationOnce((_, cb) => cb(new Error("Braintree error")));
    const res = await request(app).get("/api/v1/payment/braintree/token");

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty("message", "Braintree error");
  });

  it("should handle Braintree payment errors gracefully", async () => {
    braintreeMocks.mockSale.mockImplementationOnce((transaction, cb) => cb(new Error("Payment failed")));
    const res = await request(app)
      .post("/api/v1/payment/braintree/payment")
      .set("Authorization", userToken)
      .send({ nonce: "fake-nonce", cart: fakeCart });

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty("message", "Payment failed");
  });
});
