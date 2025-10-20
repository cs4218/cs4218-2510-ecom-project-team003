import { test, expect } from "@playwright/test";
import { expectHomeReady, expectToastCount } from "./utils";

test("Existing user logs in successfully -> logs out successfully", async ({
  page,
}) => {
  const user = {
    email: "asdf@gmail.com",
    password: "asdf",
    name: "asdf",
  };
  // Go to login page
  await page.goto("/login");
  await expect(
    page.getByRole("heading", { name: /login form/i })
  ).toBeVisible();

  // Log in with the credentials
  await page.getByPlaceholder(/^enter your email ?$/i).fill(user.email);
  await page.getByPlaceholder(/^enter your password$/i).fill(user.password);
  await page.getByRole("button", { name: /^login$/i }).click();

  // Verify navigation to home page
  await expectHomeReady(page);
  await expect(page).toHaveURL(/\/$/);

  // Check that user’s name appears on navbar
  await expect(
    page.getByRole("button", { name: new RegExp(`^${user.name}$`, "i") })
  ).toBeVisible();

  // Log out
  await page
    .getByRole("button", { name: new RegExp(`^${user.name}$`, "i") })
    .click();
  await page.getByRole("link", { name: /^logout$/i }).click();

  // Verify redirection to login page
  await expectToastCount(page, /logout successfully/i, 1);
  await expect(
    page.getByRole("heading", { name: /login form/i })
  ).toBeVisible();
});

test("New user registers account -> logs in successfully -> logs out successfully", async ({
  page,
}) => {
  const user = {
    name: `testUser`,
    email: `testuser@test.com`,
    password: "password123",
    phone: "91234567",
    address: "123 Test Street",
    DOB: "2000-01-01",
    answer: "football",
  };
  // Go to Register page
  await page.goto("/register");
  await expect(
    page.getByRole("heading", { name: /register form/i })
  ).toBeVisible();

  // Fill in the registration form
  await page.getByPlaceholder(/^enter your name$/i).fill(user.name);
  await page.getByPlaceholder(/^enter your email ?$/i).fill(user.email);
  await page.getByPlaceholder(/^enter your password$/i).fill(user.password);
  await page.getByPlaceholder(/^enter your phone$/i).fill(user.phone);
  await page.getByPlaceholder(/^enter your address$/i).fill(user.address);
  await page.getByPlaceholder(/^enter your dob$/i).fill(user.DOB);
  await page
    .getByPlaceholder(/what is your favorite sports/i)
    .fill(user.answer);

  // Submit registration form
  await page.getByRole("button", { name: /^register$/i }).click();

  // Expect success toast and redirection to /login
  await expectToastCount(page, /user register successfully/i, 1);
  await expect(
    page.getByRole("heading", { name: /login form/i })
  ).toBeVisible();

  // Log in with the new credentials
  await page.getByPlaceholder(/^enter your email ?$/i).fill(user.email);
  await page.getByPlaceholder(/^enter your password$/i).fill(user.password);
  await page.getByRole("button", { name: /^login$/i }).click();

  // Verify navigation to home page
  await expectHomeReady(page);
  await expect(page).toHaveURL(/\/$/);

  // Check that user’s name appears on navbar
  await expect(
    page.getByRole("button", { name: new RegExp(`^${user.name}$`, "i") })
  ).toBeVisible();

  // Log out
  await page
    .getByRole("button", { name: new RegExp(`^${user.name}$`, "i") })
    .click();
  await page.getByRole("link", { name: /^logout$/i }).click();

  // Verify redirection to login page
  await expectToastCount(page, /logout successfully/i, 1);
  await expect(
    page.getByRole("heading", { name: /login form/i })
  ).toBeVisible();
});

test("Existing admin logs in successfully -> logs out successfully", async ({
  page,
}) => {
  const admin = {
    email: "Daniel@gmail.com",
    password: "Daniel",
    name: "Daniel",
  };

  await page.goto("/login");
  await expect(
    page.getByRole("heading", { name: /login form/i })
  ).toBeVisible();

  // Fill out the form
  await page.getByPlaceholder(/^enter your email ?$/i).fill(admin.email);
  await page.getByPlaceholder(/^enter your password$/i).fill(admin.password);

  // Click Login button
  await page.getByRole("button", { name: /^login$/i }).click();

  // Expect navigation to home page
  await expectHomeReady(page);
  await expect(page).toHaveURL(/\/$/);

  // Verify user’s name appears in navbar (top-right)
  await expect(
    page.getByRole("button", { name: new RegExp(`^${admin.name}$`, "i") })
  ).toBeVisible();

  // Log out
  await page
    .getByRole("button", { name: new RegExp(`^${admin.name}$`, "i") })
    .click();
  await page.getByRole("link", { name: /^logout$/i }).click();

  // Verify redirection to login page
  await expectToastCount(page, /logout successfully/i, 1);
  await expect(
    page.getByRole("heading", { name: /login form/i })
  ).toBeVisible();
});

test("Existing user forgots password and resets it successfully -> successfully logs in -> logs out successfully", async ({
  page,
}) => {
  const user = {
    email: "asdf@gmail.com",
    oldPassword: "asdf",
    newPassword: "newpass123",
    name: "asdf",
    answer: "asdf",
  };

  // Go to forgot password page
  await page.goto("/forgot-password");
  await expect(
    page.getByRole("heading", { name: /forgot password/i })
  ).toBeVisible();

  // fill out the form
  await page.getByPlaceholder(/^enter your email ?$/i).fill(user.email);
  await page.getByPlaceholder(/what is your favorite sport/i).fill(user.answer);
  await page
    .getByPlaceholder(/enter new password/i)
    .fill(user.newPassword);

  // submit the form
  await page.getByRole("button", { name: /reset password/i }).click();

  // Expect success toast and redirection to /login
  await expectToastCount(page, /password reset successfully/i, 1);
  await expect(
    page.getByRole("heading", { name: /login form/i })
  ).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);

  // Log in with the new credentials
  await page.getByPlaceholder(/^enter your email ?$/i).fill(user.email);
  await page.getByPlaceholder(/^enter your password$/i).fill(user.newPassword);
  await page.getByRole("button", { name: /^login$/i }).click();

  // Verify navigation to home page
  await expectHomeReady(page);
  await expect(page).toHaveURL(/\/$/);

  // Check that user’s name appears on navbar
  await expect(
    page.getByRole("button", { name: new RegExp(`^${user.name}$`, "i") })
  ).toBeVisible();

  // Log out
  await page
    .getByRole("button", { name: new RegExp(`^${user.name}$`, "i") })
    .click();
  await page.getByRole("link", { name: /^logout$/i }).click();

  // Verify redirection to login page
  await expectToastCount(page, /logout successfully/i, 1);
  await expect(
    page.getByRole("heading", { name: /login form/i })
  ).toBeVisible();
});

test('Invalid login shows error toast', async ({ page }) => {
  // Go to login page
  await page.goto('/login');
  await expect(
    page.getByRole('heading', { name: /login form/i })
  ).toBeVisible();

  // Fill in invalid credentials
  await page.getByPlaceholder(/^enter your email/i).fill('wrong@test.com');
  await page.getByPlaceholder(/^enter your password/i).fill('badpass');
  await page.getByRole('button', { name: /^login$/i }).click();

  // Expect error toast
  await expectToastCount(page, /invalid email or password/i, 1);
});

