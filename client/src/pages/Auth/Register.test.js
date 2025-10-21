import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom';
import toast from 'react-hot-toast';
import Register from './Register';

jest.mock('axios');
jest.mock('react-hot-toast');

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../context/auth', () => ({
  useAuth: jest.fn(() => [null, jest.fn()])
}));

jest.mock('../../context/cart', () => ({
  useCart: jest.fn(() => ({ cart: [] })),
}));

jest.mock('../../context/search', () => ({
  useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()])
}));

jest.mock('../../hooks/useCategory', () => 
  jest.fn(() => [])
);

Object.defineProperty(window, 'localStorage', {
  value: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
  },
  writable: true,
});

window.matchMedia = window.matchMedia || function() {
  return {
    matches: false,
    addListener: function() {},
    removeListener: function() {}
  };
};

describe('Register Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('UI Rendering', () => {
    it('renders registration form with all required fields and correct types', () => {
      // Arrange & Act
      render(
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<Register />} />
          </Routes>
        </MemoryRouter>
      );

      // Assert
      expect(screen.getByText(/register form/i)).toBeInTheDocument();

      expect(screen.getByPlaceholderText(/enter your name/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/enter your name/i)).toHaveAttribute('type', 'text');
      expect(screen.getByPlaceholderText(/enter your name/i)).toHaveAttribute('required');

      expect(screen.getByPlaceholderText(/enter your email/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/enter your email/i)).toHaveAttribute('type', 'email');
      expect(screen.getByPlaceholderText(/enter your email/i)).toHaveAttribute('required');

      expect(screen.getByPlaceholderText(/enter your password/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/enter your password/i)).toHaveAttribute('type', 'password');
      expect(screen.getByPlaceholderText(/enter your password/i)).toHaveAttribute('required');

      expect(screen.getByPlaceholderText(/enter your phone/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/enter your phone/i)).toHaveAttribute('type', 'tel');
      expect(screen.getByPlaceholderText(/enter your phone/i)).toHaveAttribute('required');

      expect(screen.getByPlaceholderText(/enter your address/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/enter your address/i)).toHaveAttribute('type', 'text');
      expect(screen.getByPlaceholderText(/enter your address/i)).toHaveAttribute('required');

      expect(screen.getByPlaceholderText(/enter your dob/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/enter your dob/i)).toHaveAttribute('type', 'date');
      expect(screen.getByPlaceholderText(/enter your dob/i)).toHaveAttribute('required');

      expect(screen.getByPlaceholderText(/favorite sports/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/favorite sports/i)).toHaveAttribute('type', 'text');
      expect(screen.getByPlaceholderText(/favorite sports/i)).toHaveAttribute('required');

      expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();

    });
  });

  describe('Successful Registration', () => {
    it('registers user successfully with valid data', async () => {
      // Arrange
      axios.post.mockResolvedValueOnce({ 
        data: { success: true, message: 'User registered successfully' } 
      });

      render(
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<Register />} />
          </Routes>
        </MemoryRouter>
      );
    
      // Act
      fireEvent.change(screen.getByPlaceholderText(/enter your name/i), { 
        target: { value: 'John Doe' } 
      });
      fireEvent.change(screen.getByPlaceholderText(/enter your email/i), { 
        target: { value: 'test@example.com' } 
      });
      fireEvent.change(screen.getByPlaceholderText(/enter your password/i), { 
        target: { value: 'password123' } 
      });
      fireEvent.change(screen.getByPlaceholderText(/enter your phone/i), { 
        target: { value: '1234567890' } 
      });
      fireEvent.change(screen.getByPlaceholderText(/enter your address/i), { 
        target: { value: '123 Test Street' } 
      });
      fireEvent.change(screen.getByPlaceholderText(/enter your dob/i), { 
        target: { value: '2000-01-01' } 
      });
      fireEvent.change(screen.getByPlaceholderText(/favorite sports/i), { 
        target: { value: 'Football' } 
      });
      fireEvent.click(screen.getByRole('button', { name: /register/i }));

      // Assert
      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith('/api/v1/auth/register', {
          name: 'John Doe',
          email: 'test@example.com',
          password: 'password123',
          phone: '1234567890',
          address: '123 Test Street',
          DOB: '2000-01-01',
          answer: 'Football',
        });
      });

      expect(toast.success).toHaveBeenCalledWith('User registered successfully');
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  describe('Registration Failures', () => {
    it('displays error when email already exists', async () => {
      // Arrange
      axios.post.mockResolvedValueOnce({ 
        data: { success: false, message: 'Email already exists' } 
      });

      render(
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<Register />} />
          </Routes>
        </MemoryRouter>
      );
      
      // Act
      fireEvent.change(screen.getByPlaceholderText(/enter your name/i), { 
        target: { value: 'John Doe' } 
      });
      fireEvent.change(screen.getByPlaceholderText(/enter your email/i), { 
        target: { value: 'test@example.com' } 
      });
      fireEvent.change(screen.getByPlaceholderText(/enter your password/i), { 
        target: { value: 'password123' } 
      });
      fireEvent.change(screen.getByPlaceholderText(/enter your phone/i), { 
        target: { value: '1234567890' } 
      });
      fireEvent.change(screen.getByPlaceholderText(/enter your address/i), { 
        target: { value: '123 Test Street' } 
      });
      fireEvent.change(screen.getByPlaceholderText(/enter your dob/i), { 
        target: { value: '2000-01-01' } 
      });
      fireEvent.change(screen.getByPlaceholderText(/favorite sports/i), { 
        target: { value: 'Football' } 
      });
      fireEvent.click(screen.getByRole('button', { name: /register/i }));

      // Assert
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Email already exists');
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('displays backend error message on server error', async () => {
      // Arrange
      axios.post.mockRejectedValueOnce({
        response: { 
          status: 500, 
          data: { message: 'Database connection failed' } 
        }
      });

      render(
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<Register />} />
          </Routes>
        </MemoryRouter>
      );

      // Act
      fireEvent.change(screen.getByPlaceholderText(/enter your name/i), { 
        target: { value: 'John Doe' } 
      });
      fireEvent.change(screen.getByPlaceholderText(/enter your email/i), { 
        target: { value: 'test@example.com' } 
      });
      fireEvent.change(screen.getByPlaceholderText(/enter your password/i), { 
        target: { value: 'password123' } 
      });
      fireEvent.change(screen.getByPlaceholderText(/enter your phone/i), { 
        target: { value: '1234567890' } 
      });
      fireEvent.change(screen.getByPlaceholderText(/enter your address/i), { 
        target: { value: '123 Test Street' } 
      });
      fireEvent.change(screen.getByPlaceholderText(/enter your dob/i), { 
        target: { value: '2000-01-01' } 
      });
      fireEvent.change(screen.getByPlaceholderText(/favorite sports/i), { 
        target: { value: 'Football' } 
      });
      fireEvent.click(screen.getByRole('button', { name: /register/i }));

      // Assert
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Database connection failed');
      });
      
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('handles network error when response is undefined', async () => {
      // Arrange
      axios.post.mockRejectedValueOnce(new Error('Network Error'));

      render(
          <MemoryRouter initialEntries={['/register']}>
            <Routes>
              <Route path="/register" element={<Register />} />
            </Routes>
          </MemoryRouter>
      );
      
      // Act
      fireEvent.change(screen.getByPlaceholderText(/enter your name/i), { 
        target: { value: 'John Doe' } 
      });
      fireEvent.change(screen.getByPlaceholderText(/enter your email/i), { 
        target: { value: 'test@example.com' } 
      });
      fireEvent.change(screen.getByPlaceholderText(/enter your password/i), { 
        target: { value: 'password123' } 
      });
      fireEvent.change(screen.getByPlaceholderText(/enter your phone/i), { 
        target: { value: '1234567890' } 
      });
      fireEvent.change(screen.getByPlaceholderText(/enter your address/i), { 
        target: { value: '123 Test Street' } 
      });
      fireEvent.change(screen.getByPlaceholderText(/enter your dob/i), { 
        target: { value: '2000-01-01' } 
      });
      fireEvent.change(screen.getByPlaceholderText(/favorite sports/i), { 
        target: { value: 'Football' } 
      });
      fireEvent.click(screen.getByRole('button', { name: /register/i }));

      // Assert
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Network error. Please try again.');
      });
      
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('disables register button and shows "Registering..." after clicking once', async () => {
      // Arrange
      axios.post.mockResolvedValueOnce({
        data: { success: true, message: 'User registered successfully' }
      });

      render(
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<Register />} />
          </Routes>
        </MemoryRouter>
      );

      fireEvent.change(screen.getByPlaceholderText(/enter your name/i), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByPlaceholderText(/enter your email/i), { target: { value: 'john@example.com' } });
      fireEvent.change(screen.getByPlaceholderText(/enter your password/i), { target: { value: 'password123' } });
      fireEvent.change(screen.getByPlaceholderText(/enter your phone/i), { target: { value: '12345678' } });
      fireEvent.change(screen.getByPlaceholderText(/enter your address/i), { target: { value: '123 Main St' } });
      fireEvent.change(screen.getByPlaceholderText(/enter your dob/i), { target: { value: '2000-01-01' } });
      fireEvent.change(screen.getByPlaceholderText(/favorite sports/i), { target: { value: 'Football' } });

      // Act
      const registerButton = screen.getByRole('button', { name: /register/i });
      fireEvent.click(registerButton);

      // Assert
      expect(registerButton).toBeDisabled();
      expect(registerButton).toHaveTextContent(/registering/i);
    });

    it('prevents multiple rapid register submissions', async () => {
      // Arrange
      axios.post.mockResolvedValueOnce({
        data: { success: true, message: 'User registered successfully' }
      });
      const postSpy = jest.spyOn(axios, 'post');

      render(
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<Register />} />
          </Routes>
        </MemoryRouter>
      );

      fireEvent.change(screen.getByPlaceholderText(/enter your name/i), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByPlaceholderText(/enter your email/i), { target: { value: 'john@example.com' } });
      fireEvent.change(screen.getByPlaceholderText(/enter your password/i), { target: { value: 'password123' } });
      fireEvent.change(screen.getByPlaceholderText(/enter your phone/i), { target: { value: '12345678' } });
      fireEvent.change(screen.getByPlaceholderText(/enter your address/i), { target: { value: '123 Main St' } });
      fireEvent.change(screen.getByPlaceholderText(/enter your dob/i), { target: { value: '2000-01-01' } });
      fireEvent.change(screen.getByPlaceholderText(/favorite sports/i), { target: { value: 'Football' } });

      // Act
      const button = screen.getByRole('button', { name: /register/i });
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      // Assert
      await waitFor(() => expect(postSpy).toHaveBeenCalledTimes(1));
    });
  });
});