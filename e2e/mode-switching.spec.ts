import { test, expect } from '@playwright/test';

test.describe('Mode Switching', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('default mode is text-to-morse', async ({ page }) => {
    await expect(page.getByText('Input')).toBeVisible();
    await expect(page.getByText('Morse Output')).toBeVisible();
  });

  test('switches to morse-to-text mode', async ({ page }) => {
    await page.getByTitle('Decode Morse code to text').click();
    await expect(page.getByText('Morse Input')).toBeVisible();
    // "Decoded Text" heading (exact match avoids matching the placeholder text)
    await expect(page.getByText('Decoded Text', { exact: true })).toBeVisible();

    // Text-to-morse elements should not be visible
    await expect(page.getByText('Morse Output')).not.toBeVisible();
  });

  test('switches to practice mode', async ({ page }) => {
    await page.getByTitle('Practice and learn Morse code').click();
    // Text-to-morse and morse-to-text sections should be gone
    await expect(page.getByText('Input')).not.toBeVisible();
    await expect(page.getByText('Morse Output')).not.toBeVisible();
    await expect(page.getByText('Morse Input')).not.toBeVisible();
  });

  test('switches back to text-to-morse from practice', async ({ page }) => {
    await page.getByTitle('Practice and learn Morse code').click();
    await page.getByTitle('Encode text to Morse code').click();
    await expect(page.getByText('Input')).toBeVisible();
    await expect(page.getByText('Morse Output')).toBeVisible();
  });

  test('round-trips between all three modes', async ({ page }) => {
    // Text → Morse
    await page.getByTitle('Encode text to Morse code').click();
    await expect(page.getByText('Input')).toBeVisible();

    // Morse → Text
    await page.getByTitle('Decode Morse code to text').click();
    await expect(page.getByText('Morse Input')).toBeVisible();

    // Practice
    await page.getByTitle('Practice and learn Morse code').click();
    await expect(page.getByText('Morse Output')).not.toBeVisible();
  });
});
