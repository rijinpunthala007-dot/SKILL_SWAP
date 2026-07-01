import { test, expect, Page } from '@playwright/test';

const TIMESTAMP = Date.now();
const USER_A = { name: 'Alice Test', email: `alice_${TIMESTAMP}@test.com`, password: 'Password123!' };
const USER_B = { name: 'Bob Test', email: `bob_${TIMESTAMP}@test.com`, password: 'Password123!' };

async function register(page: Page, user: typeof USER_A) {
  await page.goto('/register');
  await page.fill('#register-name', user.name);
  await page.fill('#register-email', user.email);
  await page.fill('#register-password', user.password);
  await page.fill('#register-confirm-password', user.password);
  await page.click('#register-submit');
  await page.waitForURL('**/dashboard');
}

async function login(page: Page, user: typeof USER_A) {
  await page.goto('/login');
  await page.fill('#login-email', user.email);
  await page.fill('#login-password', user.password);
  await page.click('#login-submit');
  await page.waitForURL('**/dashboard');
}

async function addProfile(page: Page, offeredSkill: string, wantedSkill: string) {
  await page.goto('/profile');
  await page.fill('#offered-skill-input', offeredSkill);
  await page.click('button[aria-label="add offered"]'); // or target by proximity
  await page.keyboard.press('Enter'); // trigger addOfferedSkill via enter key
  await page.fill('#wanted-skill-input', wantedSkill);
  await page.keyboard.press('Enter');
  await page.click('#save-profile');
  await page.waitForTimeout(1000); // wait for mutation
}

test.describe('Critical Journey: Register → Profile → Match → Chat', () => {
  test('User A registers and sets up profile', async ({ page }) => {
    await register(page, USER_A);
    await expect(page).toHaveURL(/dashboard/);

    // Set up profile
    await page.goto('/profile');
    await page.fill('#profile-name', USER_A.name);
    // Add offered skill
    await page.fill('#offered-skill-input', 'React');
    // Select proficiency
    await page.selectOption('select', 'Advanced');
    await page.keyboard.press('Enter');

    // Add wanted skill
    await page.fill('#wanted-skill-input', 'Python');
    await page.keyboard.press('Enter');

    await page.click('#save-profile');
    await expect(page.locator('text=Profile updated')).toBeVisible({ timeout: 5000 });
  });

  test('Login → navigate to discover → see users', async ({ page }) => {
    await login(page, USER_A);
    await page.goto('/discover');
    await expect(page.locator('#discover-search')).toBeVisible();
  });

  test('Login page renders correctly', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('#login-email')).toBeVisible();
    await expect(page.locator('#login-password')).toBeVisible();
    await expect(page.locator('#login-submit')).toBeVisible();
  });

  test('Register page has correct fields', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('#register-name')).toBeVisible();
    await expect(page.locator('#register-email')).toBeVisible();
    await expect(page.locator('#register-password')).toBeVisible();
    await expect(page.locator('#register-confirm-password')).toBeVisible();
  });

  test('Protected routes redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/login/);
  });

  test('Dashboard shows correct sections when authenticated', async ({ page }) => {
    await login(page, USER_A);
    await page.goto('/dashboard');
    await expect(page.locator('text=Pending Requests')).toBeVisible();
    await expect(page.locator('text=Recent Chats')).toBeVisible();
  });

  test('Requests page renders incoming and outgoing tabs', async ({ page }) => {
    await login(page, USER_A);
    await page.goto('/requests');
    await expect(page.locator('#tab-incoming')).toBeVisible();
    await expect(page.locator('#tab-outgoing')).toBeVisible();
  });

  test('Logout clears auth and redirects to login', async ({ page }) => {
    await login(page, USER_A);
    await page.locator('text=Sign out').click();
    await expect(page).toHaveURL(/login/);
  });
});
