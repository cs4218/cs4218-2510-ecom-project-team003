import { test, expect } from '@playwright/test';
import { addToCart, expectCartCount, expectToast, getProductCard, goToCart, goToProductDetails, performSearch } from './utils';

test('Search Page Flow', async ({ page }) => {
  // Go to home
  await page.goto('/');
  await expectCartCount(page, 0);
  
  // Not allowed to search without keying in information
  await performSearch(page, '');
  await expect(page).toHaveTitle(/all products/i);

  // Search with no results found
  await performSearch(page, 'Razer Blade 18');
  await expect(page).toHaveTitle(/search results/i);
  await expect(page.getByText(/no products/i)).toBeVisible();

  // Search with a single result found
  await performSearch(page, 'gaming');
  await expect(page).toHaveTitle(/search results/i);
  await expect(page.getByRole('heading', { name: /found 1/i})).toBeVisible();
  await expect(page.getByText(/high-performance gaming/i)).toBeVisible();

  // Search with multiple results found
  await performSearch(page, 'laptop');
  await expect(page).toHaveTitle(/search results/i);
  await expect(page.getByRole('heading', { name: /found 2/i})).toBeVisible();
  await expect(await getProductCard(page, /gaming/i)).toBeVisible();
  await expect(await getProductCard(page, /powerful laptop/i)).toBeVisible();

  // Go to product details
  await goToProductDetails(page, /gaming/i);
  await expect(page).toHaveTitle(/product details/i);
  await expect(page.getByText(/name.*gaming laptop/i)).toBeVisible();

  // Go back to search results
  await page.goBack();
  await expect(page).toHaveTitle(/search results/i);
  await expect(page.getByRole('heading', { name: /found 2/i})).toBeVisible();

  // Add product to cart
  await expect(await getProductCard(page, /powerful/i)).toBeVisible();
  await addToCart(page, /powerful/i);
  await expectToast(page, /added to cart/i);
  await expectCartCount(page, 1);

  // Verify cart contents
  await goToCart(page);
  await expect(page).toHaveTitle(/shopping cart/i);
  await expect(page.getByText(/1 items/i)).toBeVisible();
  await expect(page.getByText(/powerful laptop/i)).toBeVisible();
});

