const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('loads the practice area with accessible semantics', async ({ page }) => {
  await expect(page.locator('#typing-area')).toHaveAttribute('role', 'group');
  await expect(page.locator('#typing-input')).toHaveAttribute('aria-describedby', 'typing-help');
  await expect(page.locator('#typing-text')).not.toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('#time-label')).toHaveText('00:30');
});

test('switches practice modes and durations', async ({ page }) => {
  await page.locator('[data-mode="code"]').click();
  await expect(page.locator('#mode-label')).toHaveText('CODE PRACTICE');
  await page.locator('[data-duration="60"]').click();
  await expect(page.locator('#time-label')).toHaveText('01:00');
  await expect(page.locator('[data-duration="60"]')).toHaveAttribute('aria-pressed', 'true');
});

test('starts the timer when typing begins', async ({ page }) => {
  const input = page.locator('#typing-input');
  await input.fill('a');
  await expect(page.locator('#test-state')).toHaveText('SESSION IN PROGRESS');
  await expect(page.locator('#progress-fill')).not.toHaveCSS('width', '0px');
});

test('early prompt completion does not pretend the timer expired', async ({ page }) => {
  const prompt = await page.locator('#typing-text').innerText();
  await page.locator('#typing-input').fill(prompt);
  await expect(page.locator('#finished-overlay')).toBeVisible();
  await expect(page.locator('#time-label')).not.toHaveText('00:00');
  await expect(page.locator('#progress-rail')).not.toHaveAttribute('aria-valuenow', '100');
});

test('Escape starts a fresh session', async ({ page }) => {
  await page.locator('#typing-input').fill('abc');
  await page.locator('#typing-input').press('Escape');
  await expect(page.locator('#typing-input')).toHaveValue('');
  await expect(page.locator('#test-state')).toHaveText('READY WHEN YOU ARE');
});

test('theme preference persists after reload', async ({ page }) => {
  await page.locator('#theme-toggle').click();
  await expect(page.locator('body')).toHaveClass(/dark-theme/);
  await page.reload();
  await expect(page.locator('body')).toHaveClass(/dark-theme/);
});

test('paste is blocked', async ({ page }) => {
  const input = page.locator('#typing-input');
  await input.focus();
  await input.evaluate((element) => {
    const event = new ClipboardEvent('paste', { bubbles: true, cancelable: true });
    element.dispatchEvent(event);
    window.__pastePrevented = event.defaultPrevented;
  });
  expect(await page.evaluate(() => window.__pastePrevented)).toBe(true);
});

test('layout stays within a mobile viewport', async ({ page }) => {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport + 1);
});
