import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import AdminMenu from './AdminMenu';

const renderAdminMenu = () =>
  render(
    <MemoryRouter>
      <AdminMenu />
    </MemoryRouter>
  );

describe('Admin Menu Component', () => {
  it('Renders Create Category link', () => {
    renderAdminMenu();

    const createCategory = screen.getByRole('link', { name: /create category/i });
    expect(createCategory).toHaveAttribute('href', '/dashboard/admin/create-category');
  });

  it('Renders Create Product link', () => {
    renderAdminMenu();

    const createProduct = screen.getByRole('link', { name: /create product/i });
    expect(createProduct).toHaveAttribute('href', '/dashboard/admin/create-product');
  });

  it('renders Products link', () => {
    renderAdminMenu();

    const products = screen.getByRole('link', { name: /products/i });
    expect(products).toHaveAttribute('href', '/dashboard/admin/products')
  })

  it('Renders Orders link', () => {
    renderAdminMenu();

    const orders = screen.getByRole('link', { name: /orders/i });
    expect(orders).toHaveAttribute('href', '/dashboard/admin/orders');
  })
});