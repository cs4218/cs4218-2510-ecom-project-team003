import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import Categories from './Categories';
import { AuthProvider } from '../context/auth';
import { SearchProvider } from '../context/search';
import { CartProvider } from '../context/cart';
import { Toaster } from 'react-hot-toast';
import { resetDatabase, seedCategories } from '../../tests/helpers/seedApi';
import { BOOKS, ELECTRONICS } from '../../tests/helpers/testData';

console.log = jest.fn();

const renderCategories = (initial = '/categories') => {
    return render(
        <AuthProvider>
            <SearchProvider>
                <CartProvider>
                    <MemoryRouter initialEntries={[initial]}>
                        <Toaster />
                        <Routes>
                            <Route path="/categories" element={<Categories />} />
                        </Routes>
                    </MemoryRouter>
                </CartProvider>
            </SearchProvider>
        </AuthProvider>
    );
};

beforeEach(() => {
    jest.clearAllMocks();
});

afterEach(async () => {
    localStorage.clear();
    await resetDatabase();
});

test('Renders category buttons with correct labels and links', async () => {
    await seedCategories([ELECTRONICS, BOOKS]);

    renderCategories();

    const container = await screen.findByTestId('categories');
    const links = await within(container).findAllByRole('link');

    const labels = links.map(a => a.textContent).sort();
    const hrefs = links.map(a => a.getAttribute('href').toLowerCase()).sort();


    await waitFor(() => {
        expect(links).toHaveLength(2);
    });
    expect(labels).toEqual([BOOKS.name, ELECTRONICS.name].sort());
    expect(hrefs).toEqual(
        [`/category/${BOOKS.slug.toLowerCase()}`, `/category/${ELECTRONICS.slug.toLowerCase()}`].sort()
    );
});

test('Renders no category buttons when there are no categories', async () => {
    renderCategories();

    const container = await screen.findByTestId('categories');
    const links = await within(container).queryAllByRole('link');

    await waitFor(() => {
        expect(links).toHaveLength(0);
    });
});