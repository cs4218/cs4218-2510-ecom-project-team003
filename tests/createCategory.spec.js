import { test, expect } from '@playwright/test';
import {
    loginAs,
    goToAdminDashboard,
    goToAdminCreateCategory,
    createCategory,
    updateCategory,
    deleteCategory,
    headerExpectCategoryVisible,
    headerExpectCategoryNotVisible,
} from './utils';

test('Create Category Flow: Admin Creates -> View on Home-> Updates -> Deletes', async ({ page }) => {
    const admin = { email: 'Daniel@gmail.com', password: 'Daniel', name: 'Daniel' };
    const base = 'Test Category';
    const updated = `${base} Updated`;

    // 1) Login as admin
    await loginAs(page, admin);

    // 2) Go to Admin → Create Category
    await goToAdminDashboard(page, admin.name);
    await goToAdminCreateCategory(page);

    // 3) Create a new category
    await createCategory(page, base);

    // 4) Verify new category appears in the Home and Header
    await page.goto('/');
    await headerExpectCategoryVisible(page, base);
    await expect(page.getByRole('main')).toContainText(/test category/i);

    // 5) Back to Admin → Create Category, update category
    await goToAdminDashboard(page, admin.name);
    await goToAdminCreateCategory(page);
    await updateCategory(page, base, updated);

    // 6) Verify updated category appears in the Home and Header
    await page.goto('/');
    await headerExpectCategoryVisible(page, updated);
    await headerExpectCategoryNotVisible(page, base);
    await expect(page.getByRole('main')).toContainText(/test category updated/i);

    // 7) Back to Admin → Create Category, delete category
    await goToAdminDashboard(page, admin.name);
    await goToAdminCreateCategory(page);
    await deleteCategory(page, updated);

    // 8) Verify deleted category reflected in Home and Header
    await page.goto('/');
    await headerExpectCategoryNotVisible(page, updated);
    await expect(page.getByRole('main')).not.toContainText(/test category updated/i);
});