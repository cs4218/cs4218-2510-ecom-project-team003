import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import HomePage from './HomePage';
import { Prices } from '../components/Prices';
import toast from 'react-hot-toast';

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
const mockNavigate = jest.fn();
let logSpy;

jest.mock('axios');

jest.mock('react-hot-toast', () => {
    const mockToast = Object.assign(jest.fn(), {
        success: jest.fn(),
        error: jest.fn(),
    });

    return {
        __esModule: true,
        default: mockToast,
        Toaster: () => null,
    };
});

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
        mockNavigate.mockReset();
        logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

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

    afterEach(() => {
        logSpy?.mockRestore();
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

    it('Render all categories in Home Page (data.success = true)', async () => {
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

    it("Render no category in Home Page (data.success = false)", async () => {
        axios.get.mockImplementation((url) => {
            if (url === "/api/v1/category/get-category") {
                return Promise.resolve({
                    data: {
                        success: false,
                        category: [LAPTOP.category],
                    },
                });
            }
            if (url === "/api/v1/product/product-count") {
                return Promise.resolve({ data: { total: 0 } });
            }
            if (url === "/api/v1/product/product-list/1") {
                return Promise.resolve({ data: { products: [] } });
            }
            return Promise.resolve({ data: {} });
        });

        renderHomePage();

        await screen.findByText("All Products");
        await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(3));

        expect(screen.queryByText("Electronics")).not.toBeInTheDocument();
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

    it('Logs error when get all categories fail', async () => {
        const error = new Error('Category Fail!');

        axios.get.mockImplementation((url) => {
            if (url === '/api/v1/category/get-category') {
                return Promise.reject(error);
            } else if (url === '/api/v1/product/product-count') {
                return Promise.resolve({ data: { total: 0 } });
            } else if (url === '/api/v1/product/product-list/1') {
                return Promise.resolve({ data: { products: [] } });
            }
            return Promise.resolve({ data: {} });
        });

        renderHomePage();
        await waitFor(() => expect(logSpy).toHaveBeenCalledWith(error));
    });

    it('Logs error when get total count fail', async () => {
        const error = new Error('Total Count Fail!');

        axios.get.mockImplementation((url) => {
            if (url === '/api/v1/category/get-category') {
                return Promise.resolve({ data: { success: true, category: [] } });
            } else if (url === '/api/v1/product/product-count') {
                return Promise.reject(error);
            } else if (url === '/api/v1/product/product-list/1') {
                return Promise.resolve({ data: { products: [] } });
            }
            return Promise.resolve({ data: {} });
        });

        renderHomePage();
        await waitFor(() => expect(logSpy).toHaveBeenCalledWith(error));
    });

    it('Logs error when get all products fail', async () => {
        const error = new Error('Product Fail!');

        axios.get.mockImplementation((url) => {
            if (url === '/api/v1/category/get-category') {
                return Promise.resolve({ data: { success: true, category: [] } });
            } else if (url === '/api/v1/product/product-count') {
                return Promise.resolve({ data: { total: 1 } });
            } else if(url === '/api/v1/product/product-list/1') {
                return Promise.reject(error);
            }
            return Promise.resolve({ data: {} });
        });

        renderHomePage();
        await waitFor(() => expect(logSpy).toHaveBeenCalledWith(error));
    });

    it('Logs error when filterProduct fails', async () => {
        const error = new Error('Filter Fail!');

        axios.get.mockImplementation((url) => {
            if (url === "/api/v1/category/get-category") {
                return Promise.resolve({
                    data: {
                        success: true,
                        message: "All Category List",
                        category: [LAPTOP.category, NOVEL.category],
                    },
                });
            } else if (url === "/api/v1/product/product-count") {
                return Promise.resolve({ data: { success: true, total: 2 } });
            } else if (url === "/api/v1/product/product-list/1") {
                return Promise.resolve({
                    data: { success: true, products: [LAPTOP, NOVEL] },
                });
            }
            return Promise.reject(new Error("Not Found!"));
        });

        axios.post.mockRejectedValueOnce(error);

        renderHomePage();
        await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(3));

        const bookCheckbox = await screen.findByRole('checkbox', { name: 'Book' });
        fireEvent.click(bookCheckbox);

        await waitFor(() => expect(logSpy).toHaveBeenCalledWith(error));
    });

    it('Render loadMore and handles loadMore error', async () => {
        const error = new Error('Load More Fail!');

        axios.get.mockImplementation((url) => {
            if (url === "/api/v1/category/get-category") {
                return Promise.resolve({
                    data: { success: true, category: [LAPTOP.category, NOVEL.category] }
                });
            } else if (url === "/api/v1/product/product-count") {
                return Promise.resolve({ data: { total: 12 } });
            } else if (url === "/api/v1/product/product-list/1") {
                return Promise.resolve({
                    data: { success: true, products: [LAPTOP, SMARTPHONE, NOVEL, TEXTBOOK, CONTRACT, NUS_TSHIRT] }
                });
            } else if (url === "/api/v1/product/product-list/2") {
                return Promise.reject(error);
            }
            return Promise.resolve({ data: {} });
        });

        renderHomePage();
        await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(3));

        const loadBtn = await screen.findByRole('button', { name: /Load More Products!/ });
        fireEvent.click(loadBtn);

        await waitFor(() => expect(axios.get).toHaveBeenCalledWith('/api/v1/product/product-list/2'));
        await waitFor(() => expect(logSpy).toHaveBeenCalledWith(error));

        expect(await screen.findByRole('button', { name: /Load More Products!/ })).toBeInTheDocument();
    });

    it('Renders "handleFilter" unchecks correctly', async () => {
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

        axios.post
            .mockResolvedValueOnce({ data: { success: true, products: [NOVEL] } })
            .mockResolvedValueOnce({ data: { success: true, products: [NOVEL, TEXTBOOK, CONTRACT] } })
            .mockResolvedValueOnce({ data: { success: true, products: [NOVEL] } });

        renderHomePage();
        await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(3));

        const radio = screen.getByRole('radio', { name: fortyToFiftyNine.name });
        fireEvent.click(radio);

        const bookCheckbox = await screen.findByRole('checkbox', { name: 'Book' });
        fireEvent.click(bookCheckbox);

        fireEvent.click(bookCheckbox);

        await waitFor(() =>
            expect(axios.post).toHaveBeenLastCalledWith(
                '/api/v1/product/product-filters',
                { checked: [], radio: fortyToFiftyNine.array }
            )
        );

        expect(bookCheckbox).not.toBeChecked();
    });

    it('Navigates to product details by using "More Details"', async () => {
        axios.get.mockImplementation((url) => {
            if (url === "/api/v1/category/get-category") {
                return Promise.resolve({
                    data: {
                        success: true,
                        category: [LAPTOP.category],
                    },
                });
            } else if (url === "/api/v1/product/product-count") {
                return Promise.resolve({ data: { success: true, total: 1 } });
            } else if (url === "/api/v1/product/product-list/1") {
                return Promise.resolve({
                    data: { success: true, products: [LAPTOP] },
                });
            }
            return Promise.reject(new Error("Not Found!"));
        });

        renderHomePage();
        await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(3));

        const moreDetails = await screen.findByRole('button', { name: /More Details/i });
        fireEvent.click(moreDetails);
        expect(mockNavigate).toHaveBeenCalledWith(`/product/${LAPTOP.slug}`);
    });

    it('Add product by using "Add To Cart"', async () => {
        axios.get.mockImplementation((url) => {
            if (url === "/api/v1/category/get-category") {
                return Promise.resolve({
                    data: {
                        success: true,
                        category: [LAPTOP.category],
                    },
                });
            } else if (url === "/api/v1/product/product-count") {
                return Promise.resolve({ data: { success: true, total: 1 } });
            } else if (url === "/api/v1/product/product-list/1") {
                return Promise.resolve({
                    data: { success: true, products: [LAPTOP] },
                });
            }
            return Promise.reject(new Error("Not Found!"));
        });

        renderHomePage();
        await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(3));

        const addToCart = await screen.findByRole('button', { name: /ADD TO CART/i });
        fireEvent.click(addToCart);
        expect(mockSetCart).toHaveBeenCalledWith(expect.arrayContaining([LAPTOP]));
        expect(localStorage.setItem).toHaveBeenCalledWith('cart', JSON.stringify([LAPTOP]));
        expect(toast.success).toHaveBeenCalledWith('Item Added to cart');
    });

    it('Renders "Load More Products!" when it is not filtering and more items exist', async () => {
        axios.get.mockImplementation((url) => {
            if (url === "/api/v1/category/get-category") {
                return Promise.resolve({
                    data: {
                        success: true,
                        category: [LAPTOP.category, NOVEL.category],
                    },
                });
            } else if (url === "/api/v1/product/product-count") {
                return Promise.resolve({ data: { success: true, total: 10 } });
            } else if (url === "/api/v1/product/product-list/1") {
                return Promise.resolve({
                    data: { success: true, products: [LAPTOP, SMARTPHONE, NOVEL] },
                });
            }
            return Promise.reject(new Error("Not Found!"));
        });

        renderHomePage();
        await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(3));

        const loadMoreBtn = await screen.findByRole('button', { name: /Load More Products!/ });
        expect(loadMoreBtn).toBeInTheDocument();
    });

    it('Hides "Load More Products!" when it is filtering', async () => {
        axios.get.mockImplementation((url) => {
            if (url === "/api/v1/category/get-category") {
                return Promise.resolve({
                    data: {
                        success: true,
                        category: [LAPTOP.category, NOVEL.category],
                    },
                });
            } else if (url === "/api/v1/product/product-count") {
                return Promise.resolve({ data: { success: true, total: 10 } });
            } else if (url === "/api/v1/product/product-list/1") {
                return Promise.resolve({
                    data: { success: true, products: [LAPTOP, SMARTPHONE, NOVEL] },
                });
            }
            return Promise.reject(new Error("Not Found!"));
        });

        renderHomePage();
        await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(3));

        const bookCheckbox = await screen.findByRole('checkbox', { name: 'Book' });
        axios.post.mockResolvedValueOnce({ data: { success: true, products: [NOVEL] } });
        fireEvent.click(bookCheckbox);

        await waitFor(() => expect(axios.post).toHaveBeenCalled());
        expect(screen.queryByRole('button', { name: /Load More Products!/ })).not.toBeInTheDocument();
    });

    it('Renders "Load More Products!" appends products and stops loading', async () => {
        let resolvePage2;

        axios.get.mockImplementation((url) => {
            if (url === "/api/v1/category/get-category") {
                return Promise.resolve({
                    data: { success: true, category: [LAPTOP.category, NOVEL.category] },
                });
            } else if (url === "/api/v1/product/product-count") {
                return Promise.resolve({ data: { total: 10 } });
            } else if (url === "/api/v1/product/product-list/1") {
                return Promise.resolve({
                    data: { success: true, products: [LAPTOP, NOVEL] },
                });
            } else if (url === "/api/v1/product/product-list/2") {
                return new Promise((resolve) => {
                    resolvePage2 = resolve;
                });
            }
            return Promise.reject(new Error("Not Found!"));
        });

        renderHomePage();
        await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(3));

        expect(await screen.findByText('Laptop')).toBeInTheDocument();
        expect(await screen.findByText('Novel')).toBeInTheDocument();

        const loadMoreBtn = await screen.findByRole('button', { name: /Load More Products!/ });
        fireEvent.click(loadMoreBtn);

        expect(await screen.findByText('Loading ...')).toBeInTheDocument();

        resolvePage2({
            data: { success: true, products: [SMARTPHONE, TEXTBOOK] },
        });

        await waitFor(() =>
            expect(screen.queryByText('Loading ...')).not.toBeInTheDocument()
        );

        await waitFor(() =>
            expect(axios.get).toHaveBeenCalledWith('/api/v1/product/product-list/2')
        );

        expect(await screen.findByText('Smartphone')).toBeInTheDocument();
        expect(await screen.findByText('Textbook')).toBeInTheDocument();
        expect(screen.getByText('Laptop')).toBeInTheDocument();
        expect(screen.getByText('Novel')).toBeInTheDocument();
    });
});