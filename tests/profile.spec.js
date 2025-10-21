import { test, expect } from "@playwright/test";
import { loginAs, expectToastCount, expectHomeReady, registerUser } from "./utils";

test("Authenticated user can view and update profile successfully", async ({
  page,
}) => {
  const timestamp = Date.now();

  const user = {
    name: `testUser2_${timestamp}`,
    email: `testuser2_${timestamp}@test.com`,
    password: "password123",
    phone: "98765432",
    address: "456 Sample Avenue",
    DOB: "1999-12-31",
    answer: "basketball",
  };

  // register user
  await registerUser(page, user);

  // Log in
  await loginAs(page, user);

  // Expect navigation to home page
  await expectHomeReady(page);

  // Navigate to profile page via header user menu
  await page
    .getByRole("button", { name: new RegExp(`^${user.name}$`, "i") })
    .click();
  await page.getByRole("link", { name: /dashboard/i }).click();

  // Depending on your UserMenu layout
  await page.getByRole("link", { name: /profile/i }).click();
  await expect(page).toHaveURL(/\/dashboard\/user\/profile$/);

  // validate existing profile data is populated
  await expect(page.getByPlaceholder(/^enter your name$/i)).toHaveValue(
    user.name
  );
  await expect(page.getByPlaceholder(/^enter your email$/i)).toHaveValue(
    user.email
  );
  await expect(page.getByPlaceholder(/^enter your phone$/i)).toHaveValue(
    user.phone
  );
  await expect(page.getByPlaceholder(/^enter your password$/i)).toHaveValue("");
  await expect(page.getByPlaceholder(/^enter your address$/i)).toHaveValue(
    user.address
  );

  // update profile data
  const newName = "testuser2 updated";
  const newPhone = "99998888";
  const newAddress = "Updated Address 123";
  const newPassword = "updatedPass123";

  await page.getByPlaceholder(/^enter your name$/i).fill(newName);
  await page.getByPlaceholder(/^enter your phone$/i).fill(newPhone);
  await page.getByPlaceholder(/^enter your address$/i).fill(newAddress);
  await page.getByPlaceholder(/^enter your password$/i).fill(newPassword);
  await page.getByRole("button", { name: /^update$/i }).click();

  // expect success toast
  await expectToastCount(page, /profile updated successfully/i, 1);

  // validate updated profile data is shown
  await expect(page.getByPlaceholder(/^enter your name$/i)).toHaveValue(
    newName
  );
  await expect(page.getByPlaceholder(/^enter your phone$/i)).toHaveValue(
    newPhone
  );
  await expect(page.getByPlaceholder(/^enter your address$/i)).toHaveValue(
    newAddress
  );

  // Check that user’s updated name appears on navbar
  await expect(
    page.getByRole("button", { name: new RegExp(`^${newName}$`, "i") })
  ).toBeVisible();

  // reload the page to ensure data persistence
  await page.reload();
  await expect(page.getByPlaceholder(/^enter your name$/i)).toHaveValue(
    newName
  );
  await expect(page.getByPlaceholder(/^enter your phone$/i)).toHaveValue(
    newPhone
  );
  await expect(page.getByPlaceholder(/^enter your address$/i)).toHaveValue(
    newAddress
  );

  // Log out
  await page
    .getByRole("button", { name: new RegExp(`^${newName}$`, "i") })
    .click();
  await page.getByRole("link", { name: /^logout$/i }).click();

  // Verify redirection to login page
  await expectToastCount(page, /logout successfully/i, 1);
  await expect(
    page.getByRole("heading", { name: /login form/i })
  ).toBeVisible();

  // Log in with updated password to verify
  await page.getByPlaceholder(/^enter your email ?$/i).fill(user.email);
  await page.getByPlaceholder(/^enter your password$/i).fill(newPassword);
  await page.getByRole("button", { name: /^login$/i }).click();

  // Verify navigation to home page
  await expectHomeReady(page);
  await expect(page).toHaveURL(/\/$/);

  // Check that user’s udeted name appears on navbar
  await expect(
    page.getByRole("button", { name: new RegExp(`^${newName}$`, "i") })
  ).toBeVisible();
});

test("Unauthenticated user visiting /dashboard/user/profile is redirected to login", async ({
  page,
}) => {
  // Directly navigate to profile page
  await page.goto("/dashboard/user/profile");

  // Expect redirection to login page
  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole("heading", { name: /login form/i })
  ).toBeVisible();
});
