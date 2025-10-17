import { test, expect } from '@playwright/test';
import {
    goToCategoriesPage,
    selectCategory,
    expectResultCount,
    goToProductMoreDetails,
    getProductCard,
} from './utils';

test('Categories Flow: Home -> Display Categories → Category Products → Product Details', async ({ page }) => {
    // Go to Home
    await page.goto('/');
    await expect(page).toHaveTitle(/all products/i);

    // Home -> Categories
    await goToCategoriesPage(page);

    await expect(page.getByRole('link', { name: /electronics/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /book/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /clothing/i })).toBeVisible();

    // Categories -> Category Product for Open "Book" Category
    await selectCategory(page, /book/i);

    // Verify category header + result count + product card present
    await expect(page.getByText(/category\s*-\s*book/i)).toBeVisible();
    await expectResultCount(page);
    await expect(page.locator('.card', { hasText: /textbook/i })).toBeVisible();

    // Category Product -> Product Details for "Textbook"
    await goToProductMoreDetails(page, /textbook/i);

    // Verify product details
    await expect(page.getByRole('heading', { name: /product details/i })).toBeVisible();
    await expect(page.getByText(/name\s*:\s*textbook/i)).toBeVisible();
    await expect(page.getByText(/category\s*:\s*book/i)).toBeVisible();
});