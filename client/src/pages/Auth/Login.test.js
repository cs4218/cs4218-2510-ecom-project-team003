import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import toast from 'react-hot-toast';
import Login from './Login';

// Mocking axios.post
jest.mock('axios');

// Mocking react-hot-toast
jest.mock('react-hot-toast'); 

const mockNavigate = jest.fn();
const mockLocation = { state: null };

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
}));

let mockSetAuth = jest.fn();

jest.mock('../../context/auth', () => {
  return {
    useAuth: jest.fn(() => [ // to mock useAuth hook
      { user: null, token: "" },
      mockSetAuth // mock function for setAuth
    ]),
  };
});


jest.mock('../../context/cart', () => ({
  useCart: jest.fn(() => ({cart: []})), // Mock for useCart to return a state
}));

jest.mock('../../context/search', () => ({
  useSearch: jest.fn(() => [
    {
      keyword: "",
      results: [],
    }, 
    jest.fn()
  ]), // Mock for useSearch to return a state and setValue
}));

jest.mock('../../hooks/useCategory', () => (
  jest.fn(() => []) // Mock useCategory hook to return an empty array
));

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

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocation.state = null;
  });
  
  describe('UI Rendering', () => {
    it('Renders Login Form', () => {

      // Arrange & Act
      render(
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<Login />} />
          </Routes>
        </MemoryRouter>
      );

      // Assert
      expect(screen.getByText(/login form/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/enter your email/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/enter your password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /forgot password/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });
  });

  describe('Successful Logins', () => {
    it('Logins the user successfully and directed to Home Page when location.state is null', async () => {
        
      // Arrange
      const mockResponse = {
        data: {
          success: true,
          message: 'Login Successful',
          user: { id: 1, name: 'John Doe' },
          token: 'mockToken'
        }
      };

      axios.post.mockResolvedValueOnce(mockResponse);
      
      render(
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<Login />} />
          </Routes>
        </MemoryRouter>
      );

      // Act
      fireEvent.change(screen.getByPlaceholderText(/enter your email/i), { target: { value: 'johndoe@gmail.com' } });
      fireEvent.change(screen.getByPlaceholderText(/enter your password/i), { target: { value: 'password123' } });
      fireEvent.click(screen.getByRole('button', { name: /login/i }));

      // Assert
      await waitFor(() => expect(axios.post).toHaveBeenCalledWith('/api/v1/auth/login', {
          email: 'johndoe@gmail.com',
          password: 'password123'
        })
      );
      expect(toast.success).toHaveBeenCalledWith("Login Successful", {
        duration: 5000,
        icon: '🙏',
        style: {
          background: 'green',
          color: 'white'
        }
      });

      expect(mockSetAuth).toHaveBeenCalledWith({
        user: mockResponse.data.user,
        token: mockResponse.data.token,
      });
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });

    it('Logins the user successfully and directed to location.state when it exists', async () => {
      
      // Arrange
      const mockResponse = {
        data: {
          success: true,
          message: 'Login Successful',
          user: { id: 1, name: 'John Doe' },
          token: 'mockToken'
        }
      };

      axios.post.mockResolvedValueOnce(mockResponse);
      mockLocation.state = '/dashboard';

      render(
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<Login />} />
          </Routes>
        </MemoryRouter>
      );

      // Act
      fireEvent.change(screen.getByPlaceholderText(/enter your email/i), { target: { value: 'johndoe@gmail.com' } });
      fireEvent.change(screen.getByPlaceholderText(/enter your password/i), { target: { value: 'password123' } });
      fireEvent.click(screen.getByRole('button', { name: /login/i }));

      // Assert
      await waitFor(() => expect(axios.post).toHaveBeenCalledWith('/api/v1/auth/login', {
          email: 'johndoe@gmail.com',
          password: 'password123'
        })
      );
      expect(toast.success).toHaveBeenCalledWith("Login Successful", {
        duration: 5000,
        icon: '🙏',
        style: {
          background: 'green',
          color: 'white'
        }
      });

      expect(mockSetAuth).toHaveBeenCalledWith({
        user: mockResponse.data.user,
        token: mockResponse.data.token,
      });
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });
  });

  describe('Login Failures', () => {
    it('Throws error message "Invalid credentials" when email does not exists or wrong password', async () => {
      
      //Arrange
      axios.post.mockRejectedValueOnce({
        response: { status: 500, data: { message: 'Invalid credentials' } },
      });

      render(
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<Login />} />
          </Routes>
        </MemoryRouter>
      );

      // Act
      fireEvent.change(screen.getByPlaceholderText(/enter your email/i), { target: { value: 'johndoe@gmail.com' } });
      fireEvent.change(screen.getByPlaceholderText(/enter your password/i), { target: { value: 'password123' } });
      fireEvent.click(screen.getByRole('button', { name: /login/i }));

      // Assert
      await waitFor(() => expect(axios.post).toHaveBeenCalled());
      expect(toast.error).toHaveBeenCalledWith('Invalid credentials');
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(window.localStorage.setItem).not.toHaveBeenCalled();
    });

    it('shows "Error in login" when server returns 500', async () => {
      // Arrange
      axios.post.mockRejectedValueOnce({
        response: { status: 500, data: { message: 'Error in login' } },
      });

      render(
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<Login />} />
          </Routes>
        </MemoryRouter>
      );

      // Act
      fireEvent.change(screen.getByPlaceholderText(/enter your email/i), { target: { value: 'johndoe@gmail.com' } });
      fireEvent.change(screen.getByPlaceholderText(/enter your password/i), { target: { value: 'password123' } });
      fireEvent.click(screen.getByRole('button', { name: /login/i }));

      // Assert
      await waitFor(() => expect(axios.post).toHaveBeenCalled());
      expect(toast.error).toHaveBeenCalledWith('Error in login');
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(window.localStorage.setItem).not.toHaveBeenCalled();
    });

    it('handles network error when response is undefined', async () => {
      // Arrange
      axios.post.mockRejectedValueOnce(new Error('Network Error'));

      render(
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<Login />} />
          </Routes>
        </MemoryRouter>
      );

      // Act
      fireEvent.change(screen.getByPlaceholderText(/enter your email/i), 
        { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByPlaceholderText(/enter your password/i), 
        { target: { value: 'password123' } });
      fireEvent.click(screen.getByRole('button', { name: /login/i }));

      // Assert - Exposes bug in Login.js
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Network error. Please try again.");
      });
      
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(window.localStorage.setItem).not.toHaveBeenCalled();
    });

    it('displays error when backend returns success: false', async () => {
      // Arrange
      const mockResponse = {
        data: {
          success: false,
          message: 'Account is disabled'
        }
      };
      axios.post.mockResolvedValueOnce(mockResponse);

      render(
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<Login />} />
          </Routes>
        </MemoryRouter>
      );

      // Act
      fireEvent.change(screen.getByPlaceholderText(/enter your email/i), 
        { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByPlaceholderText(/enter your password/i), 
        { target: { value: 'password123' } });
      fireEvent.click(screen.getByRole('button', { name: /login/i }));

      // Assert
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Account is disabled');
      });
      
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(window.localStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('Navigation', () => {
    it('navigates to /forgot-password when "Forgot Password" button is clicked', async () => {
      // Arrange
      render(
        <MemoryRouter initialEntries={["/login"]}>
          <Routes>
            <Route path="/login" element={<Login />} />
          </Routes>
        </MemoryRouter>
      );

      // Act
      fireEvent.click(screen.getByRole('button', { name: /forgot password/i }));

      // Assert
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/forgot-password');
      });
    });
  })

  describe("Edge Cases", () => {
    it("should disable login button and show 'Logging in...' text after clicking", async () => {
      // ARRANGE
      render(
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<Login />} />
          </Routes>
        </MemoryRouter>
      );

      // ACT
      fireEvent.change(screen.getByPlaceholderText(/enter your email/i), {
        target: { value: "john@example.com" },
      });
      fireEvent.change(screen.getByPlaceholderText(/enter your password/i), {
        target: { value: "password123" },
      });

      const loginButton = screen.getByRole("button", { name: /^login$/i });
      fireEvent.click(loginButton);

      // ASSERT
      expect(loginButton).toBeDisabled();
      expect(loginButton).toHaveTextContent(/logging in/i);
      
    });

    it('prevents multiple clicks during submission', async () => {
      // Arrange
      axios.post.mockResolvedValueOnce({
        data: { success: true, message: 'Login Successful', user: {}, token: 't' },
      });

      render(
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<Login />} />
          </Routes>
        </MemoryRouter>
      );

      // Act
      fireEvent.change(screen.getByPlaceholderText(/enter your email/i), { target: { value: 'a@b.com' } });
      fireEvent.change(screen.getByPlaceholderText(/enter your password/i), { target: { value: 'pass' } });

      const button = screen.getByRole('button', { name: /login/i });
      fireEvent.click(button);
      fireEvent.click(button);

      // Assert
      await waitFor(() => expect(axios.post).toHaveBeenCalledTimes(1));
    });
  });
});