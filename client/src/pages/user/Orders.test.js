import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import toast from 'react-hot-toast';
import Orders from './Orders';

const ORDER_1 = {
  _id: '1',
  status: 'Delivered',
  buyer: { name: 'Daniel' },
  createdAt: new Date("2025-02-04T13:42:16.741Z"),
  payment: { success: true },
  products: [
    { _id: '1', name: 'Laptop', description: 'A powerful laptop', price: 1499.99 },
    { _id: '2', name: 'Smartphone', description: 'A high-end smartphone', price: 999.99 },
    { _id: '3', name: 'Textbook', description: 'An excellent resource', price: 19.99 },
  ],
  payment: { success: true },
}

const ORDER_2 = {
  _id: '2',
  status: 'Not Processed',
  buyer: { name: 'Daniel' },
  createdAt: new Date("2025-02-03T13:42:16.741Z"),
  products: [
    { _id: '3', name: 'Singapore Contract Law', description: 'The definitive text on contract law', price: 49.99 },
  ],
  payment: { success: false },
}

jest.mock('axios');
jest.mock('react-hot-toast');

const mockUseAuth = jest.fn();
jest.mock('../../context/auth', () => ({
  useAuth: () => mockUseAuth()
}));

jest.mock('../../context/cart', () => ({
  useCart: jest.fn(() => ({}))
}));

jest.mock('../../context/search', () => ({
  useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()])
}));

jest.mock('../../hooks/useCategory', () => jest.fn(() => []));

jest.mock('../../utils/string', () => ({
  ...jest.requireActual('../utils/string'),
  getShortDescription: jest.fn((desc) => desc)
}));

jest.mock('../../components/UserMenu', () => () => {
  return <div data-testid='user-menu' />;
});

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const renderOrders = () => {
  return render(
    <MemoryRouter initialEntries={['/dashboard/user/orders']}>
      <Routes>
        <Route path="/dashboard/user/orders" element={<Orders />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('Orders Component', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date('2025-02-04T19:42:16.741Z')})
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  })

  it('renders order details', async () => {
    mockUseAuth.mockReturnValue([{token: 'mock-token'}, jest.fn(), jest.fn()]);
    axios.get.mockResolvedValueOnce({ data: [ORDER_1, ORDER_2] });
    renderOrders();

    expect(await screen.findAllByText('Daniel')).toHaveLength(2);
    expect(await screen.findByText('Delivered')).toBeInTheDocument();
    expect(await screen.findByText('Successful')).toBeInTheDocument();
    expect(await screen.findByText('6 hours ago')).toBeInTheDocument();
    expect(await screen.findByText('3')).toBeInTheDocument();

    expect(await screen.findByText('Not Processed')).toBeInTheDocument();
    expect(await screen.findByText('a day ago')).toBeInTheDocument();
    expect(await screen.findByText('Failed')).toBeInTheDocument();
  });

  it('renders product details for an order', async () => {
    mockUseAuth.mockReturnValue([{token: 'mock-token'}, jest.fn(), jest.fn()]);
    axios.get.mockResolvedValueOnce({ data: [ORDER_2] });
    renderOrders();

    expect(await screen.findByText(/singapore contract law/i)).toBeInTheDocument();
    expect(await screen.findByText(/the definitive text/i)).toBeInTheDocument();
    expect(await screen.findByText(/\$49\.99/i)).toBeInTheDocument();
  });

  it('renders product image', async () => {
    mockUseAuth.mockReturnValue([{token: 'mock-token'}, jest.fn(), jest.fn()]);
    axios.get.mockResolvedValueOnce({ data: [ORDER_2] });
    renderOrders();

    const img = await screen.findByAltText(/singapore contract law/i);
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', expect.stringContaining(ORDER_2.products[0]._id));
  });

  it('navigates to page not found when no token is provided', async () => {
    mockUseAuth.mockReturnValue([{}, jest.fn(), jest.fn()]);
    renderOrders();

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/pagenotfound'));
  });

  it('handles error when fetching orders fails', async () => {
    mockUseAuth.mockReturnValue([{token: 'mock-token'}, jest.fn(), jest.fn()]);
    const err = { message: 'Error while fetching orders' };
    axios.get.mockRejectedValueOnce(err);
    renderOrders();
    
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.any(String)));
  });
});