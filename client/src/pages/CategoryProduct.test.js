import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
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

const mockSetCart = jest.fn();
jest.mock('../context/cart', () => ({
  useCart: jest.fn(() => [[], mockSetCart])
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

const renderCategoryProduct = (slug) => {
  return render(
    <MemoryRouter initialEntries={[`/category/${slug}`]}>
      <Routes>
        <Route path='/category/:slug' element={<CategoryProduct />} />
      </Routes>
    </MemoryRouter>
  );
};

const mockProductCategoryApi = (products, category) => {
  axios.get.mockResolvedValueOnce({ data: { products, category } });
}

describe('CategoryProduct Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders product in category', async () => {
    axios.get.mockResolvedValueOnce({ data: { products: [LAPTOP], category: ELECTRONICS } });

    const { findByText } = renderCategoryProduct(ELECTRONICS.slug);
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

    expect(await findByText(`Category - ${ELECTRONICS.name}`)).toBeInTheDocument();
    expect(await findByText('1 result found')).toBeInTheDocument();
    expect(await findByText(LAPTOP.name)).toBeInTheDocument();
    expect(await findByText('$1,499.99')).toBeInTheDocument();
    expect(await findByText(LAPTOP.description)).toBeInTheDocument();

    expect(await findByText('More Details')).toBeInTheDocument();
    expect(await findByText('ADD TO CART')).toBeInTheDocument();
  });

  it('renders multiple products in category', async () => {
    axios.get.mockResolvedValueOnce({ data: { products: [LAPTOP, SMARTPHONE], category: ELECTRONICS } });
    
    const { findByText } = renderCategoryProduct(ELECTRONICS.slug);
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

    expect(await findByText(`Category - ${ELECTRONICS.name}`)).toBeInTheDocument();
    expect(await findByText('2 results found')).toBeInTheDocument();
    expect(await findByText(LAPTOP.name)).toBeInTheDocument();
    expect(await findByText('$1,499.99')).toBeInTheDocument();
    expect(await findByText(LAPTOP.description)).toBeInTheDocument();
    expect(await findByText(SMARTPHONE.name)).toBeInTheDocument();
    expect(await findByText('$999.99')).toBeInTheDocument();
    expect(await findByText(SMARTPHONE.description)).toBeInTheDocument();
  });

  it('renders no products in category', async () => {
    axios.get.mockResolvedValueOnce({ data: { products: [], category: ELECTRONICS } });

    const { findByText } = renderCategoryProduct(ELECTRONICS.slug);
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

    expect(await findByText(`Category - ${ELECTRONICS.name}`)).toBeInTheDocument();
    expect(await findByText('0 results found')).toBeInTheDocument();
  });

  it('renders category skeleton when no slug is provided', async () => {
    const { getByText } = render(
      <MemoryRouter initialEntries={['/category']}>
        <Routes>
          <Route path='/category' element={<CategoryProduct />} />
        </Routes>
      </MemoryRouter>
    );

    expect(axios.get).not.toHaveBeenCalled();
    expect(getByText('Category -')).toBeInTheDocument();
    expect(getByText('0 results found')).toBeInTheDocument();
  });

  it('navigates to product details', async () => {
    axios.get.mockResolvedValueOnce({ data: { products: [LAPTOP], category: ELECTRONICS } });
    const { findByTestId } = renderCategoryProduct(ELECTRONICS.slug);
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));
    
    fireEvent.click(await findByTestId('more-details-button'));

    expect(mockNavigate).toHaveBeenCalledWith(`/product/${LAPTOP.slug}`);
  });

  it('adds product to cart', async () => {
    axios.get.mockResolvedValueOnce({ data: { products: [LAPTOP], category: ELECTRONICS } });
    const { findByTestId } = renderCategoryProduct(ELECTRONICS.slug);
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

    fireEvent.click(await findByTestId('add-to-cart-button'));
    
    expect(mockSetCart).toHaveBeenCalledWith([LAPTOP]);
    expect(localStorage.setItem).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('Item added to cart');
  });

  it('navigates to page not found on invalid category', async () => {
    axios.get.mockResolvedValueOnce({ data: { products: [], category: null } });
    
    renderCategoryProduct('invalid-category');
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

    expect(mockNavigate).toHaveBeenCalledWith('/pagenotfound');
  });

  it('handles error when fetching category products fails', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation();
    const err = { message: 'Error while fetching category products' };
    axios.get.mockRejectedValueOnce(err);
    renderCategoryProduct(ELECTRONICS.slug);

    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));
    expect(spy).toHaveBeenCalledWith(err);
    expect(toast.error).toHaveBeenCalledWith('Something when wrong while fetching category products');

    spy.mockRestore();
  });
});