import React from 'react';
import { render } from '@testing-library/react';
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

jest.mock('../Spinner', () => () => <div data-testid='spinner' />);

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

    it('renders Outlet if admin auth is successful', async () => {
        mockUseAuth.mockReturnValue([{ token: 'valid-token' }, jest.fn()]);
        axios.get.mockResolvedValue({ data: { ok: true } });

        const { findByTestId, queryByTestId } = renderAdminRoute();

        expect(axios.get).toHaveBeenCalledTimes(1);
        expect(await findByTestId('outlet')).toBeInTheDocument();
        expect(queryByTestId('spinner')).toBeNull();
    });

    it('renders Spinner if admin auth is unsuccessful', async () => {
        mockUseAuth.mockReturnValue([{ token: 'valid-token' }, jest.fn()]);
        axios.get.mockResolvedValue({ data: { ok: false } });

        const { findByTestId, queryByTestId } = renderAdminRoute();

        expect(axios.get).toHaveBeenCalledTimes(1);
        expect(await findByTestId('spinner')).toBeInTheDocument();
        expect(queryByTestId('outlet')).toBeNull();
    });

    it('renders Spinner if admin auth request fails', async () => {
        const spy = jest.spyOn(console, 'log').mockImplementation();
        const err = { message: 'Error while fetching' };
        mockUseAuth.mockReturnValue([{ token: 'valid-token' }, jest.fn()]);
        axios.get.mockRejectedValue(err);

        const { findByTestId, queryByTestId } = renderAdminRoute();

        expect(axios.get).toHaveBeenCalledTimes(1);
        expect(await findByTestId('spinner')).toBeInTheDocument();
        expect(queryByTestId('outlet')).toBeNull();
        expect(spy).toHaveBeenCalledWith(err);

        spy.mockRestore();
    });

    it('renders Spinner if no token', async () => {
        mockUseAuth.mockReturnValue([null, jest.fn()]);

        const { findByTestId, queryByTestId } = renderAdminRoute();

        expect(axios.get).not.toHaveBeenCalled();
        expect(await findByTestId('spinner')).toBeInTheDocument();
        expect(queryByTestId('outlet')).toBeNull();
    });

});