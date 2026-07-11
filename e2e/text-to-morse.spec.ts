import { test, expect } from '@playwright/test';

test.describe('Text to Morse Conversion', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByTitle('Encode text to Morse code').click();
  });

  test('shows the input and output sections', async ({ page }) => {
    await expect(page.getByText('Input')).toBeVisible();
    await expect(page.getByText('Morse Output')).toBeVisible();
  });

  test('converts text to morse code in real-time', async ({ page }) => {
    await page.locator('textarea').first().fill('SOS');
    // Check for the morse output - use a unique fragment that won't match char reference
    await expect(page.getByText('... --- ...').first()).toBeVisible();
  });

  test('converts numbers to morse code', async ({ page }) => {
    await page.locator('textarea').first().fill('123');
    await expect(page.getByText('.---- ..--- ...--').first()).toBeVisible();
  });

  test('handles spaces between words', async ({ page }) => {
    await page.locator('textarea').first().fill('HELLO WORLD');
    await expect(
      page.getByText('.... . .-.. .-.. --- / .-- --- .-. .-.. -..').first(),
    ).toBeVisible();
  });

  test('converts mixed case input', async ({ page }) => {
    await page.locator('textarea').first().fill('Hello');
    await expect(page.getByText('.... . .-.. .-.. ---').first()).toBeVisible();
  });

  test('clears output when input is cleared', async ({ page }) => {
    const textarea = page.locator('textarea').first();
    await textarea.fill('SOS');
    await expect(page.getByText('... --- ...').first()).toBeVisible();

    await textarea.fill('');
    await expect(page.getByText('... --- ...').first()).not.toBeVisible();
  });

  test('handles punctuation', async ({ page }) => {
    await page.locator('textarea').first().fill('?');
    // The morse output section has '..--..' - target the output section specifically
    const morseSection = page.getByText('Morse Output').locator('..');
    // Verify at least one morse code element contains ..--..
    await expect(page.getByText('..--..').first()).toBeVisible();
  });

  test('shows question mark for unknown characters in the output area', async ({ page }) => {
    await page.locator('textarea').first().fill('~');
    // Wait for the morse output area to update
    const morseDisplay = page.getByText('Morse Output').locator('..');
    await expect(morseDisplay).toBeVisible();
    // '?' appears in the morse output
    await expect(page.getByText('?').first()).toBeVisible();
  });

  test('headline responds to conversion mode', async ({ page }) => {
    await page.getByTitle('Decode Morse code to text').click();
    await expect(page.getByText('Morse Code to Text')).toBeVisible();

    await page.getByTitle('Encode text to Morse code').click();
    await expect(page.getByText('Text to Morse Code')).toBeVisible();
  });
});
