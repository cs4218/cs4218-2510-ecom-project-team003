import { test, expect } from '@playwright/test';
import { addToCartFromCard, addToCartFromDetails, expectCartCount, expectToastCount, getProductCard, goToCart, goToProductDetails, performSearch } from './utils';

test('Product Details Flow', async ({ page }) => {
  // Go to home
  await page.goto('/');
  await expectCartCount(page, 0);

  // Go to product details
  await goToProductDetails(page, /gaming/i);
  await expect(page).toHaveTitle(/product details/i);

  // Verify product details
  await expect(page.getByText(/name.*gaming laptop/i)).toBeVisible();
  await expect(page.getByText(/description.*high-performance/i)).toBeVisible();
  await expect(page.getByText(/price.*1,999\.99/i)).toBeVisible();
  await expect(page.getByText(/category.*electronics/i)).toBeVisible();

  // Verify similar products
  await expect(await getProductCard(page, /powerful laptop/i)).toBeVisible();
  await expect(await getProductCard(page, /smartphone/i)).toBeVisible();

  // Add product to cart
  await addToCartFromDetails(page);
  await expectToastCount(page, /added to cart/i, 1);
  await expectCartCount(page, 1);

  // Verify cart contents
  await goToCart(page);
  await expect(page).toHaveTitle(/shopping cart/i);
  await expect(page.getByText(/1 items/i)).toBeVisible();
  await expect(page.getByText(/high-performance/i)).toBeVisible();

  // Go back to search results
  await page.goBack();
  await expect(page).toHaveTitle(/product details/i);

  // Add similar product to cart
  await addToCartFromCard(page, /smartphone/i);
  await expectToastCount(page, /added to cart/i, 2);
  await expectCartCount(page, 2);

  // Verify cart contents
  await goToCart(page);
  await expect(page).toHaveTitle(/shopping cart/i);
  await expect(page.getByText(/2 items/i)).toBeVisible();
  await expect(page.getByText(/high-performance/i)).toBeVisible();
  await expect(page.getByText(/high-end smartphone/i)).toBeVisible();
});

