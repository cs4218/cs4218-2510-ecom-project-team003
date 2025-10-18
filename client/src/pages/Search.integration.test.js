import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import ProductDetails from './ProductDetails';
import Search from './Search';
import { AuthProvider } from '../context/auth';
import { SearchProvider } from '../context/search';
import { CartProvider } from '../context/cart';
import { Toaster } from 'react-hot-toast';
import { ELECTRONICS, LAPTOP } from '../../tests/helpers/testData';
import Pagenotfound from './Pagenotfound';
import { resetDatabase, seedCategories, seedProducts } from '../../tests/helpers/seedApi';

const renderSearch = () => {
  return render(
    <AuthProvider>
      <SearchProvider>
        <CartProvider>
          <MemoryRouter initialEntries={['/search']}>
            <Toaster />
            <Routes>
              <Route path="/product/:slug" element={<ProductDetails />} />
              <Route path='/search' element={<Search />} />
              <Route path="*" element={<Pagenotfound />} />
            </Routes>
          </MemoryRouter>
        </CartProvider>
      </SearchProvider>
    </AuthProvider>
  );
}

describe('Search Component', () => {
  beforeAll(async () => {
    await resetDatabase();
  });

  beforeEach(async () => {
    await seedCategories([ELECTRONICS]);
    await seedProducts([LAPTOP]);
    jest.clearAllMocks();
  });

  afterEach(async () => {
    localStorage.clear();
    await resetDatabase();
  });

  it('allows users to search and renders results', async () => {
    renderSearch();

    const searchInput = screen.getByPlaceholderText(/search/i);
    const searchButton = screen.getByRole('button', { name: /search/i });

    fireEvent.change(searchInput, { target: { value: 'laptop' }});
    fireEvent.click(searchButton);

    expect(await screen.findByText(/found 1/i));
    expect(await screen.findByText(LAPTOP.name));
    expect(await screen.findByText(/\$1,499\.99/i)).toBeInTheDocument();
    expect(await screen.findByText(LAPTOP.description)).toBeInTheDocument();
  });

  it('shows no products found when results empty', async () => {
    renderSearch();

    const searchInput = screen.getByPlaceholderText(/search/i);
    const searchButton = screen.getByRole('button', { name: /search/i });

    fireEvent.change(searchInput, { target: { value: 'no results' }});
    fireEvent.click(searchButton);

    expect(await screen.findByText(/no products/i));
  });

  it('navigates to product details', async () => {
    renderSearch();

    const searchInput = screen.getByPlaceholderText(/search/i);
    const searchButton = screen.getByRole('button', { name: /search/i });
    fireEvent.change(searchInput, { target: { value: 'laptop' }});
    fireEvent.click(searchButton);
    fireEvent.click(await screen.findByRole('button', { name: /details/i }));

    expect(await screen.findByText(/product details/i)).toBeInTheDocument();
    expect(await screen.findByText(/name.*laptop/i)).toBeInTheDocument();
  });

  it('adds product to cart', async () => {
    renderSearch();

    const searchInput = screen.getByPlaceholderText(/search/i);
    const searchButton = screen.getByRole('button', { name: /search/i });
    fireEvent.change(searchInput, { target: { value: 'laptop' }});
    fireEvent.click(searchButton);
    fireEvent.click(await screen.findByRole('button', { name: /add to cart/i }));

    expect(await screen.findByText(/item added to cart/i)).toBeInTheDocument();
    const badge = screen.getByTestId('badge');
    expect(await within(badge).findByTitle('1')).toBeInTheDocument();
  });
});