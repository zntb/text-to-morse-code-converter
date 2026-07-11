import { test, expect } from '@playwright/test';

test.describe('Playback Controls', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Type some text to enable playback
    await page.locator('textarea').first().fill('TEST');
  });

  test('shows play button in header', async ({ page }) => {
    // The play button has title="Play" (not "Play Morse code")
    await expect(page.getByTitle('Play').first()).toBeVisible();
  });

  test('shows speed control', async ({ page }) => {
    await expect(page.getByText('Speed').first()).toBeVisible();
  });

  test('shows volume control', async ({ page }) => {
    await expect(page.getByText('Volume').first()).toBeVisible();
  });

  test('shows frequency control', async ({ page }) => {
    await expect(page.getByText('Frequency').first()).toBeVisible();
  });
});
