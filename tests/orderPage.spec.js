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

test('Order Page should redirect to home when not logged in', async ({ page }) => {
    await page.goto('/dashboard/users/order');
    await page.waitForTimeout(3000);
    await expectHomeReady(page);
});

test('Order Page shows user\'s orders when logged in', async ({ page }) => {
    await page.goto('/dashboard/users/order');
    await expect(page.getByText(/All Orders/i)).toBeVisible();
    await expect(page.getByText(/Buyer/i)).toBeVisible();
});

test('Clicking on profile navigates to dashboard/user/profile', async ({ page }) => {
    await loginAs(page, test_user);
    await page.goto('/dashboard/users/order');
    const profileButton = page.getByRole('link', { name: /profile/i });
    // await expect(profileButton).toBeVisible();

    await profileButton.click();
    await expect(page).toHaveURL(/\/dashboard\/user\/profile$/);
});