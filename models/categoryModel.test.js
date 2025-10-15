import categoryModel from "./categoryModel";
import mongoose from "mongoose";

const VALID_CATEGORY = {
    name: "Electronics",
    slug: "electronics",
};

describe("Category Model", () => {
    it("Should pass successfully when name and slug are provided", async () => {
        const category = new categoryModel({ ...VALID_CATEGORY });
        await expect(category.validate()).resolves.toBeUndefined();
    });

    it("Should successfully lowercase slug automatically", async () => {
        const category = new categoryModel({ name: "Books", slug: "BoOkSAndMORE" });
        await category.validate();
        expect(category.slug).toBe("booksandmore");
    });

    it("Should pass successfully when slug is missing", async () => {
        const category = new categoryModel({ name: "Clothing" });
        await expect(category.validate()).resolves.toBeUndefined();
    });

    it("Should fail if name is missing", async () => {
        const category = new categoryModel({ slug: "noName" });
        await expect(category.validate()).rejects.toThrow(mongoose.Error.ValidationError);
    });
});