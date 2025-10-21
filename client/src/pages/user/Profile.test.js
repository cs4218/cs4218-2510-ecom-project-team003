import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from "@testing-library/user-event";
import axios from 'axios';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import toast from 'react-hot-toast';
import Profile from './Profile';

const USER = {
  "name": "Test",
  "email": "hello@test.com",
  "phone": "123",
  "address": "hell3@test.com",
}

const UPDATED_USER = {
  'name': 'Test2',
  'email': 'hello@test.com',
  'phone': '456',
  'address': 'hell4@test.net',
}

const UPDATED_PASSWORD = 'Password123!';

jest.mock('axios');
jest.mock('react-hot-toast');

mockSetAuth = jest.fn();
jest.mock('../../context/auth', () => ({
  useAuth: jest.fn(() => [{ user: USER }, mockSetAuth])
}));

jest.mock('../../context/cart', () => ({
  useCart: jest.fn(() => ({ cart: [] }))
}));

jest.mock('../../context/search', () => ({
  useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()])
}));

jest.mock('../../hooks/useCategory', () => (
  jest.fn(() => [])
));

Object.defineProperty(window, 'localStorage', {
  value: {
    setItem: jest.fn(),
    getItem: jest.fn(() => JSON.stringify({ user: USER })),
    removeItem: jest.fn(),
  },
  writable: true,
});

console.log = jest.fn();

const renderProfile = () => {
  return render(
    <MemoryRouter initialEntries={['/dashboard/user/profile']}>
      <Routes>
        <Route path="/dashboard/user/profile" element={<Profile />} />
      </Routes>
    </MemoryRouter>
  );
}

const fillProfileForm = ({ name, phone, address, password }) => {
  fireEvent.change(screen.getByPlaceholderText(/name/i), { target: { value: name } });
  fireEvent.change(screen.getByPlaceholderText(/phone/i), { target: { value: phone } });
  fireEvent.change(screen.getByPlaceholderText(/address/i), { target: { value: address } });
  fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: password } });
}

describe('Profile Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders profile form', () => {
    renderProfile();

    expect(screen.getByPlaceholderText(/name/i)).toHaveValue(USER.name);
    expect(screen.getByPlaceholderText(/email/i)).toHaveValue(USER.email);
    expect(screen.getByPlaceholderText(/phone/i)).toHaveValue(USER.phone);
    expect(screen.getByPlaceholderText(/address/i)).toHaveValue(USER.address);
    expect(screen.getByPlaceholderText(/password/i)).toHaveValue('');
  });

  it('should allow typing in the name, phone, address and password fields', () => {
    renderProfile();

    fillProfileForm({ ...UPDATED_USER, password: UPDATED_PASSWORD });

    expect(screen.getByPlaceholderText(/name/i)).toHaveValue(UPDATED_USER.name);
    expect(screen.getByPlaceholderText(/phone/i)).toHaveValue(UPDATED_USER.phone);
    expect(screen.getByPlaceholderText(/address/i)).toHaveValue(UPDATED_USER.address);
    expect(screen.getByPlaceholderText(/password/i)).toHaveValue(UPDATED_PASSWORD);
  });

  it('should not allow typing in the email field', () => {
    renderProfile();

    const emailInput = screen.getByPlaceholderText(/email/i);
    expect(emailInput).toBeDisabled();

    waitFor(() => userEvent.type(emailInput, 'new-email@test.com'));
    expect(emailInput).toHaveValue(USER.email);
  });

  it('should update the user profile successfully', async () => {
    axios.put.mockResolvedValue({ data: { success: true, updatedUser: UPDATED_USER } });
    renderProfile();

    fillProfileForm({ ...UPDATED_USER, password: UPDATED_PASSWORD });
    fireEvent.click(await screen.findByRole('button', { name: /update/i }));

    await waitFor(() => expect(mockSetAuth).toHaveBeenCalledWith(expect.objectContaining({
      user: expect.objectContaining({
        name: UPDATED_USER.name,
        email: UPDATED_USER.email,
      })
    })));
    expect(toast.success).toHaveBeenCalledWith(expect.any(String));
  });

  it('handles error when profile update response contains error', async () => {
    axios.put.mockResolvedValue({ data: { error: 'Update failed' } });
    renderProfile();

    fillProfileForm({ ...UPDATED_USER, password: UPDATED_PASSWORD });
    fireEvent.click(await screen.findByRole('button', { name: /update/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.any(String)));
  });

  it('handles error when profile update request fails', async () => {
    const err = { message: 'Error while updating profile' };
    axios.put.mockRejectedValue(err);
    renderProfile();

    fillProfileForm({ ...UPDATED_USER, password: UPDATED_PASSWORD });
    fireEvent.click(await screen.findByRole('button', { name: /update/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.any(String)));
  });
});