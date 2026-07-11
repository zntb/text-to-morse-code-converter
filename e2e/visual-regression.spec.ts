import { test, expect } from '@playwright/test';

test.describe('Visual Regression', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('text-to-morse mode full page screenshot', async ({ page }) => {
    await page.locator('textarea').first().fill('SOS');
    await expect(page.getByText('... --- ...').first()).toBeVisible();
    await expect(page).toHaveScreenshot('text-to-morse-sos.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });

  test('morse-to-text mode full page screenshot', async ({ page }) => {
    await page.getByTitle('Decode Morse code to text').click();
    const textarea = page.getByPlaceholder('Enter Morse code here (e.g., ... --- ... for SOS)');
    await textarea.fill('.---- ..--- ...--');
    await expect(page.getByText('123').first()).toBeVisible();
    await expect(page).toHaveScreenshot('morse-to-text-numbers.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });

  test('character reference table expanded screenshot', async ({ page }) => {
    const refCard = page.locator('[data-slot="card"]').filter({ hasText: 'Character Reference' }).first();
    // Wait for any character button to be visible (they have .font-mono span)
    await expect(
      refCard.locator('button').filter({ has: page.locator('.font-mono') }).first()
    ).toBeVisible();
    await expect(page).toHaveScreenshot('character-reference-expanded.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });

  test('character reference with search screenshot', async ({ page }) => {
    await page.getByPlaceholder('Search characters or morse code...').first().fill('A');
    const refCard = page.locator('[data-slot="card"]').filter({ hasText: 'Character Reference' }).first();
    // Wait for filtered result
    await expect(
      refCard.locator('button').filter({ has: page.locator('.font-mono') }).first()
    ).toBeVisible();
    await expect(page).toHaveScreenshot('character-reference-search.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });
});
