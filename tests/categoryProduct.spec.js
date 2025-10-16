import { test, expect } from '@playwright/test';
import { addToCartFromCard, addToCartFromDetails, expectCartCount, expectToastCount, getProductCard, goToCart, goToCategory, goToProductDetails, performSearch } from './utils';

test('Category Product Flow', async ({ page }) => {
  // Go to home
  await page.goto('/');
  await expectCartCount(page, 0);

  // Go to category product
  await goToCategory(page, /book/i);
  await expect(page).toHaveTitle(/category products/i);

  // Verify category details
  await expect(page.getByText(/category.+book/i)).toBeVisible();
  await expect(page.getByText(/\d+.+results found/i)).toBeVisible();
  await expect(await getProductCard(page, /textbook/i)).toBeVisible();
  await expect(await getProductCard(page, /law of contract/i)).toBeVisible();

  // Go to product details
  await goToProductDetails(page, /textbook/i);
  await expect(page).toHaveTitle(/product details/i);
  await expect(page.getByText(/name.*textbook/i)).toBeVisible();

  // Go back to category product
  await page.goBack();
  await expect(page).toHaveTitle(/category products/i);
  
  // Add product to cart
  await expect(await getProductCard(page, /law of contract/i)).toBeVisible();
  await addToCartFromCard(page, /law of contract/i);
  await expectToastCount(page, /added to cart/i, 1);
  await expectCartCount(page, 1);

  // Verify cart contents
  await goToCart(page);
  await expect(page).toHaveTitle(/shopping cart/i);
  await expect(page.getByText(/1 items/i)).toBeVisible();
  await expect(page.getByText(/law of contract/i)).toBeVisible();
});

