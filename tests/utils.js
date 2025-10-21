import { expect } from "@playwright/test";

export function getActiveNavLink(page) {
  return page.locator('a.nav-link.active');
}

export async function performSearch(page, searchTerm) {
  if (searchTerm) {
    await page.getByRole('searchbox', { name: /search/i }).fill(searchTerm);
  }
  await page.getByRole('button', { name: /search/i }).click();
}

export async function getProductCard(page, productText) {
  return page.locator('.card', { hasText: productText });
}

export async function goToProductDetails(page, productText) {
  const productCard = await getProductCard(page, productText);
  await productCard.getByRole('button', { name: /details/i }).click();
}

export async function addToCartFromCard(page, productText) {
  const productCard = await getProductCard(page, productText);
  await productCard.getByRole('button', { name: /add to cart/i }).click();
}

export async function addToCartFromDetails(page) {
  const details = page.locator('.product-details-info');
  await details.getByRole('button', { name: /add to cart/i }).click();
}

export async function removeFromCartByName(page, productText) {
    const cartItem = await getCartItem(page, productText);
    await cartItem.getByRole('button', { name: /remove/i }).click();
}

export async function goToCategory(page, categoryText) {
  await page.getByRole('link', { name: /categories/i }).click();
  await page.getByRole('link', { name: categoryText }).click();
}

export async function goToCart(page) {
  await page.getByRole('link', { name: /cart/i }).click();
}

export async function expectToastCount(page, message, count) {
  const toasts = page.getByRole('status').filter({ hasText: message });
  await expect(toasts).toHaveCount(count);
}

export async function expectCartCount(page, count) {
  const cartLocator = page.locator('sup.ant-scroll-number.ant-badge-count');
  await expect(cartLocator).toHaveText(count.toString());
}

export async function goToCategoriesPage(page) {
    await page.getByRole('link', { name: /^categories$/i }).click();
    await page.getByRole('link', { name: /all categories/i }).click();
    await expect(page).toHaveTitle(/all categories/i);
    await expect(page.getByTestId('categories')).toBeVisible();
}

export async function selectCategory(page, categoryText) {
    await page.getByRole('link', { name: categoryText }).click();
    await expect(page).toHaveTitle(/category products/i);
    await expect(page.getByTestId('category-product')).toBeVisible();
}

export async function expectResultCount(page, expectedCount) {
    const region = page.getByTestId('category-product');
    const heading = region.getByRole('heading', { level: 6 });

    if (expectedCount == null) {
        await expect(heading).toHaveText(/\d+\s+results?\s+found/i);
    } else {
        const re = new RegExp(`^${expectedCount}\\s+results?\\s+found$`, 'i');
        await expect(heading).toHaveText(re);
    }
}

export async function goToProductMoreDetails(page, productText) {
    const card = page.locator('.card', { hasText: productText });
    await expect(card).toBeVisible();
    await card.getByRole('button', { name: /more details/i }).click();
    await expect(page).toHaveTitle(/product details/i);
    await expect(page.getByTestId('product-details')).toBeVisible();
}

export function getHomeRegion(page) {
    return page.locator('.home-page');
}

export function getHomeCards(page) {
    return getHomeRegion(page).locator('.card');
}

export async function expectHomeReady(page) {
    const home = getHomeRegion(page);
    await expect(page).toHaveTitle(/all products/i);
    await expect(home).toBeVisible();
    await expect(home.getByRole('heading', { name: /filter by category/i })).toBeVisible();
    await expect(home.getByRole('heading', { name: /filter by price/i })).toBeVisible();
    await expect.poll(async () => await getHomeCards(page).count()).toBeGreaterThan(0);
}

export async function expectCategoriesVisible(page, names) {
    for (const name of names) {
        await expect(page.getByRole('checkbox', { name: new RegExp(`^${name}$`, 'i') })).toBeVisible();
    }
}

export async function expectPriceFiltersVisible(page) {
    for (const label of [
        '$0 to 19.99',
        '$20 to 39.99',
        '$40 to 59.99',
        '$60 to 79.99',
        '$80 to 99.99',
        '$100 or more',
    ]) {
        await expect(page.getByRole('radio', { name: label })).toBeVisible();
    }
}

export async function checkCategoryFilter(page, name, checked = true) {
    const checkbox = page.getByRole('checkbox', { name });
    if (checked) {
        await checkbox.check();
    } else {
        await checkbox.uncheck();
    }
}

export async function selectPriceRange(page, label) {
    await page.getByRole('radio', { name: label }).check();
}

export async function resetHomeFilters(page) {
    const onHome = await getHomeRegion(page).isVisible().catch(() => false);
    if (!onHome) {
        await page.goto('/');
        await expectHomeReady(page);
    }

    const reset = page.getByRole('button', { name: /reset filters/i });
    if ((await reset.count()) === 0 || !(await reset.isVisible())) {
        return;
    }

    await reset.click();
    await expect.poll(async () => await getHomeCards(page).count()).toBeGreaterThan(0);
}

export async function loginAs(page, { email, password, name }) {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /login form/i })).toBeVisible();

    await page.getByPlaceholder(/^enter your email ?$/i).fill(email);
    await page.getByPlaceholder(/^enter your password$/i).fill(password);
    await page.getByRole('button', { name: /^login$/i }).click();

    await expect(page.getByRole('button', { name: new RegExp(`^${name}$`, 'i') })).toBeVisible();
}

export async function openUserMenu(page, name) {
    await page.getByRole('button', { name: new RegExp(`^${name}$`, 'i') }).click();
}

export async function goToAdminDashboard(page, name) {
    await openUserMenu(page, name);
    await page.getByRole('link', { name: /dashboard/i }).click();
    await expect(page.getByRole('heading', { name: /admin panel/i })).toBeVisible();
}

export async function goToAdminCreateCategory(page) {
    await page.getByRole('link', { name: /create category/i }).click();
    await expect(page.getByRole('heading', { name: /manage category/i })).toBeVisible();
    await expect(page.getByTestId('create-category-form')).toBeVisible();
    await expect(page.getByTestId('category-table')).toBeVisible();
}

export async function goToAdminOrders(page) {
    await page.getByRole('link', { name: /orders/i }).click();
    await expect(page.getByRole('heading', { name: /all orders/i })).toBeVisible();
    await expect(page.getByTestId('order-table')).toBeVisible();
}

export async function goToAdminProducts(page) {
    await page.getByRole('link', { name: /products/i }).click();
    await expect(page.getByRole('heading', { name: /all products/i })).toBeVisible();
}

export async function headerOpenCategoriesMenu(page) {
    await page.getByRole('link', { name: /^categories$/i }).click();
}

export async function headerExpectCategoryVisible(page, name) {
    await headerOpenCategoriesMenu(page);
    await expect(page.getByRole('link', { name: new RegExp(`^${name}$`, 'i') })).toBeVisible();
}

export async function headerExpectCategoryNotVisible(page, name) {
    await headerOpenCategoriesMenu(page);
    await expect(page.getByRole('link', { name: new RegExp(`^${name}$`, 'i') })).toHaveCount(0);
}

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const exactReg = (s) => new RegExp(`^${escapeRegExp(s)}$`, 'i');

export async function createCategory(page, name) {
    const table = page.getByTestId('category-table');
    const form = page.getByTestId('create-category-form');
    await form.getByRole('textbox').fill(name);
    await form.getByRole('button', { name: /submit/i }).click();
    await expect(table.getByRole('cell', { name: exactReg(name) })).toBeVisible();
}

export async function updateCategory(page, oldName, newName) {
    const table = page.getByTestId('category-table');
    const row = table.getByRole('row', { name: new RegExp(escapeRegExp(oldName), 'i') }).first();
    await row.getByRole('button', { name: /edit/i }).click();

    const modal = page.getByRole('dialog');
    await modal.getByRole('textbox').fill(newName);
    await modal.getByRole('button', { name: /submit/i }).click();

    await expect(table.getByRole('cell', { name: exactReg(newName) })).toBeVisible();
    await expect(table.getByRole('cell', { name: exactReg(oldName) })).toHaveCount(0);
}

export async function deleteCategory(page, name) {
    const table = page.getByTestId('category-table');
    const row = table.getByRole('row', { name: new RegExp(escapeRegExp(name), 'i') }).first();
    await row.getByRole('button', { name: /delete/i }).click();
    await expect(table.getByRole('cell', { name: exactReg(name) })).toHaveCount(0);
}
