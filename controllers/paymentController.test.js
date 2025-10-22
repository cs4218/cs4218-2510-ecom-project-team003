import orderModel from '../models/orderModel.js';
import mockRequestResponse from '../testUtils/requests.js';
import braintree from 'braintree';
import {
  braintreeTokenController,
  braintreePaymentController,
} from './paymentController.js';

jest.mock("../models/orderModel.js");


jest.mock('braintree', () => {
  const mockGateway = {
    clientToken: {
      generate: jest.fn()
    },
    transaction: {
      sale: jest.fn()
    }
  };
  return {
    BraintreeGateway: jest.fn(() => mockGateway),
    Environment: {
      Sandbox: 'Sandbox'
    }
  };
});

jest.mock('axios');

const fakeGateway = braintree.BraintreeGateway();

console.log = jest.fn();


describe('Payment Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('braintreeTokencontroller', () => {
    it("should send token on success", async () => {
      const [req, res] = mockRequestResponse();
      const fakeToken = { clientToken: "123abc" };

      fakeGateway.clientToken.generate.mockImplementation((opts, cb) => cb(null, fakeToken));

      await braintreeTokenController(req, res);

      expect(fakeGateway.clientToken.generate).toHaveBeenCalled();
      expect(res.send).toHaveBeenCalledWith(fakeToken);
    });

    it("should send 500 on error", async () => {
      const [req, res] = mockRequestResponse();
      const fakeError = { message: "Failed" };

      fakeGateway.clientToken.generate.mockImplementation((opts, cb) => cb(fakeError, null));

      await braintreeTokenController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: fakeError.message });
    });
  });

  describe('braintreePaymentController', () => {
    it("should return ok:true when transaction succeeds", async () => {
      const cart = [{ price: 100 }, { price: 50 }];
      const nonce = "fake-nonce";
      const fakeResult = { id: "txn123", status: "success" };

      // Mock sale to call callback with result
      fakeGateway.transaction.sale.mockImplementation((data, cb) => cb(null, fakeResult));

      const saveMock = jest.fn().mockResolvedValue({});
      orderModel.mockImplementation(() => ({ save: saveMock }));

      const [req, res] = mockRequestResponse()
      req.body = { nonce, cart };
      req.user = { _id: "user123" };

      await braintreePaymentController(req, res);

      expect(fakeGateway.transaction.sale).toHaveBeenCalledWith(
        {
          amount: 150, // sum of cart prices
          paymentMethodNonce: nonce,
          options: { submitForSettlement: true }
        },
        expect.any(Function)
      );

      expect(orderModel).toHaveBeenCalledWith({
        products: cart,
        payment: fakeResult,
        buyer: "user123"
      });
      expect(saveMock).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ ok: true });
    });

    it("should return 500 when transaction fails", async () => {
      const cart = [{ price: 200 }];
      const nonce = "fake-nonce";
      const fakeError = { message: "Transaction failed" };

      fakeGateway.transaction.sale.mockImplementation((data, cb) => cb(fakeError, null));

      const [req, res] = mockRequestResponse()
      req.body = { nonce, cart };
      req.user = { _id: "user123" };



      await braintreePaymentController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: fakeError.message });
    });
  });
});