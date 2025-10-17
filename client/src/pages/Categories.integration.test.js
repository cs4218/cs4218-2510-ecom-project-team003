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

beforeAll(async () => {
    await resetDatabase();
})

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

    expect(links).toHaveLength(2);

    const labels = links.map(a => a.textContent.trim());
    const hrefs  = links.map(a => a.getAttribute('href'));

    expect(labels).toEqual(expect.arrayContaining([ELECTRONICS.name, BOOKS.name]));
    expect(hrefs).toEqual(expect.arrayContaining([`/category/${ELECTRONICS.slug}`, `/category/${BOOKS.slug}`]));
});

test('Renders no category buttons when there are no categories', async () => {
    renderCategories();

    const container = await screen.findByTestId('categories');
    const links = await within(container).queryAllByRole('link');

    await waitFor(() => {
        expect(links).toHaveLength(0);
    });
});