import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import ForgotPassword from './ForgotPassword';

// Mock dependencies
jest.mock('axios');

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

window.matchMedia = window.matchMedia || function() {
  return {
    matches: false,
    addListener: function() {},
    removeListener: function() {}
  };
};

/**
 * Renders component with all necessary providers
 */
const renderWithProviders = () => {
      render(
        <MemoryRouter initialEntries={['/forgot-password']}>
          <Routes>
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Routes>
        </MemoryRouter>
      );
};

/**
 * Gets all form input elements
 */
const getFormElements = () => ({
  emailInput: screen.getByPlaceholderText(/enter Your email/i),
  answerInput: screen.getByPlaceholderText(/what is your favorite sport?/i),
  passwordInput: screen.getByPlaceholderText(/enter new password/i),
  submitButton: screen.getByRole('button', { name: /reset password/i }),
});

/**
 * Fills the forgot password form with provided data
 */
const fillForm = (email = 'john@example.com', answer = 'cricket', password = 'newpass123') => {
  const { emailInput, answerInput, passwordInput } = getFormElements();
  
  fireEvent.change(emailInput, { target: { value: email } });
  fireEvent.change(answerInput, { target: { value: answer } });
  fireEvent.change(passwordInput, { target: { value: password } });
};

/**
 * Fills and submits the form
 */
const fillAndSubmitForm = (email, answer, password) => {
  fillForm(email, answer, password);
  const { submitButton } = getFormElements();
  fireEvent.click(submitButton);
};


describe('ForgotPassword Component - Unit Tests', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });


  describe('Rendering', () => {
    
    it('should render all form elements correctly', () => {
      // Arrange & Act
      renderWithProviders();
      
      // Assert
      expect(screen.getByText('FORGOT PASSWORD')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter Your Email')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('What is your favorite sport?')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter New Password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    
    it('should update all form fields when user types', () => {
      // Arrange
      renderWithProviders();
      const { emailInput, answerInput, passwordInput } = getFormElements();
      
      // Act
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(answerInput, { target: { value: 'football' } });
      fireEvent.change(passwordInput, { target: { value: 'newpassword123' } });
      
      // Assert
      expect(emailInput).toHaveValue('test@example.com');
      expect(answerInput).toHaveValue('football');
      expect(passwordInput).toHaveValue('newpassword123');
    });
  });

  describe('Form Submission', () => {
    
    it('should call API with correct data when form is submitted', async () => {
      // Arrange
      axios.post.mockResolvedValueOnce({
        data: { success: true, message: 'Password Reset Successfully' }
      });
      renderWithProviders();
      
      // Act
      fillAndSubmitForm('john@example.com', 'cricket', 'newpassword123');
      
      // Assert
      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith('/api/v1/auth/forgot-password', {
          email: 'john@example.com',
          answer: 'cricket',
          newPassword: 'newpassword123'
        });
      });
    });

    it('should not submit form when required fields are empty', () => {
      // Arrange
      renderWithProviders();
      const { submitButton } = getFormElements();
      
      // Act
      fireEvent.click(submitButton);
      
      // Assert - HTML5 validation prevents submission
      expect(axios.post).not.toHaveBeenCalled();
    });
  });

  describe('Success Scenarios', () => {
    
    it('should show success message and navigate to login on successful reset', async () => {
      // Arrange
      axios.post.mockResolvedValueOnce({
        data: { success: true, message: 'Password Reset Successfully' }
      });
      renderWithProviders();
      
      // Act
      fillAndSubmitForm();
      
      // Assert
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Password Reset Successfully');
      });

      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  describe('Error Scenarios', () => {
    
    it('should show error message when credentials are invalid', async () => {
      // Arrange
      axios.post.mockResolvedValueOnce({
        data: { success: false, message: 'Wrong Email Or Answer' }
      });
      renderWithProviders();
      
      // Act
      fillAndSubmitForm('john@example.com', 'wrong answer', 'newpass123');
      
      // Assert
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Wrong Email Or Answer');
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should show error message on network error', async () => {
      // Arrange
      axios.post.mockRejectedValueOnce({
        response: { data: { message: 'Network error. Please try again.' } }
      });
      renderWithProviders();
      
      // Act
      fillAndSubmitForm();
      
      // Assert
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Network error. Please try again.');
      });
    });
  });
});