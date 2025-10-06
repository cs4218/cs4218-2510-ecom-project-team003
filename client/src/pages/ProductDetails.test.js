import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import toast from 'react-hot-toast';
import ProductDetails from './ProductDetails';

const LAPTOP = {
  "_id": "1",
  "name": "Laptop",
  "slug": "laptop",
  "description": "A powerful laptop",
  "price": 1499.99,
  "category": {
    "_id": "1",
    "name": "Electronics",
    "slug": "electronics",
  },
  "quantity": 30,
  "shipping": true,
  "createdAt": "2024-09-06T17:50:19.971Z",
  "updatedAt": "2024-09-06T17:50:19.971Z",
};

const SMARTPHONE = {
  "_id": "2",
  "name": "Smartphone",
  "slug": "smartphone",
  "description": "A high-end smartphone",
  "price": 999.99,
  "category": {
    "_id": "1",
    "name": "Electronics",
    "slug": "electronics",
  },
  "quantity": 50,
  "shipping": false,
  "createdAt": "2024-09-06T17:52:19.978Z",
  "updatedAt": "2024-09-06T17:52:19.978Z",
};

const TABLET = {
  "_id": "3",
  "name": "Tablet",
  "slug": "tablet",
  "description": "A sleek tablet with high performance",
  "price": 599.99,
  "category": {
    "_id": "1",
    "name": "Electronics",
    "slug": "electronics",
  },
  "quantity": 40,
  "shipping": true,
  "createdAt": "2024-09-06T17:55:23.978Z",
  "updatedAt": "2024-09-06T17:55:23.978Z",
};

const INVALID_SLUG = "tablet";

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

jest.mock('../hooks/useCategory', () => jest.fn(() => []));

jest.mock('../utils/string', () => ({
  ...jest.requireActual('../utils/string'),
  getShortDescription: jest.fn((desc) => desc)
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

window.matchMedia = window.matchMedia || function () {
  return {
    matches: false,
    addListener: function () { },
    removeListener: function () { }
  };
};

console.log = jest.fn();

const mockProductApi = (product, relatedProducts = []) => {
  axios.get
    .mockResolvedValueOnce({ data: { product } })
    .mockResolvedValueOnce({ data: { products: relatedProducts } })
};

const renderProductDetails = (slug) => {
  return render(
    <MemoryRouter initialEntries={[`/product/${slug}`]}>
      <Routes>
        <Route path="/product/:slug" element={<ProductDetails />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('Product Details Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    describe('Product Details', () => {
      it('renders product details', async () => {
        mockProductApi(LAPTOP, []);
        renderProductDetails(LAPTOP.slug);

        expect(await screen.findByText(/name.*laptop/i)).toBeInTheDocument();
        expect(await screen.findByText(/a powerful laptop/i)).toBeInTheDocument();
        expect(await screen.findByText(/\$1,499\.99/i)).toBeInTheDocument();
        expect(await screen.findByText(/electronics/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /add to cart/i })).toBeInTheDocument();
      });

      it('navigates to page not found when no slug is provided', async () => {
        render(
          <MemoryRouter initialEntries={[`/product`]}>
            <Routes>
              <Route path="/product" element={<ProductDetails />} />
            </Routes>
          </MemoryRouter>
        );

        await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/pagenotfound'));
      });

      it('renders product image', async () => {
        mockProductApi(LAPTOP, []);
        renderProductDetails(LAPTOP.slug);

        const img = await screen.findByAltText(LAPTOP.name);
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute('src', expect.stringContaining(LAPTOP._id));
      });
    });

    describe('Related products', () => {
      it('renders no related products', async () => {
        mockProductApi(LAPTOP, []);
        renderProductDetails(LAPTOP.slug);

        await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));
        expect(await screen.findByText(/no similar products/i)).toBeInTheDocument();
      });

      it('renders related product', async () => {
        mockProductApi(LAPTOP, [SMARTPHONE]);
        renderProductDetails(LAPTOP.slug);

        expect(await screen.findByText(SMARTPHONE.name)).toBeInTheDocument();
        expect(await screen.findByText('$999.99')).toBeInTheDocument();
        expect(await screen.findByText(SMARTPHONE.description)).toBeInTheDocument();
      });

      it('renders multiple related products', async () => {
        mockProductApi(LAPTOP, [SMARTPHONE, TABLET]);
        renderProductDetails(LAPTOP.slug);

        expect(await screen.findByText(SMARTPHONE.name)).toBeInTheDocument();
        expect(await screen.findByText('$999.99')).toBeInTheDocument();
        expect(await screen.findByText(SMARTPHONE.description)).toBeInTheDocument();

        expect(await screen.findByText(TABLET.name)).toBeInTheDocument();
        expect(await screen.findByText('$599.99')).toBeInTheDocument();
        expect(await screen.findByText(TABLET.description)).toBeInTheDocument();
      });

      it('renders related product image', async () => {
        mockProductApi(LAPTOP, [SMARTPHONE]);
        renderProductDetails(LAPTOP.slug);

        const img = await screen.findByAltText(SMARTPHONE.name);
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute('src', expect.stringContaining(SMARTPHONE._id));
      });
    });
  });

  describe('User interactions', () => {
    it('adds product to cart', async () => {
      mockProductApi(LAPTOP, []);
      renderProductDetails(LAPTOP.slug);

      expect(await screen.findByText(/name.*laptop/i)).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /add to cart/i }));

      expect(mockAddToCart).toHaveBeenCalledWith(LAPTOP);
      expect(toast.success).toHaveBeenCalledWith(expect.any(String));
    });

    it('adds related product to cart', async () => {
      mockProductApi(LAPTOP, [SMARTPHONE]);
      renderProductDetails(LAPTOP.slug);

      fireEvent.click(await screen.findByTestId('add-related-to-cart-btn'));

      expect(mockAddToCart).toHaveBeenCalledWith(SMARTPHONE);
      expect(toast.success).toHaveBeenCalledWith(expect.any(String));
    });

    it('navigates to similar product details', async () => {
      mockProductApi(LAPTOP, [SMARTPHONE]);
      renderProductDetails(LAPTOP.slug);

      fireEvent.click(await screen.findByRole('button', { name: /details/i }));

      expect(mockNavigate).toHaveBeenCalledWith(`/product/${SMARTPHONE.slug}`);
    });
  });

  describe('Error handling', () => {
    it('navigates to page not found on invalid product', async () => {
      axios.get.mockResolvedValueOnce({ data: { product: null } });

      renderProductDetails(INVALID_SLUG);

      await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/pagenotfound'));
    });

    it('handles error when fetching single product fails', async () => {
      const err = { message: 'Error while getting single product' };
      axios.get.mockRejectedValueOnce(err);
      renderProductDetails(LAPTOP.slug);

      await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.any(String)));
    });

    it('handles error when fetching related product fails', async () => {
      const err = { message: 'Error while getting related products' };
      axios.get
        .mockResolvedValueOnce({ data: { product: SMARTPHONE } })
        .mockRejectedValueOnce(err)
      renderProductDetails(LAPTOP.slug);

      await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.any(String)));
    });
  });
});