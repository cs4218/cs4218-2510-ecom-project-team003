import { test, expect } from '@playwright/test';
import {goToAdminDashboard, goToAdminProducts, goToFirstProduct, loginAs} from "./utils";

test('Test: Click on a product in Admin', async ({ page }) => {
    const admin = { email: 'Daniel@gmail.com', password: 'Daniel', name: 'Daniel' };
    // login
    await loginAs(page, admin);

    // go to admin dashboard
    await goToAdminDashboard(page, admin.name);
    await goToAdminProducts(page);

    // find the status
    const links = await page.getByTestId('product-link');

    const firstLink = links.first();
    const productName = await firstLink
        .getByTestId('product-name')
        .innerText();

    const productDescription = await firstLink
        .getByTestId('product-description')
        .innerText();

    await firstLink.click();
    await expect(page).toHaveURL(/\/product\//);
    // one should see the mention of the product description somewhere
    await expect(page.getByText(productName)).toBeVisible();
    await expect(page.getByText(productDescription)).toBeVisible();
});

test('Test: Update a product -> User sees indicator of failure or success', async ({ page }) => {
    const admin = { email: 'Daniel@gmail.com', password: 'Daniel', name: 'Daniel' };
    // login
    await loginAs(page, admin);

    // go to admin dashboard
    await goToAdminDashboard(page, admin.name);
    await goToAdminProducts(page);
    await goToFirstProduct(page);

    const newName = 'Newest Gaming Laptop'
    const newDesc = 'Newest high-performance gaming laptop with advanced graphics 2'

    const nameLocator = await page.getByRole('textbox', { name: 'write a name' });
    await nameLocator.fill(newName);
    const descLocator = await page.getByRole('textbox', { name: 'write a description' });
    await descLocator.fill(newDesc);

    await page.getByTestId('update-button').click();
    await expect(page.locator('[role="status"]')).toBeVisible(); // tests that a toast is sent

})
