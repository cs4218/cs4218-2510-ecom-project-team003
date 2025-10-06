import express from "express";
import {
  braintreePaymentController,
  braintreeTokenController,
} from "../controllers/paymentController.js";
import { requireSignIn } from "../middlewares/authMiddleware.js";

const router = express.Router();

//token
router.get("/braintree/token", braintreeTokenController);

//payments
router.post("/braintree/payment", requireSignIn, braintreePaymentController);

export default router;