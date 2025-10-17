import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import AdminDashboard from './AdminDashboard';

jest.mock('axios');

const ADMIN_USER = {
  'name': 'Admin User',
  'email': 'admin@cs4218.com',
  'phone': '98765432'
}

jest.mock('../../context/auth', () => ({
  useAuth: () => [{ user: ADMIN_USER }, jest.fn(), jest.fn()]
}));

jest.mock('../../context/cart', () => ({
  useCart: jest.fn(() => ({}))
}));

jest.mock('../../context/search', () => ({
  useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()])
}));

jest.mock('../../hooks/useCategory', () => jest.fn(() => []));

const renderAdminDashboard = () => {
  return render(
    <MemoryRouter initialEntries={['/dashboard/admin']}>
      <Routes>
        <Route path="/dashboard/admin" element={<AdminDashboard />} />
      </Routes>
    </MemoryRouter>
  );
}

it('renders admin details', async () => {
  renderAdminDashboard();

  const card = screen.getByTestId('admin-dashboard');

  expect(await within(card).findByText(new RegExp(ADMIN_USER.name, 'i'))).toBeInTheDocument();
  expect(await within(card).findByText(new RegExp(ADMIN_USER.email, 'i'))).toBeInTheDocument();
  expect(await within(card).findByText(new RegExp(ADMIN_USER.phone, 'i'))).toBeInTheDocument();
});
