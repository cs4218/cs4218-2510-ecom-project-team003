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

export async function addToCart(page, productText) {
  const productCard = await getProductCard(page, productText);
  await productCard.getByRole('button', { name: /add to cart/i }).click();
}

export async function goToCart(page) {
  await page.getByRole('link', { name: /cart/i }).click();
}

export async function expectToast(page, message) {
  const toast = page.getByRole('status');
  await expect(toast).toHaveText(message);
}

export async function expectCartCount(page, count) {
  const cartLocator = page.locator('sup.ant-scroll-number.ant-badge-count');
  await expect(cartLocator).toHaveText(count.toString());
}
