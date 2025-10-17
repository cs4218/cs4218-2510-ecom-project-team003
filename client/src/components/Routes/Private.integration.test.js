import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import { AuthProvider } from '../../context/auth';
import { Toaster } from 'react-hot-toast';
import PrivateRoute from './Private';
import { seedUsers, resetDatabase } from '../../../tests/helpers/seedApi';
import JWT from 'jsonwebtoken';
import dotenv from "dotenv";

dotenv.config({"path": ".env"});

console.log = jest.fn();

const ProtectedContent = () => <div data-testid="protected-content">Protected Content</div>;

const renderPrivateRoute = (authState = null) => {
  if (authState) localStorage.setItem('auth', JSON.stringify(authState));

  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/dashboard']}>
        <Toaster />
        <Routes>
          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<ProtectedContent />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
};

describe('PrivateRoute Integration', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await seedUsers([
      {
        _id: '64f3b2f9e1f1c2a1a0b0c0d0',
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        phone: '12345678',
        address: '123 Main St',
        answer: 'Blue',
        role: 0
      },
      {
        _id: '64f3b2f9e1f1c2a1a0b0c0d1',
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'adminpass123',
        phone: '87654321',
        address: '456 Admin Ave',
        answer: 'Red',
        role: 1
      }
    ]);
  });

  afterEach(async () => {
    localStorage.clear();
    await resetDatabase();
  });

  it('renders protected content for a valid user token', async () => {
    // ARRANGE
    const token = JWT.sign({ _id: '64f3b2f9e1f1c2a1a0b0c0d0' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const authState = { token, 
      user: {
        _id: '64f3b2f9e1f1c2a1a0b0c0d0',
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        phone: '12345678',
        address: '123 Main St',
        answer: 'Blue',
        role: 0
      },
    };

    // ACT
    renderPrivateRoute(authState);

    // ASSERT 
    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  it('renders protected content for a valid admin token', async () => {
    // ARRANGE
    const token = JWT.sign({ _id: '64f3b2f9e1f1c2a1a0b0c0d1' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const authState = { token,
      user: {
        _id: '64f3b2f9e1f1c2a1a0b0c0d1',
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'adminpass123',
        phone: '87654321',
        address: '456 Admin Ave',
        answer: 'Red',
        role: 1
      }
    };

    // ACT
    renderPrivateRoute(authState);

    // ASSERT
    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  it('shows spinner and blocks content if no token', async () => {
    // ARRANGE
    // no authState provided

    // ACT
    renderPrivateRoute();

    // ASSERT 
    expect(screen.getByText(/Redirecting you in 3 seconds/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  it('handles expired token correctly', async () => {
    // ARRANGE
    const token = JWT.sign({ _id: '64f3b2f9e1f1c2a1a0b0c0d0' }, process.env.JWT_SECRET, { expiresIn: '1s' });
    const authState = { token, 
      user: {
        _id: '64f3b2f9e1f1c2a1a0b0c0d0',
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        phone: '12345678',
        address: '123 Main St',
        answer: 'Blue',
        role: 0
      }
    };
    localStorage.setItem('auth', JSON.stringify(authState));

    await new Promise(resolve => setTimeout(resolve, 2000)); // wait for token to expire

    // ACT
    renderPrivateRoute(authState);

    // ASSERT
    expect(screen.getByText(/Redirecting you in 3 seconds/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  it('handles invalid token correctly', async () => {
    // ARRANGE
    const authState = { token: 'invalid-token', 
      user: {
        _id: '64f3b2f9e1f1c2a1a0b0c0d0',
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        phone: '12345678',
        address: '123 Main St',
        answer: 'Blue',
        role: 0
      }
     };
    localStorage.setItem('auth', JSON.stringify(authState));

    // ACT
    renderPrivateRoute(authState);

    // ASSERT
    expect(screen.getByText(/Redirecting you in 3 seconds/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });
});
