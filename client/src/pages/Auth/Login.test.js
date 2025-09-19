import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import toast from 'react-hot-toast';
import Login from './Login';
import { useAuth } from '../../context/auth';

// Mocking axios.post
jest.mock('axios');

// Mocking react-hot-toast
jest.mock('react-hot-toast'); 

jest.mock('../../context/auth', () => {
  return {
    useAuth: jest.fn(() => [ // to mock useAuth hook
      { user: null, token: "" },
      jest.fn() // mock function for setAuth
    ]),
  };
});


jest.mock('../../context/cart', () => ({
  useCart: jest.fn(() => [null, jest.fn()]), // Mock for useCart to return a state and setCart
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

  it('Logins the user successfully', async () => {
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
          <Route path="/forgot-password" element={<div>Forgot Password Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    // click the forgot password button
    fireEvent.click(screen.getByRole("button", { name: 'Forgot Password' }));

    // wait for navigation to occur and the target route to render
    await waitFor(() => {
      expect(screen.getByText("Forgot Password Page")).toBeInTheDocument();
    });
  });
});

// jest.mock('../../context/auth', () => ({
//     useAuth: jest.fn(() => [null, jest.fn()]) // Mock useAuth hook to return null state and a mock function for setAuth
//   }));

// jest.mock('../../context/cart', () => ({
//     useCart: jest.fn(() => [null, jest.fn()]) // Mock useCart hook to return null state and a mock function
//   }));
    
// jest.mock('../../context/search', () => ({
//     useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()]) // Mock useSearch hook to return null state and a mock function
//   }));  

// jest.mock('../../hooks/useCategory', () => (
//   jest.fn(() => []) // Mock useCategory hook to return an empty array
// ));

//   Object.defineProperty(window, 'localStorage', {
//     value: {
//       setItem: jest.fn(),
//       getItem: jest.fn(),
//       removeItem: jest.fn(),
//     },
//     writable: true,
//   });

// window.matchMedia = window.matchMedia || function() {
//     return {
//       matches: false,
//       addListener: function() {},
//       removeListener: function() {}
//     };
//   };  

// describe('Login Component', () => {
//     beforeEach(() => {
//         jest.clearAllMocks();
//     });

//     it('renders login form', () => {
//         const { getByText, getByPlaceholderText } = render(
//           <MemoryRouter initialEntries={['/login']}>
//             <Routes>
//               <Route path="/login" element={<Login />} />
//             </Routes>
//           </MemoryRouter>
//         );
    
//         expect(getByText('LOGIN FORM')).toBeInTheDocument();
//         expect(getByPlaceholderText('Enter Your Email')).toBeInTheDocument();
//         expect(getByPlaceholderText('Enter Your Password')).toBeInTheDocument();
//       });
//       it('inputs should be initially empty', () => {
//         const { getByText, getByPlaceholderText } = render(
//           <MemoryRouter initialEntries={['/login']}>
//             <Routes>
//               <Route path="/login" element={<Login />} />
//             </Routes>
//           </MemoryRouter>
//         );
    
//         expect(getByText('LOGIN FORM')).toBeInTheDocument();
//         expect(getByPlaceholderText('Enter Your Email').value).toBe('');
//         expect(getByPlaceholderText('Enter Your Password').value).toBe('');
//       });
    
//       it('should allow typing email and password', () => {
//         const { getByText, getByPlaceholderText } = render(
//           <MemoryRouter initialEntries={['/login']}>
//             <Routes>
//               <Route path="/login" element={<Login />} />
//             </Routes>
//           </MemoryRouter>
//         );
//         fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
//         fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
//         expect(getByPlaceholderText('Enter Your Email').value).toBe('test@example.com');
//         expect(getByPlaceholderText('Enter Your Password').value).toBe('password123');
//       });
      
//     it('should login the user successfully', async () => {
//         axios.post.mockResolvedValueOnce({
//             data: {
//                 success: true,
//                 user: { id: 1, name: 'John Doe', email: 'test@example.com' },
//                 token: 'mockToken'
//             }
//         });

//         const { getByPlaceholderText, getByText } = render(
//             <MemoryRouter initialEntries={['/login']}>
//                 <Routes>
//                     <Route path="/login" element={<Login />} />
//                 </Routes>
//             </MemoryRouter>
//         );

//         fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
//         fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
//         fireEvent.click(getByText('LOGIN'));

//         await waitFor(() => expect(axios.post).toHaveBeenCalled());
//         expect(toast.success).toHaveBeenCalledWith(undefined, {
//             duration: 5000,
//             icon: '🙏',
//             style: {
//                 background: 'green',
//                 color: 'white'
//             }
//         });
//     });

//     it('should display error message on failed login', async () => {
//         axios.post.mockRejectedValueOnce({ message: 'Invalid credentials' });

//         const { getByPlaceholderText, getByText } = render(
//             <MemoryRouter initialEntries={['/login']}>
//                 <Routes>
//                     <Route path="/login" element={<Login />} />
//                 </Routes>
//             </MemoryRouter>
//         );

//         fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
//         fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
//         fireEvent.click(getByText('LOGIN'));

//         await waitFor(() => expect(axios.post).toHaveBeenCalled());
//         expect(toast.error).toHaveBeenCalledWith('Something went wrong');
//     });
// });
