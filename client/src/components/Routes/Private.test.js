import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import PrivateRoute from './Private';
import { useAuth } from '../../context/auth';

jest.mock('axios');
jest.mock('../../context/auth');
jest.mock('../Spinner', () => {
  return function Spinner() {
    return <div data-testid="spinner">Loading...</div>;
  };
});

describe('PrivateRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication Success', () => {
    it('renders protected content when user is authenticated', async () => {
      // Arrange
      useAuth.mockReturnValue([{ token: 'validToken123' }]);
      axios.get.mockResolvedValue({ data: { ok: true } });

      // Act
      render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/protected" element={<PrivateRoute />}>
              <Route path="/protected" element={<div>Protected Content</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      );

      // Assert
      expect(screen.getByTestId('spinner')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });
      
      expect(axios.get).toHaveBeenCalledWith('/api/v1/auth/user-auth');
      expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
    });
  });

  describe('Authentication Failure', () => {
    it('shows spinner when auth check returns ok: false', async () => {
      // Arrange
      useAuth.mockReturnValue([{ token: 'invalidToken' }]);
      axios.get.mockResolvedValue({ data: { ok: false } });

      // Act
      render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/protected" element={<PrivateRoute />}>
              <Route path="/protected" element={<div>Protected Content</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      );

      // Assert
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalled();
      });

      expect(screen.getByTestId('spinner')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('shows spinner when API request fails', async () => {
      // Arrange
      useAuth.mockReturnValue([{ token: 'token123' }]);
      axios.get.mockRejectedValue(new Error('Network error'));

      // Act
      render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/protected" element={<PrivateRoute />}>
              <Route path="/protected" element={<div>Protected Content</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      );

      // Assert
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalled();
      });

      expect(screen.getByTestId('spinner')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('shows spinner and skips API call when token is missing', () => {
      // Arrange
      useAuth.mockReturnValue([{ token: null }]);

      // Act
      render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/protected" element={<PrivateRoute />}>
              <Route path="/protected" element={<div>Protected Content</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      );

      // Assert
      expect(screen.getByTestId('spinner')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      expect(axios.get).not.toHaveBeenCalled();
    });
  });
});