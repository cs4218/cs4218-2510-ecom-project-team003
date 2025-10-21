import { test, expect } from '@playwright/test'
import {
    goToCart,
    expectCartCount,
    expectHomeReady,
    addToCartFromCard,
    removeFromCartByName,
    loginAs
} from './utils'; 

const test_user = {
        name: "CS 4218 Test Account",
        email: "cs4218@test.com",
        password: "cs4218@test.com"
};

const test_card_details = {
    card_number: "5425233430109903",
    exp_date: "04/26",
    cvv: "677"
}

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
    await addToCartFromCard(page, /novel/i);
    await addToCartFromCard(page, /novel/i);
    await expectCartCount(page, 2);

    // Go to Cart page
    await goToCart(page);

    // Verify cart contents
    await expect(page.getByText(/novel/i).first()).toBeVisible();
    await expect(page.getByText(/\$29.98/i)).toBeVisible();
});

test('Remove item from cart updates totals and count', async ({ page }) => {
    await page.goto('/');
    await expectHomeReady(page);

    // Add two items
    await addToCartFromCard(page, /novel/i);
    await addToCartFromCard(page, /novel/i);
    await goToCart(page);
    await expectCartCount(page, 2);

    // Remove one
    await removeFromCartByName(page, /novel/i);
    await expectCartCount(page, 1);
    await expect(page.getByText(/\$14.99/i)).toBeVisible();
});

test('Cart with logged-in user displays greeting', async ({ page }) => {
    await loginAs(page, test_user);
    await goToCart(page);
    await expect(page.getByText(/Hello CS 4218 Test Account/i)).toBeVisible();
});

test('Update Address button navigates to profile page', async ({ page }) => {
    
    await loginAs(page, test_user);
    await goToCart(page);

    const updateButton = page.getByRole('button', { name: /update address/i });
    await expect(updateButton).toBeVisible();

    await updateButton.click();

    await expect(page).toHaveURL(/\/dashboard\/user\/profile$/);
});

test('Payment button clears cart on click and navigates to orders', async ({page}) => {
    await page.addInitScript(() => {
        window.__CI_TEST__ = true;
    });
    await page.route('/api/v1/payment/braintree/token', route => {
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ clientToken: 'fake-token' }),
        });
    });
    await page.goto('/');
    await addToCartFromCard(page, /novel/i);
    await addToCartFromCard(page, /novel/i);

    await loginAs(page, test_user);
    await goToCart(page);

    await expect(page.getByText(/novel/i).first()).toBeVisible();
    // await expect(page.getByText(/choose a way to pay/i)).toBeVisible();
    const dropin = page.getByTestId('dropin-mock'); 
    await expect(dropin).toBeVisible();
    await dropin.click();

    const payButton = page.getByRole('button', { name: /make payment/i });
    await expect(payButton).toBeVisible();
    await expect(payButton).toBeEnabled();

    await payButton.click();

    await expect(page.getByText(/payment completed successfully/i)).toBeVisible();
    const cartCount = page.locator('[data-testid="badge"]');
    await expectCartCount(page, 0); 
    await expect(page.getByText(/item added to cart/i)).not.toBeVisible(); 

    await expect(page).toHaveURL(/\/dashboard\/user\/orders$/);
    await expect(page.getByText(/a few seconds ago/i)).toBeVisible();

});