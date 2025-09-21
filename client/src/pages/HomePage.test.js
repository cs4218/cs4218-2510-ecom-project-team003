import React from 'react';
import { render, fireEvent, waitFor, within, screen } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom';
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
let mockSetAuth = jest.fn();
const mockNavigate = jest.fn();

jest.mock('axios');

jest.mock('react-hot-toast', () => ({
    __esModule: true,
    default: { success: jest.fn(), error: jest.fn() },
    Toaster: () => null,
}));

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

    it('logs error when getAllCategory fails', async () => {
        const err = new Error('category fail');
        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

        axios.get.mockImplementation((url) => {
            if (url === '/api/v1/category/get-category') return Promise.reject(err);
            if (url === '/api/v1/product/product-count') return Promise.resolve({ data: { total: 0 } });
            if (url === '/api/v1/product/product-list/1') return Promise.resolve({ data: { products: [] } });
            return Promise.resolve({ data: {} });
        });

        renderHomePage();
        await waitFor(() => expect(logSpy).toHaveBeenCalledWith(err));

        logSpy.mockRestore();
    });

    it('logs error when getTotal fails', async () => {
        const err = new Error('total fail');
        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

        axios.get.mockImplementation((url) => {
            if (url === '/api/v1/category/get-category') return Promise.resolve({ data: { success: true, category: [] } });
            if (url === '/api/v1/product/product-count') return Promise.reject(err);
            if (url === '/api/v1/product/product-list/1') return Promise.resolve({ data: { products: [] } });
            return Promise.resolve({ data: {} });
        });

        renderHomePage();
        await waitFor(() => expect(logSpy).toHaveBeenCalledWith(err));

        logSpy.mockRestore();
    });

    it('logs error when getAllProducts fails on initial fetch', async () => {
        const err = new Error('products fail');
        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

        axios.get.mockImplementation((url) => {
            if (url === '/api/v1/category/get-category') return Promise.resolve({ data: { success: true, category: [] } });
            if (url === '/api/v1/product/product-count') return Promise.resolve({ data: { total: 1 } });
            if (url === '/api/v1/product/product-list/1') return Promise.reject(err);
            return Promise.resolve({ data: {} });
        });

        renderHomePage();
        await waitFor(() => expect(logSpy).toHaveBeenCalledWith(err));

        logSpy.mockRestore();
    });

    it('useEffect page change triggers loadMore and handles loadMore error', async () => {
        const err = new Error('load more fail');
        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

        axios.get.mockImplementation((url) => {
            if (url === "/api/v1/category/get-category") {
                return Promise.resolve({
                    data: { success: true, category: [LAPTOP.category, NOVEL.category] }
                });
            }
            if (url === "/api/v1/product/product-count") {
                return Promise.resolve({ data: { total: 12 } });
            }
            if (url === "/api/v1/product/product-list/1") {
                return Promise.resolve({
                    data: { success: true, products: [LAPTOP, SMARTPHONE, NOVEL, TEXTBOOK, CONTRACT, NUS_TSHIRT] }
                });
            }
            if (url === "/api/v1/product/product-list/2") {
                return Promise.reject(err);
            }
            return Promise.resolve({ data: {} });
        });

        renderHomePage();
        await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(3));

        const loadBtn = await screen.findByRole('button', { name: /Load More Products!/ });
        fireEvent.click(loadBtn);

        await waitFor(() => expect(axios.get).toHaveBeenCalledWith('/api/v1/product/product-list/2'));
        await waitFor(() => expect(logSpy).toHaveBeenCalledWith(err));

        expect(await screen.findByRole('button', { name: /Load More Products!/ })).toBeInTheDocument();

        logSpy.mockRestore();
    });

    it('handleFilter unchecks correctly (tests the filter(...) removal branch) while price remains selected', async () => {
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

    it('logs error when filterProduct fails', async () => {
        const err = new Error('filter fail');
        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

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

        axios.post.mockRejectedValueOnce(err);

        renderHomePage();
        await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(3));

        const bookCheckbox = await screen.findByRole('checkbox', { name: 'Book' });
        fireEvent.click(bookCheckbox);

        await waitFor(() => expect(logSpy).toHaveBeenCalledWith(err));

        logSpy.mockRestore();
    });

    it('navigates on "More Details" and adds to cart on "ADD TO CART"', async () => {
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

        const addToCart = await screen.findByRole('button', { name: /ADD TO CART/i });
        fireEvent.click(addToCart);
        expect(mockSetCart).toHaveBeenCalledWith(expect.arrayContaining([LAPTOP]));
        expect(localStorage.setItem).toHaveBeenCalledWith('cart', JSON.stringify([LAPTOP]));
        expect(toast.success).toHaveBeenCalledWith('Item Added to cart');
    });

    it('shows Load More Products! when not filtering and more items exist; hides it when filtering', async () => {
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

        const bookCheckbox = await screen.findByRole('checkbox', { name: 'Book' });
        axios.post.mockResolvedValueOnce({ data: { success: true, products: [NOVEL] } });
        fireEvent.click(bookCheckbox);

        await waitFor(() => expect(axios.post).toHaveBeenCalled());
        expect(screen.queryByRole('button', { name: /Load More Products!/ })).not.toBeInTheDocument();
    });

    it('loadMore appends products and stops loading', async () => {
        let resolvePage2;

        axios.get.mockImplementation((url) => {
            if (url === "/api/v1/category/get-category") {
                return Promise.resolve({
                    data: { success: true, category: [LAPTOP.category, NOVEL.category] },
                });
            }
            if (url === "/api/v1/product/product-count") {
                return Promise.resolve({ data: { total: 10 } });
            }
            if (url === "/api/v1/product/product-list/1") {
                return Promise.resolve({
                    data: { success: true, products: [LAPTOP, NOVEL] },
                });
            }
            if (url === "/api/v1/product/product-list/2") {
                return new Promise((resolve) => {
                    resolvePage2 = resolve; // resolve later to observe the loading state
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

        expect(await screen.findByText('Smartphone')).toBeInTheDocument();
        expect(await screen.findByText('Textbook')).toBeInTheDocument();
        expect(screen.getByText('Laptop')).toBeInTheDocument();
        expect(screen.getByText('Novel')).toBeInTheDocument();

        await waitFor(() =>
            expect(axios.get).toHaveBeenCalledWith('/api/v1/product/product-list/2')
        );
    });

    it("does not set categories when API returns success=false (covers the if guard's false branch)", async () => {
        axios.get.mockImplementation((url) => {
            if (url === "/api/v1/category/get-category") {
                return Promise.resolve({
                    data: {
                        success: false,
                        category: [LAPTOP.category, NOVEL.category, NUS_TSHIRT.category],
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
        expect(screen.queryByText("Book")).not.toBeInTheDocument();
        expect(screen.queryByText("Clothing")).not.toBeInTheDocument();
    });
});