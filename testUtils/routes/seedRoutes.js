import express from "express";
import { resetSeedController, seedCategoriesController, seedOrdersController, seedProductsController, seedUsersController } from "../controllers/seedController.js";

//router object
const router = express.Router();

router.get("/reset", resetSeedController);
router.post("/categories", seedCategoriesController);
router.post("/orders", seedOrdersController);
router.post("/products", seedProductsController);
router.post("/users", seedUsersController);

export default router;