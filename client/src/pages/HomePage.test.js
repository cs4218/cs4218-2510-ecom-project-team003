import React from 'react';
import { render, fireEvent, waitFor, within, screen } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import HomePage from './HomePage';
import { Prices } from '../components/Prices';

const NUS_TSHIRT = {
    _id: "nus t-shirt",
    name: "NUS T-shirt",
    slug: "nus-tshirt",
    description: "Plain NUS T-shirt for sale",
    price: 0.00,
    category: { _id: "clothing", name: "Clothing", slug: "clothing" },
    quantity: 200,
    shipping: true,
};

const TEXTBOOK = {
    _id: "textbook",
    name: "Textbook",
    slug: "textbook",
    description: "A comprehensive textbook",
    price: 20.00,
    category: { _id: "book", name: "Book", slug: "book" },
    quantity: 50,
    shipping: false,
};

const NOVEL = {
    _id: "novel",
    name: "Novel",
    slug: "novel",
    description: "A best-selling novel",
    price: 40.00,
    category: { _id: "book", name: "Book", slug: "book" },
    quantity: 200,
    shipping: true,
};

const CONTRACT = {
    _id: "contract",
    name: "The Law of Contract in Singapore",
    slug: "the-law-of-contract-in-singapore",
    description: "A best selling book in Singapore",
    price: 60.00,
    category: { _id: "book", name: "Book", slug: "book" },
    quantity: 200,
    shipping: true,
};

const SMARTPHONE = {
    _id: "smartphone",
    name: "Smartphone",
    slug: "smartphone",
    description: "A high-end smartphone",
    price: 80.00,
    category: { _id: "electronics", name: "Electronics", slug: "electronics" },
    quantity: 50,
    shipping: false,
};

const LAPTOP = {
    _id: "laptop",
    name: "Laptop",
    slug: "laptop",
    description: "A powerful laptop",
    price: 100.00,
    category: { _id: "electronics", name: "Electronics", slug: "electronics" },
    quantity: 30,
    shipping: true,
};

const mockSetCart = jest.fn();
let mockSetAuth = jest.fn();
const mockNavigate = jest.fn();

jest.mock('axios');

jest.mock('../context/auth', () => ({
    useAuth: jest.fn(() => [null, jest.fn()])
}));

jest.mock('../context/cart', () => ({
    useCart: jest.fn(() => [[], mockSetCart])
}));

jest.mock('../context/search', () => ({
    useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()])
}));

jest.mock('../hooks/useCategory', () => jest.fn(() => []));

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
}))

Object.defineProperty(window, 'localStorage', {
    value: {
        setItem: jest.fn(),
        getItem: jest.fn(),
        removeItem: jest.fn(),
    },
    writable: true,
});

describe('HomePage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockSetAuth.mockReset();
        mockNavigate.mockReset();

        axios.get.mockImplementation((url) => {
            if (url === '/api/v1/category/get-category') {
                return Promise.resolve({ data: { success: true, category: [] } });
            }
            if (url === '/api/v1/product/product-count') {
                return Promise.resolve({ data: { total: 0 } });
            }
            if (url.startsWith('/api/v1/product/product-list/')) {
                return Promise.resolve({ data: { products: [] } });
            }
            return Promise.resolve({ data: {} });
        });

        axios.post.mockResolvedValue({ data: { products: [] } });
    });

    const renderHomePage = () => render(
        <MemoryRouter initialEntries={['/']}>
            <Routes>
                <Route path="/" element={<HomePage />} />
            </Routes>
        </MemoryRouter>
    );

    it('Render all components in Home Page', async () => {
        renderHomePage();

        const banner = screen.getByAltText("bannerimage");
        expect(banner).toHaveAttribute("src", "/images/Virtual.png");

        expect(await screen.findByText("All Products")).toBeInTheDocument();

        expect(screen.getByText("RESET FILTERS")).toBeInTheDocument();
    });

    it('Render all categories in Home Page', async () => {
        axios.get.mockImplementation((url) => {
            if (url === "/api/v1/category/get-category") {
                return Promise.resolve({
                    data: {
                        success: true,
                        message: "All Category List",
                        category: [LAPTOP.category, NOVEL.category, NUS_TSHIRT.category],
                    },
                });
            } else if (url === "/api/v1/product/product-count") {
                return Promise.resolve({
                    data: {
                        success: true,
                        total: 0,
                    },
                });
            } else if (url === "/api/v1/product/product-list/1") {
                return Promise.resolve({
                    data: {
                        success: true,
                        products: [],
                    },
                });
            }
            return Promise.reject(new Error("Not Found!"));
        });

        renderHomePage();

        await screen.findByText("All Products");
        await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(3));

        expect(screen.getByText("Filter By Category")).toBeInTheDocument();
        expect(await screen.findByText('Electronics')).toBeInTheDocument();
        expect(await screen.findByText('Book')).toBeInTheDocument();
        expect(await screen.findByText('Clothing')).toBeInTheDocument();
    });

    it('Render all price ranges in Home Page', async () => {
        renderHomePage();

        await screen.findByText("All Products");

        expect(screen.getByText("Filter By Price")).toBeInTheDocument();

        Prices.forEach((p) => {
            expect(screen.getByText(p.name)).toBeInTheDocument();
        });
    })

    it('Render all products in Home Page', async () => {
        axios.get.mockImplementation((url) => {
            if (url === "/api/v1/category/get-category") {
                return Promise.resolve({
                    data: {
                        success: true,
                        message: "All Category List",
                        category: [LAPTOP.category, NOVEL.category, NUS_TSHIRT.category],
                    },
                });
            } else if (url === "/api/v1/product/product-count") {
                return Promise.resolve({
                    data: {
                        success: true,
                        total: 1,
                    },
                });
            } else if (url === `/api/v1/product/product-list/1`) {
                return Promise.resolve({
                    data: {
                        success: true,
                        products: [TEXTBOOK],
                    },
                });
            }
            return Promise.reject(new Error("Not Found!"));
        });

        renderHomePage();

        await screen.findByText("All Products");
        await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(3));

        expect(await screen.findByText('Textbook')).toBeInTheDocument();
        expect(screen.getByText(/A comprehensive textbook/)).toBeInTheDocument();
        expect(screen.getByText('$20.00')).toBeInTheDocument();

        const textbookImage = screen.getByAltText('Textbook');
        expect(textbookImage).toHaveAttribute('src', '/api/v1/product/product-photo/textbook');

        const detailsButton = screen.getByRole('button', { name: /More Details/i });
        expect(detailsButton).toBeInTheDocument();
    });

    it('Filter products by Category', async () => {
        axios.get.mockImplementation((url) => {
            if (url === "/api/v1/category/get-category") {
                return Promise.resolve({
                    data: {
                        success: true,
                        message: "All Category List",
                        category: [LAPTOP.category, NOVEL.category, NUS_TSHIRT.category],
                    },
                });
            } else if (url === "/api/v1/product/product-count") {
                return Promise.resolve({ data: { success: true, total: 6 } });
            } else if (url === "/api/v1/product/product-list/1") {
                return Promise.resolve({
                    data: {
                        success: true,
                        products: [LAPTOP, SMARTPHONE, NOVEL, NUS_TSHIRT, TEXTBOOK, CONTRACT],
                    },
                });
            }
            return Promise.reject(new Error("Not Found!"));
        });

        axios.post.mockResolvedValueOnce({
            data: { success: true, products: [TEXTBOOK, NOVEL, CONTRACT] },
        });

        renderHomePage();

        await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(3));

        const bookCheckbox = await screen.findByRole('checkbox', { name: 'Book' });
        fireEvent.click(bookCheckbox);

        await waitFor(() =>
            expect(axios.post).toHaveBeenLastCalledWith(
                '/api/v1/product/product-filters',
                { checked: ['book'], radio: [] }
            )
        );

        expect(await screen.findByText('Textbook')).toBeInTheDocument();
        expect(screen.getByText(/A comprehensive textbook/)).toBeInTheDocument();
    });

    it('Filter products by Price', async () => {
        axios.get.mockImplementation((url) => {
            if (url === "/api/v1/category/get-category") {
                return Promise.resolve({
                    data: {
                        success: true,
                        message: "All Category List",
                        category: [LAPTOP.category, NOVEL.category, NUS_TSHIRT.category],
                    },
                });
            } else if (url === "/api/v1/product/product-count") {
                return Promise.resolve({ data: { success: true, total: 6 } });
            } else if (url === "/api/v1/product/product-list/1") {
                return Promise.resolve({
                    data: {
                        success: true,
                        products: [LAPTOP, SMARTPHONE, NOVEL, NUS_TSHIRT, TEXTBOOK, CONTRACT],
                    },
                });
            }
            return Promise.reject(new Error("Not Found!"));
        });

        const fortyToFiftyNine = Prices.find(p => p.array[0] === 40 && p.array[1] === 59);

        axios.post.mockResolvedValueOnce({
            data: { success: true, products: [NOVEL] },
        });

        renderHomePage();

        await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(3));

        const radio = screen.getByRole('radio', { name: fortyToFiftyNine.name });
        fireEvent.click(radio);

        await waitFor(() =>
            expect(axios.post).toHaveBeenLastCalledWith(
                '/api/v1/product/product-filters',
                { checked: [], radio: fortyToFiftyNine.array }
            )
        );

        expect(await screen.findByText('Novel')).toBeInTheDocument();
    });

    it('Filter products by Category and Price', async () => {
        axios.get.mockImplementation((url) => {
            if (url === "/api/v1/category/get-category") {
                return Promise.resolve({
                    data: {
                        success: true,
                        message: "All Category List",
                        category: [LAPTOP.category, NOVEL.category, NUS_TSHIRT.category],
                    },
                });
            } else if (url === "/api/v1/product/product-count") {
                return Promise.resolve({ data: { success: true, total: 6 } });
            } else if (url === "/api/v1/product/product-list/1") {
                return Promise.resolve({
                    data: {
                        success: true,
                        products: [LAPTOP, SMARTPHONE, NOVEL, NUS_TSHIRT, TEXTBOOK, CONTRACT],
                    },
                });
            }
            return Promise.reject(new Error("Not Found!"));
        });

        axios.post
            .mockResolvedValueOnce({
                data: { success: true, products: [TEXTBOOK, NOVEL, CONTRACT] },
            })
            .mockResolvedValueOnce({
                data: { success: true, products: [CONTRACT] },
            });

        const sixtyToSeventyNine = Prices.find(p => p.array[0] === 60 && p.array[1] === 79);

        renderHomePage();

        await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(3));

        const bookCheckbox = await screen.findByRole('checkbox', { name: 'Book' });
        fireEvent.click(bookCheckbox);

        await waitFor(() =>
            expect(axios.post).toHaveBeenNthCalledWith(
                1,
                '/api/v1/product/product-filters',
                { checked: ['book'], radio: [] }
            )
        );

        const radio = screen.getByRole('radio', { name: sixtyToSeventyNine.name });
        fireEvent.click(radio);

        await waitFor(() =>
            expect(axios.post).toHaveBeenNthCalledWith(
                2,
                '/api/v1/product/product-filters',
                { checked: ['book'], radio: sixtyToSeventyNine.array }
            )
        );

        expect(await screen.findByText('The Law of Contract in Singapore')).toBeInTheDocument();
    });

    it('Reset all filters', async () => {
        axios.get.mockImplementation((url) => {
            if (url === "/api/v1/category/get-category") {
                return Promise.resolve({
                    data: {
                        success: true,
                        message: "All Category List",
                        category: [LAPTOP.category, NOVEL.category, NUS_TSHIRT.category],
                    },
                });
            } else if (url === "/api/v1/product/product-count") {
                return Promise.resolve({ data: { success: true, total: 6 } });
            } else if (url === "/api/v1/product/product-list/1") {
                return Promise.resolve({
                    data: {
                        success: true,
                        products: [LAPTOP, SMARTPHONE, NOVEL, NUS_TSHIRT, TEXTBOOK, CONTRACT],
                    },
                });
            }
            return Promise.reject(new Error("Not Found!"));
        });

        axios.post
            .mockResolvedValueOnce({
                data: { success: true, products: [TEXTBOOK, NOVEL, CONTRACT] },
            })
            .mockResolvedValueOnce({
                data: { success: true, products: [NOVEL] },
            });

        const fortyToFiftyNine = Prices.find(p => p.array[0] === 40 && p.array[1] === 59);

        renderHomePage();

        await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(3));

        const bookCheckbox = await screen.findByRole('checkbox', { name: 'Book' });
        fireEvent.click(bookCheckbox);

        const radio = screen.getByRole('radio', { name: fortyToFiftyNine.name });
        fireEvent.click(radio);

        expect(await screen.findByText('Novel')).toBeInTheDocument();

        const resetBtn = screen.getByText('RESET FILTERS');
        fireEvent.click(resetBtn);

        await waitFor(() => {
            const callsToList = axios.get.mock.calls.filter(
                ([u]) => u === '/api/v1/product/product-list/1'
            ).length;
            expect(callsToList).toBeGreaterThanOrEqual(2);
        });

        expect(await screen.findByText('Laptop')).toBeInTheDocument();
        expect(await screen.getByText('Textbook')).toBeInTheDocument();
        expect(await screen.getByText('Novel')).toBeInTheDocument();
        expect(await screen.getByText('The Law of Contract in Singapore')).toBeInTheDocument();
        expect(await screen.getByText('Smartphone')).toBeInTheDocument();
        expect(await screen.getByText('NUS T-shirt')).toBeInTheDocument();

        const bookAfterReset = screen.getByRole('checkbox', { name: 'Book' });
        expect(bookAfterReset).not.toBeChecked();

        const radioAfterReset = screen.getByRole('radio', { name: fortyToFiftyNine.name });
        expect(radioAfterReset).not.toBeChecked();
    });
});