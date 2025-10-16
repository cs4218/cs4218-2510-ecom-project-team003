import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import AdminRoute from './AdminRoute';

jest.mock('axios');
jest.mock('react-hot-toast');

const mockUseAuth = jest.fn();
jest.mock('../../context/auth', () => ({
  useAuth: () => mockUseAuth(),
}));

const mockSpinner = jest.fn();
jest.mock('../Spinner', () => (props) => {
  mockSpinner(props);
  return <div data-testid='spinner' />;
});

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Outlet: () => <div data-testid='outlet' />,
}));

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

  it('renders Spinner while awaiting admin auth', async () => {
    mockUseAuth.mockReturnValue([{ token: 'valid-token' }, jest.fn(), jest.fn()]);
    axios.get.mockImplementation(() => new Promise(() => { }));

    renderAdminRoute();

    expect(await screen.findByTestId('spinner')).toBeInTheDocument();
  });

  it('renders Outlet if admin auth is successful', async () => {
    mockUseAuth.mockReturnValue([{ token: 'valid-token' }, jest.fn(), jest.fn()]);
    axios.get.mockResolvedValue({ data: { ok: true } });

    renderAdminRoute();

    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(await screen.findByTestId('outlet')).toBeInTheDocument();
    expect(screen.queryByTestId('spinner')).toBeNull();
  });

  it('renders Spinner if admin auth is unsuccessful', async () => {
    mockUseAuth.mockReturnValue([{ token: 'valid-token' }, jest.fn(), jest.fn()]);
    axios.get.mockResolvedValue({ data: { ok: false } });

    renderAdminRoute();

    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(await screen.findByTestId('spinner')).toBeInTheDocument();
    expect(screen.queryByTestId('outlet')).toBeNull();
  });

  it('renders Spinner if admin auth request fails', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation();
    const err = { message: 'Error while fetching' };
    mockUseAuth.mockReturnValue([{ token: 'valid-token' }, jest.fn(), jest.fn()]);
    axios.get.mockRejectedValue(err);

    renderAdminRoute();

    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(await screen.findByTestId('spinner')).toBeInTheDocument();
    expect(screen.queryByTestId('outlet')).toBeNull();
    expect(spy).toHaveBeenCalledWith(err);

    spy.mockRestore();
  });

  it('renders Spinner if no token', async () => {
    mockUseAuth.mockReturnValue([null, jest.fn(), jest.fn()]);

    renderAdminRoute();

    expect(axios.get).not.toHaveBeenCalled();
    expect(await screen.findByTestId('spinner')).toBeInTheDocument();
    expect(screen.queryByTestId('outlet')).toBeNull();
  });

  it('does not log out user if admin auth is successful', async () => {
    const mockLogout = jest.fn();
    mockUseAuth.mockReturnValue([{ token: 'valid-token' }, jest.fn(), mockLogout]);
    axios.get.mockResolvedValue({ data: { ok: true } });

    // Render and await side effects
    renderAdminRoute();

    expect(await screen.findByTestId('outlet')).toBeInTheDocument();
    await waitFor(() => expect(mockLogout).not.toHaveBeenCalled());
  });

  it('logs out user if admin auth is unsuccessful', async () => {
    const mockLogout = jest.fn();
    mockUseAuth.mockReturnValue([{ token: 'valid-token' }, jest.fn(), mockLogout]);
    axios.get.mockResolvedValue({ data: { ok: false } });

    // Render and await state updates
    renderAdminRoute();

    expect(await screen.findByTestId('spinner')).toBeInTheDocument();
    expect(mockSpinner).toHaveBeenCalledTimes(1);
    const onTimeoutProp = mockSpinner.mock.calls[0][0].onTimeout;
    onTimeoutProp();
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});