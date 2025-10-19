import { test, expect } from '@playwright/test';
import {goToAdminDashboard, goToAdminProducts, loginAs} from "./utils";

test('Test: Click on a product in Admin', async ({ page }) => {
    const admin = { email: 'Daniel@gmail.com', password: 'Daniel', name: 'Daniel' };
    // login
    await loginAs(page, admin);

    // go to admin dashboard
    await goToAdminDashboard(page, admin.name);
    await goToAdminProducts(page);

    // find the status
    const links = await page.getByTestId('product-link');

    // // for some reason this MAY skip the test even if the DB has products
    // const count = await links.count();
    // if (count === 0) {
    //     console.warn('no products found, skipping navigation test on click...');
    //     test.skip();
    // }

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
