import React from 'react';
import { renderHook, act} from '@testing-library/react';
import { AuthProvider, useAuth } from './auth';
import axios from 'axios';

jest.mock('axios');

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('AuthContext', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
    delete axios.defaults.headers.common['Authorization'];
  });

  describe('Initial State', () => {
    it('initializes with null user and empty token when localStorage is empty', () => {
      // Arrange
      localStorageMock.getItem.mockReturnValue(null);

      // Act
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      // Assert
      const [auth] = result.current;
      expect(auth.user).toBeNull();
      expect(auth.token).toBe('');
    });

    it('loads user and token from localStorage on mount', () => {
      // Arrange
      const mockAuthData = {
        user: { id: '123', name: 'John Doe', email: 'john@example.com' },
        token: 'mockToken123'
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockAuthData));

      // Act
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      // Assert
      const [auth] = result.current;
      expect(localStorageMock.getItem).toHaveBeenCalledWith('auth');
      expect(auth.user).toEqual(mockAuthData.user);
      expect(auth.token).toBe('mockToken123');
    });

    it('handles corrupted localStorage data gracefully', () => {
      // Arrange
      localStorageMock.getItem.mockReturnValue('invalid json');

      // Act 
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      // Assert
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth');
      
      const [auth] = result.current;
      expect(auth.user).toBeNull();
      expect(auth.token).toBe('');
    });
  });

  describe('SetAuth Function', () => {
    it('updates auth state when setAuth is called', () => {
      // Arrange
      localStorageMock.getItem.mockReturnValue(null);
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      const newAuthData = {
        user: { id: '456', name: 'Jane Doe', email: 'jane@example.com' },
        token: 'newToken456'
      };

      // Act
      act(() => {
        const [, setAuth] = result.current;
        setAuth(newAuthData);
      });

      // Assert
      const [auth] = result.current;
      expect(auth.user).toEqual(newAuthData.user);
      expect(auth.token).toBe('newToken456');
    });

    it('updates local storage when setAuth is called', () => {
      // Arrange
      localStorageMock.getItem.mockReturnValue(null);
      localStorageMock.setItem = jest.fn();
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      const newAuthData = {
        user: { id: '456', name: 'Jane Doe', email: 'jane@example.com' },
        token: 'newToken456'
      };

      // Act
      act(() => {
        const [, setAuth] = result.current;
        setAuth(newAuthData);
      });

      // Assert
      expect(JSON.parse(localStorageMock.setItem.mock.calls[0][1])).toEqual({
        user: newAuthData.user,
        token: 'newToken456',
      });
    });

    it('updates axios authorization header when setAuth is called', () => {
      // Arrange
      localStorageMock.getItem.mockReturnValue(null);
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      // Act
      act(() => {
        const [, setAuth] = result.current;
        setAuth({
          user: { id: '456', name: 'Jane' },
          token: 'Bearer newToken123'
        });
      });

      // Assert
      expect(axios.defaults.headers.common['Authorization']).toBe('Bearer newToken123');
    });
  });

  describe('Logout Function', () => {
    it('clears user and token on logout', () => {
      // Arrange
      const mockAuthData = {
        user: { id: '123', name: 'John' },
        token: 'mockToken'
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockAuthData));

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      // Act
      act(() => {
        const [, , logout] = result.current;
        logout();
      });

      // Assert
      const [auth] = result.current;
      expect(auth.user).toBeNull();
      expect(auth.token).toBe('');
    });

    it('removes auth data from localStorage on logout', () => {
      // Arrange
      const mockAuthData = {
        user: { id: '123', name: 'John' },
        token: 'mockToken'
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockAuthData));
      
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      // Act
      act(() => {
        const [, , logout] = result.current;
        logout();
      });

      // Assert
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth');
    });

    it('clears axios authorization header on logout', () => {
      // Arrange
      const mockAuthData = {
        user: { id: '123' },
        token: 'mockToken'
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockAuthData));
      
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      // Act
      act(() => {
        const [, , logout] = result.current;
        logout();
      });

      // Assert
      expect(axios.defaults.headers.common['Authorization']).toBeFalsy();
    });
  });
});