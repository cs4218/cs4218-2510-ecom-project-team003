import express from "express";
import colors from "colors";
import dotenv from "dotenv";
import morgan from "morgan";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import seedRoutes from "./testUtils/routes/seedRoutes.js";
import cors from "cors";
import { createAndConnectTestDB } from "./config/testDb.js";

// configure env
dotenv.config();

//database config
if (process.env.NODE_ENV === "test-frontend-integration") {
    createAndConnectTestDB();
} else if (process.env.NODE_ENV !== "test-backend-integration") {
    connectDB();
}

const app = express();

//middlewares
app.use(cors());
app.use(express.json());
// if (process.env.NODE_ENV !== 'test-frontend-integration') {
//     app.use(morgan('dev'));
// }

//routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/order", orderRoutes);
app.use("/api/v1/category", categoryRoutes);
app.use("/api/v1/product", productRoutes);
app.use("/api/v1/payment", paymentRoutes);

if (process.env.NODE_ENV === "test-frontend-integration") {
    app.use("/api/v1/seed", seedRoutes);
}

// rest api

app.get('/', (req, res) => {
    res.send("<h1>Welcome to ecommerce app</h1>");
});

const PORT = process.env.PORT || 6060;

if (process.env.NODE_ENV !== "test-backend-integration") {
    app.listen(PORT, () => {
        console.log(`Server running on ${process.env.DEV_MODE} mode on ${PORT}`.bgCyan.white);
    });
}

export default app;