import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
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

const mockSetAuth = jest.fn();
jest.mock('../../context/auth', () => ({
  useAuth: jest.fn(() => [{ user: USER }, mockSetAuth])
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

const renderProfile = (slug) => {
  return render(
    <MemoryRouter initialEntries={['/dashboard/user/profile']}>
      <Routes>
        <Route path="/dashboard/user/profile" element={<Profile />} />
      </Routes>
    </MemoryRouter>
  );
}

const fillProfileForm = (getByPlaceholderText, { name, phone, address, password }) => {
  fireEvent.change(getByPlaceholderText('Enter Your Name'), { target: { value: name } });
  fireEvent.change(getByPlaceholderText('Enter Your Phone'), { target: { value: phone } });
  fireEvent.change(getByPlaceholderText('Enter Your Address'), { target: { value: address } });
  fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: password } });
}

describe('Profile Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders profile form', () => {
    const { getByPlaceholderText } = renderProfile();

    expect(getByPlaceholderText('Enter Your Name')).toHaveValue(USER.name);
    expect(getByPlaceholderText('Enter Your Email')).toHaveValue(USER.email);
    expect(getByPlaceholderText('Enter Your Phone')).toHaveValue(USER.phone);
    expect(getByPlaceholderText('Enter Your Address')).toHaveValue(USER.address);
    expect(getByPlaceholderText('Enter Your Password')).toHaveValue('');
  });

  it('should allow typing in the name, phone, address and password fields', () => {
    const { getByPlaceholderText } = renderProfile();

    fillProfileForm(getByPlaceholderText, { ...UPDATED_USER, password: UPDATED_PASSWORD });

    expect(getByPlaceholderText('Enter Your Name')).toHaveValue(UPDATED_USER.name);
    expect(getByPlaceholderText('Enter Your Phone')).toHaveValue(UPDATED_USER.phone);
    expect(getByPlaceholderText('Enter Your Address')).toHaveValue(UPDATED_USER.address);
    expect(getByPlaceholderText('Enter Your Password')).toHaveValue(UPDATED_PASSWORD);
  });

  it('should not allow typing in the email field', () => {
    const { getByPlaceholderText } = renderProfile();

    const emailInput = getByPlaceholderText('Enter Your Email');
    expect(emailInput).toBeDisabled();
  });

  it('should update the user profile successfully', async () => {
    axios.put.mockResolvedValue({ data: { updatedUser: UPDATED_USER } });
    const { getByPlaceholderText, getByText } = renderProfile();

    fillProfileForm(getByPlaceholderText, { ...UPDATED_USER, password: UPDATED_PASSWORD });
    fireEvent.click(getByText('UPDATE'));

    await waitFor(() => expect(axios.put).toHaveBeenCalled());
    expect(mockSetAuth).toHaveBeenCalledWith({ user: UPDATED_USER });
    expect(localStorage.setItem).toHaveBeenCalledWith('auth', JSON.stringify({ user: UPDATED_USER }));
    expect(toast.success).toHaveBeenCalledWith('Profile Updated Successfully');
  });

  it('handles error when profile update response contains error', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation();
    axios.put.mockResolvedValue({ data: { error: 'Update failed' } });
    const { getByPlaceholderText, getByText } = renderProfile();

    fillProfileForm(getByPlaceholderText, { ...UPDATED_USER, password: UPDATED_PASSWORD });
    fireEvent.click(getByText('UPDATE'));
    await waitFor(() => expect(axios.put).toHaveBeenCalled());
    expect(spy).toHaveBeenCalledWith('Update failed');
    expect(toast.error).toHaveBeenCalledWith('Update failed');

    spy.mockRestore();
  });

  it('handles error when profile update request fails', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation();
    const err = { message: 'Error while updating profile' };
    axios.put.mockRejectedValue(err);
    const { getByPlaceholderText, getByText } = renderProfile();

    fillProfileForm(getByPlaceholderText, { ...UPDATED_USER, password: UPDATED_PASSWORD });
    fireEvent.click(getByText('UPDATE'));
    await waitFor(() => expect(axios.put).toHaveBeenCalled());
    expect(spy).toHaveBeenCalledWith(err);
    expect(toast.error).toHaveBeenCalledWith('Something went wrong');

    spy.mockRestore();
  });
});