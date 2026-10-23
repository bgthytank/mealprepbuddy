import { test, expect } from '@playwright/test';

test('Three realistic dice previews: roll, stop, settle, and replay without calendar writes', async ({ page }, info) => {
  const writes: string[] = [];
  const errors: string[] = [];
  page.on('request', request => { if (request.method() !== 'GET') writes.push(request.url()); });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/dice-options');
  await expect(page.getByRole('heading', { name: 'A better roll.' })).toBeVisible();
  const cards = page.locator('.dice-study-card');
  await expect(cards).toHaveCount(3);
  await expect(page.locator('.study-die')).toHaveCount(4);
  for (const die of await page.locator('.study-die').all()) {
    await expect(die.locator('.study-face')).toHaveCount(6);
    for (let side = 1; side <= 6; side++) await expect(die.locator(`[data-face="${side}"] .is-pip`)).toHaveCount(side);
  }
  await page.screenshot({ path: info.outputPath('three-dice-options.png'), fullPage: true });
  for (const card of await cards.all()) await card.getByRole('button', { name: 'Try this roll', exact: true }).click();
  const die = page.locator('.study-die').first();
  const first = await die.getAttribute('style');
  await page.waitForTimeout(750);
  expect(await die.getAttribute('style')).not.toBe(first);
  await page.screenshot({ path: info.outputPath('dice-options-rolling.png') });
  await page.waitForTimeout(1700);
  const start = Date.now();
  for (const card of await cards.all()) await card.locator('.study-scene').click();
  for (const card of await cards.all()) await expect(card.getByRole('button', { name: 'Settling…', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Roll again', exact: true })).toHaveCount(3);
  expect(Date.now() - start).toBeLessThan(2400);
  await page.waitForTimeout(500);
  await page.screenshot({ path: info.outputPath('dice-options-settled.png') });
  for (const card of await cards.all()) await card.getByRole('button', { name: 'Roll again', exact: true }).click();
  await page.waitForTimeout(1100);
  for (const card of await cards.all()) await card.getByRole('button', { name: 'Stop dice', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Roll again', exact: true })).toHaveCount(3);
  expect(writes).toEqual([]); expect(errors).toEqual([]);
});

test('Mobile previews fit the viewport; reduced motion and keyboard stop work', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/dice-options');
  const cards = page.locator('.dice-study-card');
  for (const card of await cards.all()) {
    const box = await card.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(390);
    await card.getByRole('button', { name: 'Try this roll', exact: true }).click();
    const die = card.locator('.study-die').first();
    const pose = await die.getAttribute('style');
    await page.waitForTimeout(200);
    expect(await die.getAttribute('style')).toBe(pose);
    const stop = card.locator('.study-scene');
    await stop.focus(); await page.keyboard.press('Enter');
    await expect(card.getByRole('button', { name: 'Roll again', exact: true })).toBeVisible();
  }
  await page.screenshot({ path: info.outputPath('dice-options-mobile.png'), fullPage: true });
});
