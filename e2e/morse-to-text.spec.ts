import { test, expect } from '@playwright/test';

test.describe('Morse to Text Conversion', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByTitle('Decode Morse code to text').click();
  });

  test('shows the morse input section', async ({ page }) => {
    await expect(page.getByText('Morse Input')).toBeVisible();
    // "Decoded Text" heading (exact match avoids matching the placeholder text)
    await expect(page.getByText('Decoded Text', { exact: true })).toBeVisible();
  });

  test('decodes morse code to text in real-time', async ({ page }) => {
    const textarea = page.getByPlaceholder('Enter Morse code here (e.g., ... --- ... for SOS)');
    await textarea.fill('... --- ...');
    // The placeholder should disappear when decoded text appears
    await expect(page.getByText('Decoded text will appear here...')).not.toBeVisible();
  });

  test('decodes multiple words with word separator', async ({ page }) => {
    const textarea = page.getByPlaceholder('Enter Morse code here (e.g., ... --- ... for SOS)');
    await textarea.fill('.... . .-.. .-.. --- / .-- --- .-. .-.. -..');
    // The placeholder should disappear when decoded text appears
    await expect(page.getByText('Decoded text will appear here...')).not.toBeVisible();
  });

  test('decodes numbers from morse', async ({ page }) => {
    const textarea = page.getByPlaceholder('Enter Morse code here (e.g., ... --- ... for SOS)');
    await textarea.fill('.---- ..--- ...--');
    // Numbers have unique Morse codes across all scripts
    await expect(page.getByText('123').first()).toBeVisible();
  });

  test('handles extra whitespace without errors', async ({ page }) => {
    const textarea = page.getByPlaceholder('Enter Morse code here (e.g., ... --- ... for SOS)');
    await textarea.fill('...   ---   ...');
    // The placeholder should disappear
    await expect(page.getByText('Decoded text will appear here...')).not.toBeVisible();
  });

  test('shows decoded text placeholder when empty', async ({ page }) => {
    await expect(page.getByText('Decoded text will appear here...')).toBeVisible();
  });

  test('shows usage hints', async ({ page }) => {
    await expect(
      page.getByText('Use dots (.) and dashes (-) separated by spaces. Use / for word gaps.'),
    ).toBeVisible();
  });

  test('updates decoded text as morse input changes', async ({ page }) => {
    const textarea = page.getByPlaceholder('Enter Morse code here (e.g., ... --- ... for SOS)');
    await textarea.fill('.---- ..--- ...--');
    await expect(page.getByText('123').first()).toBeVisible();

    // Change to different morse (different numbers)
    await textarea.fill('....- ..... -....');
    await expect(page.getByText('456').first()).toBeVisible();
  });
});
