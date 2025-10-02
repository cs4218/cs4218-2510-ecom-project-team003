import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom';
import toast from 'react-hot-toast';
import Register from './Register';

// Mock dependencies
jest.mock('axios');
jest.mock('react-hot-toast');

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock context providers
jest.mock('../../context/auth', () => ({
  useAuth: jest.fn(() => [null, jest.fn()])
}));

jest.mock('../../context/cart', () => ({
  useCart: jest.fn(() => ({cart: []})),
}));

jest.mock('../../context/search', () => ({
  useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()])
}));

jest.mock('../../hooks/useCategory', () => 
  jest.fn(() => [])
);

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
  },
  writable: true,
});

// Mock matchMedia
window.matchMedia = window.matchMedia || function() {
  return {
    matches: false,
    addListener: function() {},
    removeListener: function() {}
  };
};

// Helper function to render component
const renderRegister = () => {
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <Routes>
        <Route path="/register" element={<Register />} />
      </Routes>
    </MemoryRouter>
  );
};

// Helper function to fill form with valid data
const fillForm = (overrides = {}) => {
  const defaultData = {
    name: 'John Doe',
    email: 'test@example.com',
    password: 'password123',
    phone: '1234567890',
    address: '123 Test Street',
    dob: '2000-01-01',
    answer: 'Football'
  };

  const data = { ...defaultData, ...overrides };

  fireEvent.change(screen.getByPlaceholderText('Enter Your Name'), { 
    target: { value: data.name } 
  });
  fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), { 
    target: { value: data.email } 
  });
  fireEvent.change(screen.getByPlaceholderText('Enter Your Password'), { 
    target: { value: data.password } 
  });
  fireEvent.change(screen.getByPlaceholderText('Enter Your Phone'), { 
    target: { value: data.phone } 
  });
  fireEvent.change(screen.getByPlaceholderText('Enter Your Address'), { 
    target: { value: data.address } 
  });
  fireEvent.change(screen.getByPlaceholderText('Enter Your DOB'), { 
    target: { value: data.dob } 
  });
  fireEvent.change(screen.getByPlaceholderText('What is Your Favorite sports'), { 
    target: { value: data.answer } 
  });

  return data;
};

describe('Register Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('Renders Register Form', () => {
      renderRegister();

      // Check if form title is rendered
      expect(screen.getByText('REGISTER FORM')).toBeInTheDocument();

      // Check if all input fields are rendered
      expect(screen.getByPlaceholderText('Enter Your Name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter Your Email')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter Your Password')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter Your Phone')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter Your Address')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter Your DOB')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('What is Your Favorite sports')).toBeInTheDocument();

      // Check if register button is rendered
      expect(screen.getByRole('button', { name: 'REGISTER' })).toBeInTheDocument();
    });

    it('Inputs should initially be empty', () => {
      renderRegister();
      
      expect(screen.getByText('REGISTER FORM')).toBeInTheDocument();

      // Check if all input fields are empty
      expect(screen.getByPlaceholderText('Enter Your Name').value).toBe('');
      expect(screen.getByPlaceholderText('Enter Your Email').value).toBe('');
      expect(screen.getByPlaceholderText('Enter Your Password').value).toBe('');
      expect(screen.getByPlaceholderText('Enter Your Phone').value).toBe('');
      expect(screen.getByPlaceholderText('Enter Your Address').value).toBe('');
      expect(screen.getByPlaceholderText('Enter Your DOB').value).toBe('');
      expect(screen.getByPlaceholderText('What is Your Favorite sports').value).toBe('');

      // Check if register button is rendered
      expect(screen.getByRole('button', { name: 'REGISTER' })).toBeInTheDocument();
    
    });

    it('should have correct input types for form fields', () => {
      renderRegister();

      expect(screen.getByPlaceholderText('Enter Your Name')).toHaveAttribute('type', 'text');
      expect(screen.getByPlaceholderText('Enter Your Email')).toHaveAttribute('type', 'email');
      expect(screen.getByPlaceholderText('Enter Your Password')).toHaveAttribute('type', 'password');
      expect(screen.getByPlaceholderText('Enter Your Phone')).toHaveAttribute('type', 'text');
      expect(screen.getByPlaceholderText('Enter Your Address')).toHaveAttribute('type', 'text');
      expect(screen.getByPlaceholderText('Enter Your DOB')).toHaveAttribute('type', 'Date');
      expect(screen.getByPlaceholderText('What is Your Favorite sports')).toHaveAttribute('type', 'text');
    });

    it('should have required attribute on all input fields', () => {
      renderRegister();

      const inputs = [
        'Enter Your Name',
        'Enter Your Email',
        'Enter Your Password',
        'Enter Your Phone',
        'Enter Your Address',
        'Enter Your DOB',
        'What is Your Favorite sports'
      ];

      inputs.forEach(placeholder => {
        expect(screen.getByPlaceholderText(placeholder)).toHaveAttribute('required');
      });
    });

    it('should have autofocus on name input', () => {
      renderRegister();
      expect(screen.getByPlaceholderText('Enter Your Name')).toHaveFocus();
    });
  });

  describe('Form Input Handling', () => {
    it('should update input values when user types', () => {
      renderRegister();

      fireEvent.change(screen.getByPlaceholderText('Enter Your Name'), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
      fireEvent.change(screen.getByPlaceholderText('Enter Your Phone'), { target: { value: '1234567890' } });
      fireEvent.change(screen.getByPlaceholderText('Enter Your Address'), { target: { value: '123 Test Street' } });
      fireEvent.change(screen.getByPlaceholderText('Enter Your DOB'), { target: { value: '2000-01-01' } });
      fireEvent.change(screen.getByPlaceholderText('What is Your Favorite sports'), { target: { value: 'Football' } });

      expect(screen.getByPlaceholderText('Enter Your Name').value).toBe('John Doe');
      expect(screen.getByPlaceholderText('Enter Your Email').value).toBe('test@example.com');
      expect(screen.getByPlaceholderText('Enter Your Password').value).toBe('password123');
      expect(screen.getByPlaceholderText('Enter Your Phone').value).toBe('1234567890');
      expect(screen.getByPlaceholderText('Enter Your Address').value).toBe('123 Test Street');
      expect(screen.getByPlaceholderText('Enter Your DOB').value).toBe('2000-01-01');
      expect(screen.getByPlaceholderText('What is Your Favorite sports').value).toBe('Football');
    });

    it('should handle empty input values', () => {
      renderRegister();

      const nameInput = screen.getByPlaceholderText('Enter Your Name');
      
      fireEvent.change(nameInput, { target: { value: 'Test' } });
      expect(nameInput.value).toBe('Test');

      fireEvent.change(nameInput, { target: { value: '' } });
      expect(nameInput.value).toBe('');
    });

    it('should handle special characters in inputs', () => {
      renderRegister();

      const addressInput = screen.getByPlaceholderText('Enter Your Address');
      const testAddress = '123 Main St. Apt #4B, City @#$%';

      fireEvent.change(addressInput, { target: { value: testAddress } });
      expect(addressInput.value).toBe(testAddress);
    });


  });

  describe('Form Submission - Success Cases', () => {
    it('should register user successfully with valid data', async () => {
      axios.post.mockResolvedValueOnce({ 
        data: { success: true, message: 'User registered successfully' } 
      });

      renderRegister();
      const formData = fillForm();
      
      fireEvent.click(screen.getByRole('button', { name: 'REGISTER' }));

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith('/api/v1/auth/register', {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          address: formData.address,
          DOB: formData.dob,
          answer: formData.answer,
        });
      });

      expect(toast.success).toHaveBeenCalledWith('Register Successfully, please login');
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    it('should handle registration with minimum valid data', async () => {
      axios.post.mockResolvedValueOnce({ 
        data: { success: true } 
      });

      renderRegister();
      fillForm({
        name: 'A',
        email: 'a@b.c',
        password: '123',
        phone: '1',
        address: '1',
        answer: 'A'
      });
      
      fireEvent.click(screen.getByRole('button', { name: 'REGISTER' }));

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalled();
      });

      expect(toast.success).toHaveBeenCalledWith('Register Successfully, please login');
    });
  });

  describe('Form Submission - Error Cases', () => {
    it ('should display error message "Name is required" when name is empty and frontend fails to validate', async () => {
      axios.post.mockResolvedValueOnce({ 
        data: { success: false, message: "Name is required" } 
      });

      renderRegister();

      screen.getByPlaceholderText("Enter Your Name").removeAttribute('required');

      fireEvent.change(screen.getByPlaceholderText('Enter Your Name'), { target: { value: '' } });
      fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
      fireEvent.change(screen.getByPlaceholderText('Enter Your Phone'), { target: { value: '1234567890' } });
      fireEvent.change(screen.getByPlaceholderText('Enter Your Address'), { target: { value: '123 Test Street' } });
      fireEvent.change(screen.getByPlaceholderText('Enter Your DOB'), { target: { value: '2000-01-01' } });
      fireEvent.change(screen.getByPlaceholderText('What is Your Favorite sports'), { target: { value: 'Football' } });
      fireEvent.click(screen.getByRole('button', { name: 'REGISTER' }));

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalled();
      });
      expect(toast.error).toHaveBeenCalledWith("Name is required");
    });

    it('should display error message "Email is requred" when email is empty and frontend fails to validate', async () => {
      axios.post.mockResolvedValueOnce({
        data: { success: false, message: "Email is required" }
      });
      
      renderRegister();

      screen.getByPlaceholderText('Enter Your Email').removeAttribute('required');


      fireEvent.change(screen.getByPlaceholderText('Enter Your Name'), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), { target: { value: '' } });
      fireEvent.change(screen.getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
      fireEvent.change(screen.getByPlaceholderText('Enter Your Phone'), { target: { value: '1234567890' } });
      fireEvent.change(screen.getByPlaceholderText('Enter Your Address'), { target: { value: '123 Test Street' } });
      fireEvent.change(screen.getByPlaceholderText('Enter Your DOB'), { target: { value: '2000-01-01' } });
      fireEvent.change(screen.getByPlaceholderText('What is Your Favorite sports'), { target: { value: 'Football' } });
      fireEvent.click(screen.getByRole('button', { name: 'REGISTER' }));

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalled();
      });
      expect(toast.error).toHaveBeenCalledWith("Email is required");
    });

    it('should display error message "Password is required" when password is empty and frontend fails to validate', async () => {
      axios.post.mockResolvedValueOnce({
        data: { success: false, message: "Password is required" }
      });

      renderRegister();

      screen.getByPlaceholderText('Enter Your Password').removeAttribute('required');

      fireEvent.change(screen.getByPlaceholderText('Enter Your Name'), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByPlaceholderText('Enter Your Password'), { target: { value: '' } });
      fireEvent.change(screen.getByPlaceholderText('Enter Your Phone'), { target: { value: '1234567890' } });
      fireEvent.change(screen.getByPlaceholderText('Enter Your Address'), { target: { value: '123 Test Street' } });
      fireEvent.change(screen.getByPlaceholderText('Enter Your DOB'), { target: { value: '2000-01-01' } });
      fireEvent.change(screen.getByPlaceholderText('What is Your Favorite sports'), { target: { value: 'Football' } });
      fireEvent.click(screen.getByRole('button', { name: 'REGISTER' }));

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalled();
      });
      expect(toast.error).toHaveBeenCalledWith("Password is required");
    });

    it('should display error message "Phone is requred" when phone is empty and frontend fails to validate', async () => {
      axios.post.mockResolvedValueOnce({
        data: { success: false, message: "Phone number is required" }
      });

      renderRegister();
      
      screen.getByPlaceholderText('Enter Your Phone').removeAttribute('required');

      fireEvent.change(screen.getByPlaceholderText('Enter Your Name'), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
      fireEvent.change(screen.getByPlaceholderText('Enter Your Phone'), { target: { value: '' } });
      fireEvent.change(screen.getByPlaceholderText('Enter Your Address'), { target: { value: '123 Test Street' } });
      fireEvent.change(screen.getByPlaceholderText('Enter Your DOB'), { target: { value: '2000-01-01' } });
      fireEvent.change(screen.getByPlaceholderText('What is Your Favorite sports'), { target: { value: 'Football' } });
      fireEvent.click(screen.getByRole('button', { name: 'REGISTER' }));

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalled();
      });
      expect(toast.error).toHaveBeenCalledWith("Phone number is required");
    });

    it('should display error message "Address is requrred" when Address is empty and frontend fails to validate', async () => {
      axios.post.mockResolvedValueOnce({
        data: { success: false, message: "Address is required" }
      });

      renderRegister();

      screen.getByPlaceholderText('Enter Your Address').removeAttribute('required');

      fireEvent.change(screen.getByPlaceholderText('Enter Your Name'), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
      fireEvent.change(screen.getByPlaceholderText('Enter Your Phone'), { target: { value: '1234567890' } });
      fireEvent.change(screen.getByPlaceholderText('Enter Your Address'), { target: { value: '' } });
      fireEvent.change(screen.getByPlaceholderText('Enter Your DOB'), { target: { value: '2000-01-01' } });
      fireEvent.change(screen.getByPlaceholderText('What is Your Favorite sports'), { target: { value: 'Football' } });
      fireEvent.click(screen.getByRole('button', { name: 'REGISTER' }));

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalled();
      });
      expect(toast.error).toHaveBeenCalledWith("Address is required");
    });

    it('should display error message "DOB is requred" when DOB is empty and frontend fails to validate', async () => {
      axios.post.mockResolvedValueOnce({
        data: { success: false, message: "DOB is required" }
      });

      renderRegister();

      screen.getByPlaceholderText('Enter Your DOB').removeAttribute('required');
;
      fireEvent.change(screen.getByPlaceholderText('Enter Your Name'), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
      fireEvent.change(screen.getByPlaceholderText('Enter Your Phone'), { target: { value: '1234567890' } });
      fireEvent.change(screen.getByPlaceholderText('Enter Your Address'), { target: { value: '123 Test Street' } });
      fireEvent.change(screen.getByPlaceholderText('Enter Your DOB'), { target: { value: '' } });
      fireEvent.change(screen.getByPlaceholderText('What is Your Favorite sports'), { target: { value: 'Football' } });
      fireEvent.click(screen.getByRole('button', { name: 'REGISTER' }));

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalled();
      });
      expect(toast.error).toHaveBeenCalledWith("DOB is required");
    });

    it('should display error message "Answer is requred" when favourite sports is empty and frontend fails to validate', async () => {
      axios.post.mockResolvedValueOnce({
        data: { success: false, message: "Answer is required" }
      });

      renderRegister();

      screen.getByPlaceholderText('What is Your Favorite sports').removeAttribute('required');

      fireEvent.change(screen.getByPlaceholderText('Enter Your Name'), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
      fireEvent.change(screen.getByPlaceholderText('Enter Your Phone'), { target: { value: '1234567890' } });
      fireEvent.change(screen.getByPlaceholderText('Enter Your Address'), { target: { value: '123 Test Street' } });
      fireEvent.change(screen.getByPlaceholderText('Enter Your DOB'), { target: { value: '2000-01-01' } });
      fireEvent.change(screen.getByPlaceholderText('What is Your Favorite sports'), { target: { value: '' } });
      fireEvent.click(screen.getByRole('button', { name: 'REGISTER' }));

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalled();
      });
      expect(toast.error).toHaveBeenCalledWith("Answer is required");
    });
      


    it('should display error message when registration fails with server error response', async () => {
      const errorMessage = 'Email already exists';
      axios.post.mockResolvedValueOnce({ 
        data: { success: false, message: errorMessage } 
      });

      renderRegister();
      fillForm();
      
      fireEvent.click(screen.getByRole('button', { name: 'REGISTER' }));

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalled();
      });

      expect(toast.error).toHaveBeenCalledWith(errorMessage);
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});