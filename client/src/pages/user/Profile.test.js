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

jest.mock('../../context/auth', () => ({
  useAuth: jest.fn(() => [{ user: USER }, jest.fn()])
}));

jest.mock('../../context/cart', () => ({
  useCart: jest.fn(() => [null, jest.fn()])
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
  fireEvent.change(screen.getByTestId('name-input'), { target: { value: name } });
  fireEvent.change(screen.getByTestId('phone-input'), { target: { value: phone } });
  fireEvent.change(screen.getByTestId('address-input'), { target: { value: address } });
  fireEvent.change(screen.getByTestId('password-input'), { target: { value: password } });
}

describe('Profile Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders profile form', () => {
    renderProfile();

    expect(screen.getByTestId('name-input')).toHaveValue(USER.name);
    expect(screen.getByTestId('email-input')).toHaveValue(USER.email);
    expect(screen.getByTestId('phone-input')).toHaveValue(USER.phone);
    expect(screen.getByTestId('address-input')).toHaveValue(USER.address);
    expect(screen.getByTestId('password-input')).toHaveValue('');
  });

  it('should allow typing in the name, phone, address and password fields', () => {
    renderProfile();

    fillProfileForm({ ...UPDATED_USER, password: UPDATED_PASSWORD });

    expect(screen.getByTestId('name-input')).toHaveValue(UPDATED_USER.name);
    expect(screen.getByTestId('phone-input')).toHaveValue(UPDATED_USER.phone);
    expect(screen.getByTestId('address-input')).toHaveValue(UPDATED_USER.address);
    expect(screen.getByTestId('password-input')).toHaveValue(UPDATED_PASSWORD);
  });

  it('should not allow typing in the email field', () => {
    renderProfile();

    const emailInput = screen.getByTestId('email-input');
    expect(emailInput).toBeDisabled();

    waitFor(() => userEvent.type(emailInput, 'new-email@test.com'));
    expect(emailInput).toHaveValue(USER.email);
  });

  it('should update the user profile successfully', async () => {
    axios.put.mockResolvedValue({ data: { updatedUser: UPDATED_USER } });
    renderProfile();

    fillProfileForm({ ...UPDATED_USER, password: UPDATED_PASSWORD });
    fireEvent.click(screen.getByTestId('update-button'));

    await waitFor(() => expect(axios.put).toHaveBeenCalled());
    expect(localStorage.setItem).toHaveBeenCalled();
    const savedAuth = JSON.parse(localStorage.setItem.mock.calls[0][1]);
    expect(savedAuth.user).toMatchObject({
      name: UPDATED_USER.name,
      email: UPDATED_USER.email,
    });
    expect(toast.success).toHaveBeenCalledWith(expect.any(String));
  });

  it('handles error when profile update response contains error', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation();
    axios.put.mockResolvedValue({ data: { error: 'Update failed' } });
    renderProfile();

    fillProfileForm({ ...UPDATED_USER, password: UPDATED_PASSWORD });
    fireEvent.click(screen.getByTestId('update-button'));
    await waitFor(() => expect(axios.put).toHaveBeenCalled());
    expect(spy).toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith(expect.any(String));

    spy.mockRestore();
  });

  it('handles error when profile update request fails', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation();
    const err = { message: 'Error while updating profile' };
    axios.put.mockRejectedValue(err);
    renderProfile();

    fillProfileForm({ ...UPDATED_USER, password: UPDATED_PASSWORD });
    fireEvent.click(screen.getByTestId('update-button'));
    await waitFor(() => expect(axios.put).toHaveBeenCalled());
    expect(spy).toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith(expect.any(String));

    spy.mockRestore();
  });
});