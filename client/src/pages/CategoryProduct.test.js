import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import toast from 'react-hot-toast';
import CategoryProduct from './CategoryProduct';

const ELECTRONICS = {
  '_id': '1',
  'name': 'Electronics',
  'slug': 'electronics',
};

const LAPTOP = {
  '_id': '1',
  'name': 'Laptop',
  'slug': 'laptop',
  'description': 'A powerful laptop',
  'price': 1499.99,
  'category': ELECTRONICS,
  'quantity': 30,
  'shipping': true,
  'createdAt': '2024-09-06T17:50:19.971Z',
  'updatedAt': '2024-09-06T17:50:19.971Z',
};

const SMARTPHONE = {
  '_id': '2',
  'name': 'Smartphone',
  'slug': 'smartphone',
  'description': 'A high-end smartphone',
  'price': 999.99,
  'category': ELECTRONICS,
  'quantity': 50,
  'shipping': false,
  'createdAt': '2024-09-06T17:52:19.978Z',
  'updatedAt': '2024-09-06T17:52:19.978Z',
};

jest.mock('axios');
jest.mock('react-hot-toast');

jest.mock('../context/auth', () => ({
  useAuth: jest.fn(() => [null, jest.fn()])
}));

const mockAddToCart = jest.fn();
jest.mock('../context/cart', () => ({
  useCart: jest.fn(() => ({ addToCart: mockAddToCart }))
}));

jest.mock('../context/search', () => ({
  useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()])
}));

jest.mock('../hooks/useCategory', () => (
  jest.fn(() => [])
));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

Object.defineProperty(window, 'localStorage', {
  value: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
  },
  writable: true,
});

console.log = jest.fn();

const renderCategoryProduct = (slug) => {
  return render(
    <MemoryRouter initialEntries={[`/category/${slug}`]}>
      <Routes>
        <Route path='/category/:slug' element={<CategoryProduct />} />
      </Routes>
    </MemoryRouter>
  );
};

describe('CategoryProduct Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders product in category', async () => {
    axios.get.mockResolvedValueOnce({ data: { products: [LAPTOP], category: ELECTRONICS } });

    renderCategoryProduct(ELECTRONICS.slug);

    expect(await screen.findByText(new RegExp(ELECTRONICS.name, 'i'))).toBeInTheDocument();
    expect(await screen.findByText(/1 result/i)).toBeInTheDocument();
    expect(await screen.findByText(LAPTOP.name)).toBeInTheDocument();
    expect(await screen.findByText('$1,499.99')).toBeInTheDocument();
    expect(await screen.findByText(LAPTOP.description)).toBeInTheDocument();

    expect(await screen.findByRole('button', { name: /details/i })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /add to cart/i })).toBeInTheDocument();
  });

  it('renders multiple products in category', async () => {
    axios.get.mockResolvedValueOnce({ data: { products: [LAPTOP, SMARTPHONE], category: ELECTRONICS } });

    renderCategoryProduct(ELECTRONICS.slug);

    expect(await screen.findByText(new RegExp(ELECTRONICS.name, 'i'))).toBeInTheDocument();
    expect(await screen.findByText(/2 results/i)).toBeInTheDocument();
    expect(await screen.findByText(LAPTOP.name)).toBeInTheDocument();
    expect(await screen.findByText('$1,499.99')).toBeInTheDocument();
    expect(await screen.findByText(LAPTOP.description)).toBeInTheDocument();
    expect(await screen.findByText(SMARTPHONE.name)).toBeInTheDocument();
    expect(await screen.findByText('$999.99')).toBeInTheDocument();
    expect(await screen.findByText(SMARTPHONE.description)).toBeInTheDocument();
  });

  it('renders no products in category', async () => {
    axios.get.mockResolvedValueOnce({ data: { products: [], category: ELECTRONICS } });

    renderCategoryProduct(ELECTRONICS.slug);
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

    expect(await screen.findByText(new RegExp(ELECTRONICS.name, 'i'))).toBeInTheDocument();
    expect(await screen.findByText(/0 results/i)).toBeInTheDocument();
  });

  it('renders product image', async () => {
    axios.get.mockResolvedValueOnce({ data: { products: [LAPTOP], category: ELECTRONICS } });

    renderCategoryProduct(ELECTRONICS.slug);

    const img = await screen.findByAltText(LAPTOP.name);
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', expect.stringContaining(LAPTOP._id));
  });

  it('navigates to page not found when no slug is provided', async () => {
    render(
      <MemoryRouter initialEntries={['/category']}>
        <Routes>
          <Route path='/category' element={<CategoryProduct />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/pagenotfound'));
  });

  it('navigates to product details', async () => {
    axios.get.mockResolvedValueOnce({ data: { products: [LAPTOP], category: ELECTRONICS } });
    renderCategoryProduct(ELECTRONICS.slug);

    fireEvent.click(await screen.findByRole('button', { name: /details/i }));

    expect(mockNavigate).toHaveBeenCalledWith(`/product/${LAPTOP.slug}`);
  });

  it('adds product to cart', async () => {
    axios.get.mockResolvedValueOnce({ data: { products: [LAPTOP], category: ELECTRONICS } });
    renderCategoryProduct(ELECTRONICS.slug);

    fireEvent.click(await screen.findByRole('button', { name: /add to cart/i }));

    expect(mockAddToCart).toHaveBeenCalledWith(LAPTOP);
    expect(toast.success).toHaveBeenCalledWith(expect.any(String));
  });

  it('navigates to page not found on invalid category', async () => {
    axios.get.mockResolvedValueOnce({ data: { products: [], category: null } });

    renderCategoryProduct('invalid-category');

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/pagenotfound'));
  });

  it('handles error when fetching category products fails', async () => {
    const err = { message: 'Error while fetching category products' };
    axios.get.mockRejectedValueOnce(err);
    renderCategoryProduct(ELECTRONICS.slug);

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.any(String)));
  });
});