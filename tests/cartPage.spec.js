import { test, expect } from '@playwright/test'
import {
    goToCart,
    expectCartCount,
    expectHomeReady,
    addToCartFromCard,
    removeFromCartByName,
    loginAs
} from './utils'; 

test('Cart Page shows guest view when not logged in', async ({ page }) => {
    await page.goto('/cart');
    await expect(page.getByText(/hello guest/i)).toBeVisible();
    await expect(page.getByText(/your cart is empty/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /please login to checkout/i })).toBeVisible();
});

test('Add items to cart and check totals', async ({ page }) => {
    await page.goto('/');
    await expectHomeReady(page);

    // Ensure empty cart initially
    await expectCartCount(page, 0);

    // Add items
    await addToCartFromCard(page, /gaming laptop/i);
    await addToCartFromCard(page, /gaming laptop/i);
    await expectCartCount(page, 2);

    // Go to Cart page
    await goToCart(page);

    // Verify cart contents
    await expect(page.getByText(/gaming laptop/i).first()).toBeVisible();
    await expect(page.getByText(/\$3,999.98/i)).toBeVisible(); // 2 x 1999.99
});

test('Remove item from cart updates totals and count', async ({ page }) => {
    await page.goto('/');
    await expectHomeReady(page);

    // Add two items
    await addToCartFromCard(page, /gaming laptop/i);
    await addToCartFromCard(page, /gaming laptop/i);
    await goToCart(page);
    await expectCartCount(page, 2);

    // Remove one
    await removeFromCartByName(page, /gaming laptop/i);
    await expectCartCount(page, 1);
    await expect(page.getByText(/\$1,999.99/i)).toBeVisible();
});

test('Cart with logged-in user displays greeting', async ({ page }) => {
    const user = {
        name: "CS 4218 Test Account",
        email: "cs4218@test.com",
        password: "cs4218@test.com"
    };
    await loginAs(page, user);
    await goToCart(page);
    await expect(page.getByText(/Hello CS 4218 Test Account/i)).toBeVisible();
});

test('Update Address button navigates to profile page', async ({ page }) => {
    const user = {
        name: "CS 4218 Test Account",
        email: "cs4218@test.com",
        password: "cs4218@test.com"
    };
    await loginAs(page, user);
    await goToCart(page);

    const updateButton = page.getByRole('button', { name: /update address/i });
    await expect(updateButton).toBeVisible();

    await updateButton.click();

    await expect(page).toHaveURL(/\/dashboard\/user\/profile$/);
});