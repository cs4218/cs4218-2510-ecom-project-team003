import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import ProductDetails from './ProductDetails';
import CategoryProduct from './CategoryProduct';
import Pagenotfound from './Pagenotfound';
import { AuthProvider } from '../context/auth';
import { SearchProvider } from '../context/search';
import { CartProvider } from '../context/cart';
import { Toaster } from 'react-hot-toast';
import { ELECTRONICS, LAPTOP, SMARTPHONE, TABLET } from '../../tests/helpers/testData';
import { resetDatabase, seedCategories, seedProducts } from '../../tests/helpers/seedApi';

console.log = jest.fn();

const renderCategoryProduct = (slug) => {
  return render(
    <AuthProvider>
      <SearchProvider>
        <CartProvider>
          <MemoryRouter initialEntries={[`/category/${slug}`]}>
            <Toaster />
            <Routes>
              <Route path="/product/:slug" element={<ProductDetails />} />
              <Route path='/category/:slug' element={<CategoryProduct />} />
              <Route path="*" element={<Pagenotfound />} />
            </Routes>
          </MemoryRouter>
        </CartProvider>
      </SearchProvider>
    </AuthProvider>
  );
}

describe('Category Product Component', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await seedCategories([ELECTRONICS]);
  });

  afterEach(async () => {
    localStorage.clear();
    await resetDatabase();
  });

  it('renders product in category', async () => {
    await seedProducts([LAPTOP]);

    renderCategoryProduct(ELECTRONICS.slug);

    const categoryProduct = screen.getByTestId('category-product');
    expect(await within(categoryProduct).findByText(/electronics/i)).toBeInTheDocument();
    expect(await within(categoryProduct).findByText(/1 result/i)).toBeInTheDocument();
    expect(await within(categoryProduct).findByText(LAPTOP.name)).toBeInTheDocument();
    expect(await within(categoryProduct).findByText(/\$1,499\.99/i)).toBeInTheDocument();
    expect(await within(categoryProduct).findByText(LAPTOP.description)).toBeInTheDocument();

    expect(await screen.findByRole('button', { name: /details/i })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /add to cart/i })).toBeInTheDocument();
  });

  it('renders no products in category', async () => {
    renderCategoryProduct(ELECTRONICS.slug);

    const categoryProduct = screen.getByTestId('category-product');
    expect(await within(categoryProduct).findByText(/electronics/i)).toBeInTheDocument();
    expect(await within(categoryProduct).findByText(/0 results/i)).toBeInTheDocument();
  });

  it('navigates to product details', async () => {
    await seedProducts([LAPTOP]);

    renderCategoryProduct(ELECTRONICS.slug);

    fireEvent.click(await screen.findByRole('button', { name: /details/i }));

    expect(await screen.findByText(/product details/i)).toBeInTheDocument();
  });

  it('adds product to cart', async () => {
    await seedProducts([LAPTOP]);
    
    renderCategoryProduct(ELECTRONICS.slug);

    fireEvent.click(await screen.findByRole('button', { name: /add to cart/i }));

    expect(await screen.findByText(/item added to cart/i)).toBeInTheDocument();
    const badge = screen.getByTestId('badge');
    waitFor(async () => expect(await within(badge).findByTitle('1')));
  });

  it('navigates to pagenotfound on invalid slug', async () => {
    renderCategoryProduct('invalid-slug');

    await screen.findByText(/page not found/i);
  });
});