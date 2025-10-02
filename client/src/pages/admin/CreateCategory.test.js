import React from 'react';
import {render, fireEvent, waitFor, screen, within} from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import toast from 'react-hot-toast';
import CreateCategory from './CreateCategory';
import { act } from 'react-dom/test-utils';

jest.mock('axios');
jest.mock('react-hot-toast');
jest.mock('../../context/auth', () => ({
    useAuth: jest.fn(() => [null, jest.fn()]) // Mock useAuth hook to return null state and a mock function for setAuth
}));

jest.mock('../../context/cart', () => ({
    useCart: jest.fn(() => [null, jest.fn()]) // Mock useCart hook to return null state and a mock function
}));

jest.mock('../../context/search', () => ({
    useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()]) // Mock useSearch hook to return null state and a mock function
}));

jest.mock('../../hooks/useCategory', () => (
    jest.fn(() => []) // Mock useCategory hook to return an empty array
));

// jest.requireActual('antd');


describe('CreateCategory: Create tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders create category form', async () => {
        axios.get.mockResolvedValue({
            data: { success: true, category: [] }
        });
        const { getByText, getByPlaceholderText } = await waitFor(() => render(
          <MemoryRouter initialEntries={['/dashboard/admin/create-category']}>
            <Routes>
              <Route path="/dashboard/admin/create-category" element={<CreateCategory />} />
            </Routes>
          </MemoryRouter>
        ));

        expect(getByText('Manage Category')).toBeInTheDocument();
        expect(getByPlaceholderText('Enter new category')).toBeInTheDocument();
    });

    it('submits new category', async () => {
        axios.get.mockResolvedValue({
            data: { success: true, category: [] }
        });
        axios.post.mockResolvedValue({
            data: { success: true }
        });

        const { getByText, getByPlaceholderText } = await waitFor(() => render(
            <MemoryRouter initialEntries={['/dashboard/admin/create-category']}>
                <Routes>
                    <Route path="/dashboard/admin/create-category" element={<CreateCategory />} />
                </Routes>
            </MemoryRouter>
        ));

        fireEvent.change(getByPlaceholderText('Enter new category'), { target: { value: 'New Category' } });
        fireEvent.click(getByText('Submit'));

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith('/api/v1/category/create-category', { name: 'New Category' });
        });

        expect(toast.success).toHaveBeenCalledWith('New Category is created');
    });

    it('does not allow empty category submission', async () => {
        axios.get.mockResolvedValue({
            data: { success: true, category: [] }
        });
        axios.post.mockResolvedValue({
            data: { success: false, message: 'something went wrong in input form' }
        });
        const { getByText, getByPlaceholderText } = await waitFor(() => render(
            <MemoryRouter initialEntries={['/dashboard/admin/create-category']}>
                <Routes>
                    <Route path="/dashboard/admin/create-category" element={<CreateCategory />} />
                </Routes>
            </MemoryRouter>
        ));

        fireEvent.click(getByText('Submit'));

        await act(() =>waitFor(() => {
            expect(axios.post).toHaveBeenCalled();
            expect(toast.error).toHaveBeenCalledWith('something went wrong in input form');
        }));
    })
});

describe('CreateCategory: Read tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('if there are categories, expect it to exist', async () => {
        axios.get.mockResolvedValue({
            data: { success: true, category: [{_id: 1, name: "Category 1"}] }
        });
        const { getByText, getByPlaceholderText } = await waitFor(() => render(
            <MemoryRouter initialEntries={['/dashboard/admin/create-category']}>
                <Routes>
                    <Route path="/dashboard/admin/create-category" element={<CreateCategory />} />
                </Routes>
            </MemoryRouter>
        ));

        // expected a table entry containing the category
        await waitFor(() => {
            expect(getByText('Category 1')).toBeInTheDocument();
        })
    })
});

describe('CreateCategory: Update tests', () => {
    it('if there are categories, expect an Edit button to exist', async () => {
        axios.get.mockResolvedValue({
            data: { success: true, category: [{_id: 1, name: "Category 1"}] }
        });
        const { getByText, getByPlaceholderText } = await waitFor(() => render(
            <MemoryRouter initialEntries={['/dashboard/admin/create-category']}>
                <Routes>
                    <Route path="/dashboard/admin/create-category" element={<CreateCategory />} />
                </Routes>
            </MemoryRouter>
        ));

        // expected a table entry containing the category
        await waitFor(() => {
            expect(getByText('Edit')).toBeInTheDocument();
        })
    });

    it('clicking Edit button should open the modal', async () => {
        axios.get.mockResolvedValue({
            data: { success: true, category: [{_id: 1, name: "Category 1"}] }
        });
        const { getByText, getByPlaceholderText } = await waitFor(() => render(
            <MemoryRouter initialEntries={['/dashboard/admin/create-category']}>
                <Routes>
                    <Route path="/dashboard/admin/create-category" element={<CreateCategory />} />
                </Routes>
            </MemoryRouter>
        ));

        // expected a table entry containing the category
        await waitFor(() => {
            expect(getByText('Edit')).toBeInTheDocument();
        })

        fireEvent.click(getByText('Edit'));

        // presumes a modal to be opened
        const modal = screen.getByRole('dialog');
        const input = within(modal).getByRole('textbox');

        await waitFor(() => {
            // expect(getByText('Update Category')).toBeInTheDocument();
            expect(input).toHaveValue('Category 1');
        })
    });
});

describe('CreateCategory: Delete tests', () => {});