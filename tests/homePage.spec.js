import { test, expect } from '@playwright/test';
import {
    expectHomeReady,
    expectCategoriesVisible,
    expectPriceFiltersVisible,
    getHomeCards,
    checkCategoryFilter,
    selectPriceRange,
    resetHomeFilters,
    goToProductMoreDetails,
    addToCartFromCard,
    addToCartFromDetails,
    goToCart,
    expectCartCount,
} from './utils';

test('Load Category Filters, Price Filters and Products', async ({ page }) => {
    await page.goto('/');
    await expectHomeReady(page);

    await expectCategoriesVisible(page, ['Electronics', 'Book', 'Clothing']);
    await expectPriceFiltersVisible(page);

    const main = page.getByRole('main');
    await expect(main).toContainText(/the law of contract in singapore/i);
    await expect(main).toContainText(/novel/i);
    await expect(main).toContainText(/nus t-?shirt/i);
    await expect(main).toContainText(/smartphone/i);
    await expect(main).toContainText(/laptop/i);
    await expect(main).toContainText(/textbook/i);

    await expect(getHomeCards(page)).toHaveCount(6);
});

test('Filter by Category', async ({ page }) => {
    await page.goto('/');
    await expectHomeReady(page);

    await checkCategoryFilter(page, /clothing/i, true);

    const main = page.getByRole('main');
    await expect(main).toContainText(/nus t-?shirt/i);

    await expect(main).not.toContainText(/the law of contract in singapore/i);
    await expect(main).not.toContainText(/smartphone/i);
    await expect(main).not.toContainText(/laptop/i);
    await expect(main).not.toContainText(/textbook/i);
    await expect(main).not.toContainText(/novel/i);
});

test('Filter by Price', async ({ page }) => {
    await page.goto('/');
    await expectHomeReady(page);

    await selectPriceRange(page, '$0 to 19.99');

    const main = page.getByRole('main');
    await expect(main).toContainText(/novel/i);
    await expect(main).toContainText(/nus t-?shirt/i);

    await expect(main).not.toContainText(/smartphone/i);
    await expect(main).not.toContainText(/laptop/i);
    await expect(main).not.toContainText(/textbook/i);
    await expect(main).not.toContainText(/the law of contract in singapore/i);
});

test('Filter by Category and Price Range', async ({ page }) => {
    await page.goto('/');
    await expectHomeReady(page);

    await checkCategoryFilter(page, /book/i, true);
    await selectPriceRange(page, '$40 to 59.99');

    const main = page.getByRole('main');
    await expect(main).toContainText(/the law of contract in singapore/i);

    await expect(main).not.toContainText(/novel/i);
    await expect(main).not.toContainText(/nus t-?shirt/i);
    await expect(main).not.toContainText(/smartphone/i);
    await expect(main).not.toContainText(/laptop/i);
    await expect(main).not.toContainText(/textbook/i);
});

test('Open Product Details from Card in HomePage', async ({ page }) => {
    await page.goto('/');
    await expectHomeReady(page);

    await goToProductMoreDetails(page, /smartphone/i);

    await expect(page.getByTestId('product-details')).toBeVisible();
    await expect(page.getByText(/product details/i)).toBeVisible();
    await expect(page.getByText(/name\s*:\s*smartphone/i)).toBeVisible();
    await expect(
        page.getByTestId('product-details').getByRole('button', { name: /add to cart/i })
    ).toBeVisible();
});

test('Add to Cart from Card in HomePage', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('cart', '[]'));
    await page.goto('/');
    await expectHomeReady(page);

    await addToCartFromCard(page, /smartphone/i);

    await expect(page.getByText(/item added to cart/i)).toBeVisible();
    await expect(page.getByTestId('badge')).toContainText('1');
});

test('Home Flow: Home → Filter (Category + Price) → Product Details → Add to cart → Cart shows Correct Product', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('cart', '[]'));

    // 1) Go to Home
    await page.goto('/');
    await expectHomeReady(page);

    // 2) Apply both filters: Category: Book, Price: $40–59.99
    await checkCategoryFilter(page, /book/i, true);
    await selectPriceRange(page, '$40 to 59.99');
    await expect(getHomeCards(page)).toHaveCount(1);
    await expect(page.getByRole('main')).toContainText(/the law of contract in singapore/i);

    // 3) Open Product Details from the filtered result
    await goToProductMoreDetails(page, /the law of contract in singapore/i);
    await expect(page.getByText(/product details/i)).toBeVisible();
    await expect(page.getByText(/name\s*:\s*the law of contract in singapore/i)).toBeVisible();

    // 4) Add to Cart from Product Details
    await addToCartFromDetails(page);
    await expect(page.getByText(/item added to cart/i)).toBeVisible();
    await expectCartCount(page, 1);

    // 5) Go to Cart and verify the correct product
    await goToCart(page);
    await expect(page).toHaveTitle(/shopping cart/i);
    await expect(page.getByText(/1 items/i)).toBeVisible();
    await expect(page.getByText(/the law of contract in singapore/i)).toBeVisible();
});

test.afterEach(async ({ page }) => {
    await resetHomeFilters(page);
});