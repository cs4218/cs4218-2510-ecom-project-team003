import { test, expect } from '@playwright/test';
import {goToAdminDashboard, goToAdminOrders, loginAs} from "./utils";

test('Test Update Status flow', async ({ page }) => {
    const admin = { email: 'Daniel@gmail.com', password: 'Daniel', name: 'Daniel' };
    // login
    await loginAs(page, admin);

    // go to admin dashboard
    await goToAdminDashboard(page, admin.name);
    await goToAdminOrders(page);

    // find the status
    const status_locator = page.getByTestId('status-select').first();
    await status_locator.click();
    await status_locator.getByText('Processing', {exact: true}).click();

    await expect(status_locator).toHaveText(/Processing/i);
});