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
