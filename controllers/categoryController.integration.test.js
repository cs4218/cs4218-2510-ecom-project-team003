import request from 'supertest';
import app from '../server.js';
import categoryModel from '../models/categoryModel.js';
import userModel from "../models/userModel";
import mongoose from 'mongoose';
import JWT from 'jsonwebtoken';
import slugify from 'slugify';
import {
    clearTestDB,
    closeTestDB,
    createAndConnectTestDB
} from "../config/testDb.js";

const ADMIN_USER = {
    _id: "68ab6a3bd0360118b531122b",
    address: "1234 Street",
    answer: "password1234",
    email: "test4@example.com",
    name: "John Doey",
    password: "password1234",
    phone: "1234567890",
    role: 1,
};

const ELECTRONIC = {
    _id: "66db427fdb0119d9234b27f3",
    name: "Electronic",
    slug: slugify("Electronic"),
};

const BOOK = {
    _id: "66db427fdb0119d9234b27f1",
    name: "Book",
    slug: slugify("Book"),
};

let token;

console.log = jest.fn();

describe('Category Controller', () => {
    beforeAll(async () => {
        await createAndConnectTestDB();
        await clearTestDB();
        token = JWT.sign({ _id: ADMIN_USER._id }, process.env.JWT_SECRET, {
            expiresIn: "1m",
        });
    });

    beforeEach(async () => {
        const CATEGORIES = [ELECTRONIC, BOOK];

        await categoryModel.insertMany(CATEGORIES);
        await userModel.insertOne(ADMIN_USER);
    })

    afterEach(async () => {
        await clearTestDB();
        jest.restoreAllMocks();
        console.log.mockClear();
    });

    afterAll(async () => {
        await closeTestDB();
    });

    describe('POST /api/v1/category/create-category', () => {
        it('Should create a category', async () => {
            const newName = 'Clothing';

            const res = await request(app)
                .post('/api/v1/category/create-category')
                .send({ name: newName })
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.category).toHaveProperty("name", newName);
            expect(res.body.category).toHaveProperty("slug", slugify(newName).toLowerCase());
        });

        it('Should return 409 when category already exists', async () => {
            const res = await request(app)
                .post('/api/v1/category/create-category')
                .send(ELECTRONIC)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(409);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Category Already Exists');
        });

        it('Should return 400 when name is missing', async () => {
            const res = await request(app)
                .post('/api/v1/category/create-category')
                .send({ name: "" })
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Name is required');
        });

        it('Should return 400 when name has only whitespace', async () => {
            const res = await request(app)
                .post('/api/v1/category/create-category')
                .send({ name: "   " })
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Name cannot contain only whitespace');
        });

        it('Should return 500 on internal error', async () => {
            const spy = jest.spyOn(categoryModel, 'findOne').mockRejectedValueOnce(new Error(''));

            const res = await request(app)
                .post('/api/v1/category/create-category')
                .send({ name: 'Anything' })
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(500);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Error in Category Creation');
            expect(console.log).toHaveBeenCalled();
            spy.mockRestore();
        });
    });

    describe('GET /api/v1/category/get-category', () => {
        it('Should return all categories', async () => {
            const res = await request(app).get('/api/v1/category/get-category');
            const names = res.body.category.map(c => c.name).sort();

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('All Categories List');
            expect(res.body.category).toHaveLength(2);
            expect(names).toEqual(['Book', 'Electronic']);
        });

        it('Should return empty list when no categories exist', async () => {
            await clearTestDB();

            const res = await request(app).get('/api/v1/category/get-category');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('No Categories Found');
            expect(res.body.category).toHaveLength(0);
        });

        it('Should return 500 on internal error', async () => {
            const spy = jest.spyOn(categoryModel, 'find').mockRejectedValueOnce(new Error(''));
            const res = await request(app).get('/api/v1/category/get-category');

            expect(res.status).toBe(500);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Error while getting all categories');
            expect(console.log).toHaveBeenCalled();
            spy.mockRestore();
        });
    });

    describe('GET /api/v1/category/single-category/:slug', () => {
        it('Should return a category by slug', async () => {
            const res = await request(app).get(`/api/v1/category/single-category/${BOOK.slug}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Get Single Category Successfully');
            expect(res.body.category.slug).toBe('book');
        });

        it('Should return 404 when category not found', async () => {
            const invalidSlug = 'Non-existent-category';
            const res = await request(app).get(`/api/v1/category/single-category/${invalidSlug}`);

            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Category not found');
        });

        it('Should return 500 on internal error', async () => {
            const spy = jest.spyOn(categoryModel, 'findOne').mockRejectedValueOnce(new Error(''));
            const res = await request(app).get(`/api/v1/category/single-category/${BOOK.slug}`);

            expect(res.status).toBe(500);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Error while getting Single Category');
            expect(console.log).toHaveBeenCalled();
            spy.mockRestore();
        });
    });

    describe('PUT /api/v1/category/update-category/:id', () => {
        it('Should update a category', async () => {
            const newName = 'Furniture';

            const res = await request(app)
                .put(`/api/v1/category/update-category/${ELECTRONIC._id}`)
                .send({ name: 'Furniture' })
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Category Updated Successfully');
            expect(res.body.category).toHaveProperty("name", newName);
            expect(res.body.category).toHaveProperty("slug", slugify(newName).toLowerCase());
        });

        it('Should return 400 when name is missing', async () => {
            const res = await request(app)
                .put(`/api/v1/category/update-category/${ELECTRONIC._id}`)
                .send({ name: "" })
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Category name cannot be empty');
        });

        it('Should return 400 when name has only whitespace', async () => {
            const res = await request(app)
                .put(`/api/v1/category/update-category/${ELECTRONIC._id}`)
                .send({ name: "   " })
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Category name cannot contain only whitespace');
        });

        it('Should return 200 with success is false when updating using an existing category name', async () => {
            const res = await request(app)
                .put(`/api/v1/category/update-category/${ELECTRONIC._id}`)
                .send({ name: BOOK.name })
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Category Already Exists');
        });

        it('Should return 500 for invalid ID', async () => {
            const res = await request(app)
                .put('/api/v1/category/update-category/invalid-id')
                .send({ name: 'Invalid' })
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(500);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Error while updating category');
        });

        it('Should return 500 on internal error', async () => {
            const spy = jest.spyOn(categoryModel, 'findByIdAndUpdate').mockRejectedValueOnce(new Error(''));
            const res = await request(app)
                .put(`/api/v1/category/update-category/${ELECTRONIC._id}`)
                .send({ name: 'Furniture' })
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(500);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Error while updating category');
            expect(console.log).toHaveBeenCalled();
            spy.mockRestore();
        });
    });

    describe('DELETE /api/v1/category/delete-category/:id', () => {
        it('Should delete a category', async () => {
            const res = await request(app)
                .delete(`/api/v1/category/delete-category/${ELECTRONIC._id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe("Category Deleted Successfully");

            const exists = await categoryModel.findById(ELECTRONIC._id);
            expect(exists).toBeNull();
        });

        it('Should return 404 when category not found', async () => {
            const fakeId = new mongoose.Types.ObjectId().toString();
            const res = await request(app)
                .delete(`/api/v1/category/delete-category/${fakeId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Category not found');
        });

        it('Should return 500 on internal error', async () => {
            const spy = jest.spyOn(categoryModel, 'findByIdAndDelete').mockRejectedValueOnce(new Error(''));
            const res = await request(app)
                .delete(`/api/v1/category/delete-category/${ELECTRONIC._id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(500);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Error while deleting category');
            expect(console.log).toHaveBeenCalled();
            spy.mockRestore();
        });
    });
});