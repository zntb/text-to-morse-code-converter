import { test, expect } from '@playwright/test';

test.describe('Character Reference Table', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  // Helper: get the visible Character Reference card (first in DOM order)
  const refCard = (page: any) =>
    page.locator('[data-slot="card"]').filter({ hasText: 'Character Reference' }).first();

  // Helper: find a character button inside the ref card by its morse code (EXACT match)
  // Character buttons have a .font-mono span with the morse code, category buttons don't
  const charButtonByMorse = (page: any, morse: string) =>
    refCard(page)
      .locator('button')
      .filter({
        has: page.locator('.font-mono', {
          hasText: new RegExp(`^${morse.replace(/[.\\-]/g, '\\$&')}$`),
        }),
      })
      .first();

  // Helper: get the first character button (any character) in the ref card
  const firstCharButton = (page: any) =>
    refCard(page).locator('button').filter({ has: page.locator('.font-mono') }).first();

  test('is present and expanded by default', async ({ page }) => {
    await expect(page.getByText('Character Reference').first()).toBeVisible();
    // .first() because the Sheet portal also renders a hidden CharRefTable
    await expect(page.getByPlaceholder('Search characters or morse code...').first()).toBeVisible();
  });

  test('shows character buttons when expanded', async ({ page }) => {
    await expect(firstCharButton(page)).toBeVisible();
    // Verify specific characters by their unique morse codes
    await expect(charButtonByMorse(page, '.-')).toBeVisible();   // A
    await expect(charButtonByMorse(page, '--..')).toBeVisible(); // Z
  });

  test('shows category toggle buttons', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Letters (A-Z)' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Numbers (0-9)' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Punctuation' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Collapse All' }).first()).toBeVisible();
  });

  test('filters characters by text search', async ({ page }) => {
    await page.getByPlaceholder('Search characters or morse code...').first().fill('A');
    // After filtering by 'A', characters with 'A' in their name should remain
    // Morse code '.-' (character A) should be visible
    await expect(charButtonByMorse(page, '.-')).toBeVisible();
    // Morse code '-...' (character B) should NOT be visible
    await expect(charButtonByMorse(page, '-...')).not.toBeVisible();
  });

  test('shows no results message when search matches nothing', async ({ page }) => {
    await page.getByPlaceholder('Search characters or morse code...').first().fill('ZZZZ');
    await expect(page.getByText(/No characters found matching/)).toBeVisible();
  });

  test('toggles category visibility', async ({ page }) => {
    // Verify character A (from Letters category) is visible
    await expect(charButtonByMorse(page, '.-')).toBeVisible();

    // Click the Letters toggle button to hide the category
    // Scope to refCard to avoid the Sheet portal's button
    // Use a regex with escaped parens to avoid issues with accessible name matching
    const lettersButton = refCard(page).getByRole('button', { name: /^Letters \(A-Z\)$/ });
    await lettersButton.click();

    // Character A should now be hidden
    await expect(charButtonByMorse(page, '.-')).not.toBeVisible();
  });
});
