import categoryModel from "./categoryModel";
import mongoose from "mongoose";

const VALID_CATEGORY = {
    name: "Electronics",
    slug: "electronics",
};

describe("Category Model", () => {
    it("Should pass when name and slug are provided", async () => {
        const category = new categoryModel({ ...VALID_CATEGORY });
        await expect(category.validate()).resolves.toBeUndefined();
    });

    it("Should lowercase slug automatically", async () => {
        const category = new categoryModel({ name: "Books", slug: "BoOkS-And-MORE" });
        await category.validate();
        expect(category.slug).toBe("books-and-more");
    });

    it("Should pass when slug is missing", async () => {
        const category = new categoryModel({ name: "Clothing" });
        await expect(category.validate()).resolves.toBeUndefined();
    });

    it("should fail if name is missing", async () => {
        const category = new categoryModel({ slug: "misc" });
        await expect(category.validate()).rejects.toThrow(mongoose.Error.ValidationError);
    });
});