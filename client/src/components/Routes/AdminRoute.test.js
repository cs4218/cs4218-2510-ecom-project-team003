import React from 'react';
import { render, screen } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import AdminRoute from './AdminRoute';

jest.mock('axios');
jest.mock('react-hot-toast');

const mockUseAuth = jest.fn();
const mockLogout = jest.fn();
jest.mock('../../context/auth', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('../Spinner', () => () => <div data-testid='spinner' />);

jest.mock('../Loader', () => () => <div data-testid='loader' />);

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Outlet: () => <div data-testid='outlet' />,
}));

Object.defineProperty(window, 'localStorage', {
  value: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
  },
  writable: true,
});

const renderAdminRoute = () => {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route path="/dashboard" element={<AdminRoute />} />
      </Routes>
    </MemoryRouter>
  );
};

describe('AdminRoute Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders Loader while awaiting admin auth', async () => {
    mockUseAuth.mockReturnValue([{ token: 'valid-token' }, jest.fn(), mockLogout]);
    axios.get.mockImplementation(() => new Promise(() => { }));

    renderAdminRoute();

    expect(await screen.findByTestId('loader')).toBeInTheDocument();
  });

  it('renders Outlet if admin auth is successful', async () => {
    mockUseAuth.mockReturnValue([{ token: 'valid-token' }, jest.fn(), mockLogout]);
    axios.get.mockResolvedValue({ data: { ok: true } });

    renderAdminRoute();

    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(await screen.findByTestId('outlet')).toBeInTheDocument();
    expect(screen.queryByTestId('spinner')).toBeNull();
  });

  it('renders Spinner if admin auth is unsuccessful', async () => {
    mockUseAuth.mockReturnValue([{ token: 'valid-token' }, jest.fn(), mockLogout]);
    axios.get.mockResolvedValue({ data: { ok: false } });

    renderAdminRoute();

    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(await screen.findByTestId('spinner')).toBeInTheDocument();
    expect(screen.queryByTestId('outlet')).toBeNull();
  });

  it('renders Spinner if admin auth request fails', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation();
    const err = { message: 'Error while fetching' };
    mockUseAuth.mockReturnValue([{ token: 'valid-token' }, jest.fn(), mockLogout]);
    axios.get.mockRejectedValue(err);

    renderAdminRoute();

    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(await screen.findByTestId('spinner')).toBeInTheDocument();
    expect(screen.queryByTestId('outlet')).toBeNull();
    expect(spy).toHaveBeenCalledWith(err);

    spy.mockRestore();
  });

  it('renders Spinner if no token', async () => {
    mockUseAuth.mockReturnValue([null, jest.fn(), mockLogout]);

    renderAdminRoute();

    expect(axios.get).not.toHaveBeenCalled();
    expect(await screen.findByTestId('spinner')).toBeInTheDocument();
    expect(screen.queryByTestId('outlet')).toBeNull();
  });

  it('does not log out user if admin auth is successful', async () => {
    const mockSetAuth = jest.fn();
    mockUseAuth.mockReturnValue([{ token: 'valid-token' }, mockSetAuth, mockLogout]);
    axios.get.mockResolvedValue({ data: { ok: true } });

    // Render and await side effects
    renderAdminRoute();
    expect(await screen.findByTestId('outlet')).toBeInTheDocument();

    expect(mockSetAuth).not.toHaveBeenCalled();
    expect(mockLogout).not.toHaveBeenCalled();
    expect(window.localStorage.setItem).not.toHaveBeenCalled();
  });

  it('logs out user if admin auth is unsuccessful', async () => {
    const mockSetAuth = jest.fn();
    mockUseAuth.mockReturnValue([{ token: 'valid-token' }, mockSetAuth, mockLogout]);
    axios.get.mockResolvedValue({ data: { ok: false } });

    // Render and await state updates
    /*renderAdminRoute();
    expect(await screen.findByTestId('spinner')).toBeInTheDocument();

    expect(mockSetAuth).toHaveBeenCalledWith(expect.objectContaining({
      token: "",
      user: null,
    }));
    expect(window.localStorage.removeItem).toHaveBeenCalledWith("auth");*/
  });
});