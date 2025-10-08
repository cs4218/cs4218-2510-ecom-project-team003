import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import ProductDetails from './ProductDetails';
import Pagenotfound from './Pagenotfound';
import { AuthProvider } from '../context/auth';
import { SearchProvider } from '../context/search';
import { CartProvider } from '../context/cart';
import { Toaster } from 'react-hot-toast';
import { ELECTRONICS, LAPTOP, SMARTPHONE, TABLET } from '../../tests/helpers/testData';
import { resetDatabase, seedCategories, seedProducts } from '../../tests/helpers/seedApi';

console.log = jest.fn();

const renderProductDetails = (slug) => {
  return render(
    <AuthProvider>
      <SearchProvider>
        <CartProvider>
          <MemoryRouter initialEntries={[`/product/${slug}`]}>
            <Toaster />
            <Routes>
              <Route path="/product/:slug" element={<ProductDetails />} />
              <Route path="*" element={<Pagenotfound />} />
            </Routes>
          </MemoryRouter>
        </CartProvider>
      </SearchProvider>
    </AuthProvider>
  );
}

describe('Product Details Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await resetDatabase();
  });

  it('renders product details', async () => {
    await seedCategories([ELECTRONICS]);
    await seedProducts([LAPTOP]);

    await renderProductDetails(LAPTOP.slug);

    const productDetails = screen.getByTestId('product-details');
    expect(await within(productDetails).findByText(/name.*laptop/i)).toBeInTheDocument();
    expect(await within(productDetails).findByText(/a powerful laptop/i)).toBeInTheDocument();
    expect(await within(productDetails).findByText(/\$1,499\.99/i)).toBeInTheDocument();
    expect(await within(productDetails).findByText(/electronics/i)).toBeInTheDocument();
    expect(within(productDetails).getByRole('button', { name: /add to cart/i })).toBeInTheDocument();
  });

  it('renders no related products', async () => {
    await seedCategories([ELECTRONICS]);
    await seedProducts([LAPTOP]);

    renderProductDetails(LAPTOP.slug);

    waitFor(async () => expect(await screen.findByText(/name.*laptop/i)).toBeInTheDocument());
    expect(await screen.findByText(/no similar products/i)).toBeInTheDocument();
  });

  it('renders related products', async () => {
    await seedCategories([ELECTRONICS]);
    await seedProducts([LAPTOP, SMARTPHONE, TABLET]);

    renderProductDetails(LAPTOP.slug);

    expect(await screen.findByText(SMARTPHONE.name)).toBeInTheDocument();
    expect(await screen.findByText('$999.99')).toBeInTheDocument();
    expect(await screen.findByText(SMARTPHONE.description)).toBeInTheDocument();

    expect(await screen.findByText(TABLET.name)).toBeInTheDocument();
    expect(await screen.findByText('$599.99')).toBeInTheDocument();
    expect(await screen.findByText(TABLET.description)).toBeInTheDocument();
  });

  it('navigates to related product', async () => {
    await seedCategories([ELECTRONICS]);
    await seedProducts([LAPTOP, TABLET]);

    renderProductDetails(LAPTOP.slug);
    fireEvent.click(await screen.findByRole('button', { name: /details/i }));

    expect(await screen.findByText(/name.*tablet/i)).toBeInTheDocument();
  });

  it('navigates to pagenotfound on invalid slug', async () => {
    renderProductDetails(LAPTOP.slug);

    await screen.findByText(/page not found/i);
  });

  it('adds product to cart', async () => {
    await seedCategories([ELECTRONICS]);
    await seedProducts([LAPTOP]);

    renderProductDetails(LAPTOP.slug);
    expect(await screen.findByText(/name.*laptop/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /add to cart/i }));

    expect(await screen.findByText(/item added to cart/i)).toBeInTheDocument();
    const badge = screen.getByTestId('badge');
    waitFor(async () => expect(await within(badge).findByTitle('1')));
  });

  it('adds related product to cart', async () => {
    await seedCategories([ELECTRONICS]);
    await seedProducts([SMARTPHONE, TABLET]);

    renderProductDetails(SMARTPHONE.slug);
    fireEvent.click(await screen.findByTestId('add-related-to-cart-btn'));

    const badge = screen.getByTestId('badge');
    waitFor(async () => expect(await within(badge).findByTitle('1')));
  });
});