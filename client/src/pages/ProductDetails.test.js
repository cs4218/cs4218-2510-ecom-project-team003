import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import toast from 'react-hot-toast';
import ProductDetails, { getShortDescription } from "./ProductDetails";

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
const DESCRIPTION_UNDER_60 = "U".repeat(59);
const DESCRIPTION_EXACT_60 = "E".repeat(60);
const DESCRIPTION_OVER_60 = "O".repeat(61);

jest.mock('axios');
jest.mock('react-hot-toast');

jest.mock('../context/auth', () => ({
  useAuth: jest.fn(() => [null, jest.fn()])
}));

const mockSetCart = jest.fn();
jest.mock('../context/cart', () => ({
  useCart: jest.fn(() => [[], mockSetCart])
}));

jest.mock('../context/search', () => ({
  useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()])
}));

jest.mock('../hooks/useCategory', () => jest.fn(() => []));

mockNavigate = jest.fn();
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

window.matchMedia = window.matchMedia || function () {
  return {
    matches: false,
    addListener: function () { },
    removeListener: function () { }
  };
};

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

describe('getShortDescription Function', () => {
  it('returns empty string when input is null', async () => {
    const res = getShortDescription(null);
    expect(res).toEqual('');
  });

  it('returns empty string when input is undefined', async () => {
    const res = getShortDescription(undefined);
    expect(res).toEqual('');
  });

  it('returns full description when it is under 60 characters', async () => {
    const res = getShortDescription(DESCRIPTION_UNDER_60);
    expect(res).toEqual(DESCRIPTION_UNDER_60);
  });

  it('returns full description when it is exactly 60 characters', async () => {
    const res = getShortDescription(DESCRIPTION_EXACT_60);
    expect(res).toEqual(DESCRIPTION_EXACT_60);
  });

  it('returns truncated description and ellipsis when input is over 60 characters', async () => {
    const exp = `${'O'.repeat(60)}...`
    const res = getShortDescription(DESCRIPTION_OVER_60);
    expect(res).toEqual(exp);
  });
});

describe('Product Details Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    describe('Product Details', () => {
      it('renders product details', async () => {
        mockProductApi(LAPTOP, []);
        const { findByText, getByText } = renderProductDetails(LAPTOP.slug);

        await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));
        expect(getByText('Product Details')).toBeInTheDocument();
        expect(await findByText(`Name : ${LAPTOP.name}`)).toBeInTheDocument();
        expect(await findByText(`Description : ${LAPTOP.description}`)).toBeInTheDocument();
        expect(await findByText(`Price : $1,499.99`)).toBeInTheDocument();
        expect(await findByText(`Category : ${LAPTOP.category.name}`)).toBeInTheDocument();
        expect(getByText('ADD TO CART')).toBeInTheDocument();
      });

      it('renders product details when no slug is provided', async () => {
        const { getByText } = render(
          <MemoryRouter initialEntries={[`/product`]}>
            <Routes>
              <Route path="/product" element={<ProductDetails />} />
            </Routes>
          </MemoryRouter>
        );

        expect(getByText('Product Details')).toBeInTheDocument();
        expect(getByText('Name :')).toBeInTheDocument();
        expect(getByText('Description :')).toBeInTheDocument();
        expect(getByText('Price :')).toBeInTheDocument();
        expect(getByText('Category :')).toBeInTheDocument();
        expect(getByText('ADD TO CART')).toBeInTheDocument();
      });

      it('renders product image', async () => {
        mockProductApi(LAPTOP, []);
        const { findByAltText } = renderProductDetails(LAPTOP.slug);

        await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));
        const img = await findByAltText(LAPTOP.name);
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute('src', `/api/v1/product/product-photo/${LAPTOP._id}`);
      });
    });

    describe('Related products', () => {
      it('renders no related products', async () => {
        mockProductApi(LAPTOP, []);
        const { findByText, getByText } = renderProductDetails(LAPTOP.slug);

        await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));
        expect(getByText('Similar Products ➡️')).toBeInTheDocument();
        expect(await findByText('No Similar Products found')).toBeInTheDocument();
      });

      it('renders related product', async () => {
        mockProductApi(LAPTOP, [SMARTPHONE]);
        const { findByText, getByText } = renderProductDetails(LAPTOP.slug);

        await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));
        expect(getByText('Similar Products ➡️')).toBeInTheDocument();
        expect(await findByText(SMARTPHONE.name)).toBeInTheDocument();
        expect(await findByText('$999.99')).toBeInTheDocument();
        expect(await findByText(SMARTPHONE.description)).toBeInTheDocument();
      });

      it('renders multiple related products', async () => {
        mockProductApi(LAPTOP, [SMARTPHONE, TABLET]);
        const { findByText, getByText } = renderProductDetails(LAPTOP.slug);

        await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));
        expect(getByText('Similar Products ➡️')).toBeInTheDocument();
        expect(await findByText(SMARTPHONE.name)).toBeInTheDocument();
        expect(await findByText('$999.99')).toBeInTheDocument();
        expect(await findByText(SMARTPHONE.description)).toBeInTheDocument();

        expect(await findByText(TABLET.name)).toBeInTheDocument();
        expect(await findByText('$599.99')).toBeInTheDocument();
        expect(await findByText(TABLET.description)).toBeInTheDocument();
      });

      it('renders related product image', async () => {
        mockProductApi(LAPTOP, [SMARTPHONE]);
        const { findByAltText } = renderProductDetails(LAPTOP.slug);

        await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));
        const img = await findByAltText(SMARTPHONE.name);
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute('src', `/api/v1/product/product-photo/${SMARTPHONE._id}`);
      });
    });
  });

  describe('User interactions', () => {
    it('adds product to cart', async () => {
      mockProductApi(LAPTOP, []);
      const { findByText, getByTestId } = renderProductDetails(LAPTOP.slug);
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));
      expect(await findByText(`Name : ${LAPTOP.name}`)).toBeInTheDocument();

      fireEvent.click(getByTestId('add-to-cart-btn'));

      expect(mockSetCart).toHaveBeenCalledWith([LAPTOP]);
      expect(localStorage.setItem).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Item Added to cart');
    });

    it('adds related product to cart', async () => {
      mockProductApi(LAPTOP, [SMARTPHONE]);
      const { findByText, getByTestId } = renderProductDetails(LAPTOP.slug);
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));
      expect(await findByText(SMARTPHONE.name)).toBeInTheDocument();

      fireEvent.click(getByTestId('add-related-to-cart-btn'));

      expect(mockSetCart).toHaveBeenCalledWith([SMARTPHONE]);
      expect(localStorage.setItem).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Item Added to cart');
    });

    it('navigates to similar product details', async () => {
      mockProductApi(LAPTOP, [SMARTPHONE]);
      const { findByText, getByTestId } = renderProductDetails(LAPTOP.slug);
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));
      expect(await findByText(SMARTPHONE.name)).toBeInTheDocument();

      fireEvent.click(getByTestId('more-details-btn'));

      expect(mockNavigate).toHaveBeenCalledWith(`/product/${SMARTPHONE.slug}`);
    });
  });

  describe('Error handling', () => {
    it('navigates to page not found on invalid product', async () => {
      axios.get.mockResolvedValueOnce({ data: { product: null } });

      renderProductDetails(INVALID_SLUG);
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      expect(mockNavigate).toHaveBeenCalledWith('/pagenotfound');
    });

    it('handles error when fetching single product fails', async () => {
      const spy = jest.spyOn(console, 'log').mockImplementation();
      const err = { message: 'Error while getting single product' };
      axios.get.mockRejectedValueOnce(err);
      renderProductDetails(LAPTOP.slug);

      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));
      await waitFor(() => expect(spy).toHaveBeenCalledWith(err));
      expect(toast.error).toHaveBeenCalledWith('Something went wrong');

      spy.mockRestore();
    });

    it('handles error when fetching related product fails', async () => {
      const spy = jest.spyOn(console, 'log').mockImplementation();
      const err = { message: 'Error while getting related products' };
      axios.get
        .mockResolvedValueOnce({ data: { product: SMARTPHONE } })
        .mockRejectedValueOnce(err)
      renderProductDetails(LAPTOP.slug);

      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));
      await waitFor(() => expect(spy).toHaveBeenCalledWith(err));
      expect(toast.error).toHaveBeenCalledWith('Something went wrong');

      spy.mockRestore();
    });
  });
});