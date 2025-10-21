import { test, expect } from '@playwright/test';
import {goToAdminDashboard, goToAdminOrders, loginAs} from "./utils";

test('Test Update Status flow', async ({ page }) => {
    const admin = { email: 'Daniel@gmail.com', password: 'Daniel', name: 'Daniel' };

    // login
    await loginAs(page, admin);

    // go to admin dashboard
    await goToAdminDashboard(page, admin.name);
    await goToAdminOrders(page);

    // open the status dropdown
    const status_locator = page.getByTestId('status-select').first();
    await status_locator.click();

    // wait for the dropdown to appear globally (AntD renders outside of parent)
    const dropdownItem = page.locator('.ant-select-dropdown .ant-select-item-option-content', { hasText: 'Processing' });
    await dropdownItem.waitFor({ state: 'visible' });
    await dropdownItem.click();

    // verify selection
    await expect(status_locator).toHaveText(/Processing/i);
});
