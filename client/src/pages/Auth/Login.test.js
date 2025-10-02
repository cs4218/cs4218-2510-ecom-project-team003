import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import toast from 'react-hot-toast';
import Login from './Login';
import HomePage from '../../pages/HomePage';
import { useAuth } from '../../context/auth';
import { token } from 'morgan';
import ForgotPassword from './ForgotPassword';
import Dashboard from '../user/Dashboard';

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
  useCart: jest.fn(() => ({cart: []})), // Mock for useCart to return a state and setCart
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
  });

  // Just to check initial display of the Login page
  it('Renders Login Form', () => {
    // renders the login page in virtual DOM without use of actual browser URL
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('LOGIN FORM')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter Your Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter Your Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Forgot Password' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'LOGIN' })).toBeInTheDocument();
  });

  it('Inputs should initially be empty', () => {
    // renders the login page in virtual DOM without use of actual browser URL
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );
    
    expect(screen.getByText('LOGIN FORM')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter Your Email').value).toBe('');
    expect(screen.getByPlaceholderText('Enter Your Password').value).toBe('');
    expect(screen.getByRole('button', { name: 'Forgot Password' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'LOGIN' })).toBeInTheDocument();
  });

  it('Email and Password can be input', () => {
    // renders the login page in virtual DOM without use of actual browser URL
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );
    
    fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com'} });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Password'), { target: { value: 'password@123'} });

    expect(screen.getByText('LOGIN FORM')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter Your Email').value).toBe('test@example.com');
    expect(screen.getByPlaceholderText('Enter Your Password').value).toBe('password@123');
    expect(screen.getByRole('button', { name: 'Forgot Password' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'LOGIN' })).toBeInTheDocument();
  });

  // unreachable test case...
  it('Should show "Email and password are required" when email is empty', async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        success: false,
        message: "Email and password are required"
      }
    });
    
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );

  screen.getByPlaceholderText('Enter Your Email').removeAttribute('required');

    // Simulate form submission with empty email and valid password
    fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), { target: { value: '' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'LOGIN' }));

    // Wait for the validation error to be triggered
    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith('Email and password are required');
  });

  it('Should show "Email and password are required" when password is empty', async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        success: false,
        message: "Email and password are required"
      }
    });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );

    screen.getByPlaceholderText('Enter Your Password').removeAttribute('required');

    // Simulate form submission with empty email and valid password
    fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), { target: { value: 'test@gmail.com' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Password'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'LOGIN' }));

    // Wait for the validation error to be triggered
    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith('Email and password are required');
  });

  it('Logins the user successfully and directed to Home Page when location.state is null', async () => {
    // Mocking axios post response for successful login attempt
    axios.post.mockResolvedValueOnce({
      data: {
        success: true,
        user: { id: 1, name: 'John Doe' },
        token: 'mockToken'
      }
    });
    

    // renders the login page in virtual DOM without use of actual browser URL
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<HomePage />} />
        </Routes>
      </MemoryRouter>
    );

    // Simulate user input and form submission
    fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), { target: { value: 'johndoe@gmail.com' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'LOGIN' }));

    // Wait for the mocked axios.post to be called and for the success toast to be shown
    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith(undefined, {
      duration: 5000,
      icon: '🙏',
      style: {
        background: 'green',
        color: 'white'
      }
    });

    expect(mockSetAuth).toHaveBeenCalledWith({
      user: { id: 1, name: 'John Doe' },
      token: 'mockToken'
    });
    expect(window.localStorage.setItem).toHaveBeenCalledWith('auth', 
      JSON.stringify({ 
        success: true, 
        user: { 
          id: 1, 
          name: 'John Doe' 
        }, 
        token: 'mockToken' 
      })
    );
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('Logins the user successfully and directed to location.state when it exists', async () => {
    // Mocking axios post response for successful login attempt
    axios.post.mockResolvedValueOnce({
      data: {
        success: true,
        user: { id: 1, name: 'John Doe' },
        token: 'mockToken'
      }
    });
    
    // Set up location.state for this test
    mockLocation.state = '/dashboard';

    // renders the login page in virtual DOM without use of actual browser URL
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </MemoryRouter>
    );

    // Simulate user input and form submission
    fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), { target: { value: 'johndoe@gmail.com' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'LOGIN' }));

    // Wait for the mocked axios.post to be called and for the success toast to be shown
    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith(undefined, {
      duration: 5000,
      icon: '🙏',
      style: {
        background: 'green',
        color: 'white'
      }
    });

    expect(mockSetAuth).toHaveBeenCalledWith({
      user: { id: 1, name: 'John Doe' },
      token: 'mockToken'
    });
    expect(window.localStorage.setItem).toHaveBeenCalledWith('auth', 
      JSON.stringify({ 
        success: true, 
        user: { 
          id: 1, 
          name: 'John Doe' 
        }, 
        token: 'mockToken' 
      })
    );
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('Throws error message "Invalid credentials" when email does not exists or wrong password', async () => {
    // Mocking axios post response for failed login attempt
    axios.post.mockRejectedValueOnce({
      response: { status: 500, data: { message: 'Invalid credentials' } },
  });

    // renders the login page in virtual DOM without use of actual browser URL
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );

    // Simulate user input and form submission
    fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), { target: { value: 'johndoe@gmail.com' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'LOGIN' }));

    // Wait for the mocked axios.post to be called and for the success toast to be shown
    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith('Invalid credentials');
  });

  it('shows "Error in login" when server returns 500', async () => {
    // mock axios to simulate server 500 with message
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

    fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), { target: { value: 'johndoe@gmail.com' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'LOGIN' }));

    // wait for axios to be called and for toast.error to have been invoked with backend message
    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith('Error in login');
  });

  it('navigates to /forgot-password when "Forgot Password" button is clicked', async () => {
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Routes>
      </MemoryRouter>
    );

    // click the forgot password button
    fireEvent.click(screen.getByRole("button", { name: 'Forgot Password' }));

    // wait for navigation to occur and the target route to render
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/forgot-password');
    });
  });
});