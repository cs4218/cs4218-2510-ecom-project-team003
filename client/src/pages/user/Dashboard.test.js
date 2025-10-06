import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from './Dashboard';
import { useAuth } from '../../context/auth';

jest.mock('../../context/auth');
jest.mock('../../components/Layout', () => {
  return function Layout({ children, title }) {
    return (
      <div data-testid="layout" data-title={title}>
        {children}
      </div>
    );
  };
});
jest.mock('../../components/UserMenu', () => {
  return function UserMenu() {
    return <div data-testid="user-menu">User Menu</div>;
  };
});

describe('Dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderDashboard = () => {
    return render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
  };

  it('renders user information when authenticated', () => {
    // Arrange
    useAuth.mockReturnValue([{
      user: {
        name: 'John Doe',
        email: 'john@example.com',
        address: '123 Main Street'
      }
    }]);

    // Act
    renderDashboard();

    // Assert
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('123 Main Street')).toBeInTheDocument();
    expect(screen.getByTestId('layout')).toHaveAttribute('data-title', 'Dashboard - Ecommerce App');
    expect(screen.getByTestId('user-menu')).toBeInTheDocument();
  });

  it('renders without crashing when user data is missing', () => {
    // Arrange
    useAuth.mockReturnValue([{ user: null }]);

    // Act
    renderDashboard();

    // Assert
    expect(screen.getByTestId('layout')).toBeInTheDocument();
    expect(screen.getByTestId('user-menu')).toBeInTheDocument();
  });

  it('renders without crashing when auth is undefined', () => {
    // Arrange
    useAuth.mockReturnValue([undefined]);

    // Act & Assert
    expect(() => renderDashboard()).not.toThrow();
  });
});