import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import UserMenu from './UserMenu';

describe('UserMenu', () => {
  it('renders dashboard heading and navigation links', () => {
    // Arrange & Act
    render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    );

    // Assert
    expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /profile/i })).toHaveAttribute('href', '/dashboard/user/profile');
    expect(screen.getByRole('link', { name: /orders/i })).toHaveAttribute('href', '/dashboard/user/orders');
  });
});