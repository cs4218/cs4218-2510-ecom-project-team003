import request from 'supertest';
import app from '../server.js';
import productModel from '../models/productModel.js';
import categoryModel from '../models/categoryModel.js';
import orderModel from "../models/orderModel";
import userModel from "../models/userModel";
import { createAndConnectTestDB, clearTestDB, closeTestDB } from '../config/testDb.js';
import {
    ELECTRONICS, BOOKS, CLOTHING,
    SMARTPHONE, TABLET, STUDY_GUIDE, LONG_DESC_PRODUCT, LAPTOP,
    USER, ADMIN,
    ORDER_TWO_ITEMS_PROCESSING,
} from "../client/tests/helpers/testData";
import {describe} from "node:test";
import {expect} from "@jest/globals";

import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config({"path": ".env"});

const admin_token = jwt.sign(
    { _id: ADMIN._id},
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
);

const user_token = jwt.sign(
    { _id: USER._id},
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
);

describe("Order Controller Integration Tests", () => {
    beforeAll(async () => {
        await createAndConnectTestDB();
        await clearTestDB();

        await userModel.insertOne(ADMIN);
        await userModel.insertOne(USER);
        await categoryModel.insertMany([ELECTRONICS, BOOKS, CLOTHING]);
        await productModel.insertMany([SMARTPHONE, TABLET, STUDY_GUIDE, LONG_DESC_PRODUCT, LAPTOP])
        await orderModel.insertOne(ORDER_TWO_ITEMS_PROCESSING);
    })

    afterAll(async () => {
        await clearTestDB();
        await closeTestDB();
    })

    describe("getAllOrders tests", () => {
        it("should return 500 for unexpected error", async () => {
            // Mock find() to simulate DB failure
            jest.spyOn(orderModel, "find").mockImplementationOnce(() => {
                throw new Error("Simulated DB failure");
            });

            const res = await request(app)
                .get("/api/v1/order/all-orders")
                .set("Authorization", admin_token);

            expect(res.status).toBe(500);
            expect(res.body).toMatchObject({
                success: false,
                message: "Error While Getting Orders",
            });

            // Restore original implementation so other tests aren’t affected
            jest.restoreAllMocks();
        });

        it("should return 401 for non admin user", async () => {
            const res = await request(app)
                .get('/api/v1/order/all-orders')
                .set("Authorization", user_token);
            expect(res.status).toEqual(401);
        });

        it("should return 200 with empty list if no products exist", async () => {
            const res = await request(app)
                .get('/api/v1/order/all-orders')
                .set("Authorization", admin_token);
            expect(res.status).toEqual(200);
        });

        it("should return products in order when there are orders", async () => {
            const res = await request(app)
                .get('/api/v1/order/all-orders')
                .set("Authorization", admin_token);
            expect(res.status).toEqual(200);

            expect(res.body.length).toBe(1); // obj equality. ok for primitives
            expect(res.body[0].products.length).toBe(2);
        });
    });

    describe("updateOrderStatus tests", () => {
        it("should return 500 for unexpected error", async () => {
            // Mock find() to simulate DB failure
            jest.spyOn(orderModel, "findByIdAndUpdate").mockImplementationOnce(() => {
                throw new Error("Simulated DB failure");
            });

            const res = await request(app)
                .put(`/api/v1/order/order-status/${LAPTOP._id}`)
                .set("Authorization", admin_token)
                .send({ status: "don't care" });

            expect(res.status).toBe(500);
            expect(res.body.message).toMatch(/Error.*Updat/i); // allow updating, update etc.
            expect(res.body.success).toBe(false);

            // Restore original implementation so other tests aren’t affected
            jest.restoreAllMocks();
        });

        it("should return 401 for non admin user", async () => {
            const res = await request(app)
                .put(`/api/v1/order/order-status/${ORDER_TWO_ITEMS_PROCESSING._id}`)
                .set("Authorization", user_token)
                .send({ status: "don't care" });
            expect(res.status).toEqual(401);
        });

        it("should return 404 if no such order exists", async () => {
            const res = await request(app)
                .put(`/api/v1/order/order-status/aaaaaaaaaaaaaaaaaaaaaaaa`) // an order id not in the model
                .set("Authorization", admin_token)
                .send({ status: "don't care" });

            expect(res.status).toEqual(404);
        });

        it("should return 200 when update is successful", async () => {
            const res = await request(app)
                .put(`/api/v1/order/order-status/${ORDER_TWO_ITEMS_PROCESSING._id}`)
                .set("Authorization", admin_token)
                .send({ status: "Delivered" });

            expect(res.status).toEqual(200);
        });

        it("should return the correct status after update", async () => {
            const res = await request(app)
                .put(`/api/v1/order/order-status/${ORDER_TWO_ITEMS_PROCESSING._id}`)
                .set("Authorization", admin_token)
                .send({ status: "Cancelled" });

            expect(res.status).toEqual(200);

            const new_res = await request(app)
                .get('/api/v1/order/all-orders')
                .set("Authorization", admin_token);

            expect(new_res.status).toEqual(200);
            expect(new_res.body.length).toBe(1);
            expect(new_res.body[0].status).toBe("Cancelled");
        })
    });
});