import {
  test,
  expect,
  type Page,
  type APIRequestContext,
} from '@playwright/test';

const lunchTag = "Ran's school lunch";
const titles = [
  'Chicken rice bowl',
  'Salmon onigiri',
  'Turkey pinwheels',
  'Pesto pasta',
  'Egg fried rice',
  'Tofu noodles',
  'Mini quesadillas',
  'Veggie dumplings',
  'Tuna rice cakes',
  'Chicken meatballs',
  'Sweet potato wraps',
  'Lentil patties',
];
const week = (() => {
  const d = new Date();
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
})();
const nextWeek = (() => {
  const d = new Date(week + 'T12:00:00');
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
})();

async function register(page: Page) {
  const email = `lunch-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`;
  await page.goto('/');
  await page
    .getByRole('button', { name: "Don't have an account? Register" })
    .click();
  await page.getByPlaceholder('you@example.com').fill(email);
  await page.getByPlaceholder('Enter your password').fill('LunchReview2026!');
  await page
    .getByRole('button', { name: 'Create Account', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'I feel lucky' }),
  ).toBeVisible();
  const token = await page.evaluate(() => localStorage.getItem('auth_token'));
  return { Authorization: `Bearer ${token}` };
}
async function seed(page: Page, request: APIRequestContext, count = 12) {
  const headers = await register(page);
  const tag = await (
    await request.post('/api/tags', {
      headers,
      data: {
        name: count === 12 ? 'RAN’S SCHOOL LUNCH' : lunchTag,
        type: 'OTHER',
      },
    })
  ).json();
  const other = await (
    await request.post('/api/tags', {
      headers,
      data: { name: 'Dinner', type: 'OTHER' },
    })
  ).json();
  const recipes = [];
  for (const title of titles.slice(0, count)) {
    const r = await request.post('/api/recipes', {
      headers,
      data: { title, tag_ids: [tag.tag_id], default_servings: 1 },
    });
    expect(r.ok()).toBeTruthy();
    recipes.push(await r.json());
  }
  const dinner = await (
    await request.post('/api/recipes', {
      headers,
      data: {
        title: 'Dinner only lasagna',
        tag_ids: [other.tag_id],
        default_servings: 4,
      },
    })
  ).json();
  await request.put(`/api/plans/${week}/entry`, {
    headers,
    data: { date: week, recipe_id: dinner.recipe_id, servings: 4 },
  });
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'I feel lucky' }),
  ).toBeEnabled();
  return { headers, recipes, dinner };
}
async function results(page: Page) {
  const list = page.getByRole('list', { name: 'Selected school lunches' });
  await expect(list).toBeVisible();
  const picks = await list.locator('strong').allTextContents();
  expect(picks).toHaveLength(5);
  expect(new Set(picks).size).toBe(5);
  for (const title of picks) expect(titles).toContain(title);
  return picks;
}
async function saved(page: Page, picks: string[]) {
  const cells = page.getByTestId('lunch-cell');
  for (let i = 0; i < 5; i++)
    await expect(cells.nth(i)).toContainText(picks[i]);
  await expect(cells.nth(5)).toHaveText('No school');
  await expect(cells.nth(6)).toHaveText('No school');
}

test('Powerball: create tagged recipes in UI, gate fewer than five, redraw, confirm, reload', async ({
  page,
  request,
}, info) => {
  const headers = await register(page);
  await expect(
    page.getByRole('button', { name: 'I feel lucky' }),
  ).toBeDisabled();
  await page
    .getByRole('button', { name: 'Recipes', exact: true })
    .first()
    .click();
  await page.getByRole('button', { name: 'LABELS', exact: true }).click();
  await page.getByPlaceholder('e.g. Chicken').fill(lunchTag);
  await page.locator('select').selectOption('OTHER');
  await page.getByRole('button', { name: 'ADD LABEL', exact: true }).click();
  await expect(page.getByText(`Tag "${lunchTag}" added.`)).toBeVisible();
  await page
    .getByRole('button', { name: 'RECIPES', exact: true })
    .last()
    .click();
  for (const title of titles.slice(0, 4)) {
    await page.getByPlaceholder('e.g. Italian Lasagna').fill(title);
    await page.getByRole('button', { name: lunchTag, exact: true }).click();
    await page.getByRole('button', { name: 'ADD RECIPE', exact: true }).click();
    await expect(page.getByText(`Recipe "${title}" added.`)).toBeVisible();
  }
  await page.getByRole('button', { name: 'Planning', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'I feel lucky' }),
  ).toBeDisabled();
  await expect(page.getByText(/Add 1 more recipe tagged/)).toBeVisible();
  await page
    .getByRole('button', { name: 'Recipes', exact: true })
    .first()
    .click();
  await page.getByPlaceholder('e.g. Italian Lasagna').fill(titles[4]);
  await page.getByRole('button', { name: lunchTag, exact: true }).click();
  await page.getByRole('button', { name: 'ADD RECIPE', exact: true }).click();
  await expect(page.getByText(`Recipe "${titles[4]}" added.`)).toBeVisible();
  await page.getByRole('button', { name: 'Planning', exact: true }).click();
  await page.getByRole('button', { name: 'I feel lucky' }).click();
  await expect(page.getByLabel('Powerball draw in progress')).toBeVisible();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: info.outputPath('powerball-mixing.png') });
  await results(page);
  const before = await (
    await request.get(`/api/plans/${week}`, { headers })
  ).json();
  expect(before.school_lunch_entries).toEqual({});
  await page.getByRole('button', { name: 'Do it again' }).click();
  await expect(page.getByLabel('Powerball draw in progress')).toBeVisible();
  const picks = await results(page);
  await page.screenshot({ path: info.outputPath('powerball-results.png') });
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Confirm', exact: true })
    .click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await saved(page, picks);
  await page.reload();
  await saved(page, picks);
  await page.screenshot({ path: info.outputPath('school-lunch-calendar.png') });
});

test('Dice: waits for click, stops in 1–2 seconds, classic cube with twelve eligible recipes, redraw and next-week isolation', async ({
  page,
  request,
}, info) => {
  const { headers } = await seed(page, request);
  await page.getByRole('button', { name: 'Dice', exact: true }).click();
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Dice', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'I feel lucky' }).click();
  await expect(page.locator('.classic-dice-face')).toHaveCount(6);
  for (let side = 1; side <= 6; side++) {
    await expect(
      page.locator(`.classic-dice-face[data-face="${side}"] .is-pip`),
    ).toHaveCount(side);
  }
  await expect(page.locator('.classic-dice-face').first()).toHaveText('');
  await page.waitForTimeout(2400);
  await expect(
    page.getByRole('list', { name: 'Selected school lunches' }),
  ).toHaveCount(0);
  await page.screenshot({ path: info.outputPath('dice-spinning.png') });
  const start = Date.now();
  await page.getByRole('button', { name: 'Stop dice', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Dice slowing down' }),
  ).toBeDisabled();
  const picks = await results(page);
  const elapsed = Date.now() - start;
  expect(elapsed).toBeGreaterThanOrEqual(1500);
  expect(elapsed).toBeLessThan(2300);
  await page.screenshot({ path: info.outputPath('dice-results.png') });
  await page.getByRole('button', { name: 'Do it again' }).click();
  await expect(
    page.getByRole('button', { name: 'Stop dice', exact: true }),
  ).toBeVisible();
  await page.waitForTimeout(800);
  await page.getByRole('button', { name: 'Stop dice', exact: true }).click();
  const again = await results(page);
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Confirm', exact: true })
    .click();
  await saved(page, again);
  await expect(
    page.getByText('Dinner only lasagna', { exact: true }).last(),
  ).toBeVisible();
  const current = await (
    await request.get(`/api/plans/${week}`, { headers })
  ).json();
  expect(Object.keys(current.entries)).toHaveLength(1);
  await page.getByRole('button', { name: 'Next Week', exact: true }).click();
  await expect(page.getByTestId('lunch-cell').first()).toHaveText(
    'Lunch awaits',
  );
  await page.getByRole('button', { name: 'I feel lucky' }).click();
  await page.getByRole('button', { name: 'Stop dice', exact: true }).click();
  const next = await results(page);
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Confirm', exact: true })
    .click();
  await saved(page, next);
  await page.getByRole('button', { name: 'This Week', exact: true }).click();
  await saved(page, again);
  expect(picks).toHaveLength(5);
  expect(
    (await (await request.get(`/api/plans/${nextWeek}`, { headers })).json())
      .school_lunch_entries,
  ).toBeTruthy();
});

test('Cancel and close during animation save nothing; failed confirm can retry; dinner edits preserve lunches', async ({
  page,
  request,
}) => {
  const { headers, dinner } = await seed(page, request, 6);
  await page.getByRole('button', { name: 'I feel lucky' }).click();
  await page.waitForTimeout(600);
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.waitForTimeout(3500);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(
    (await (await request.get(`/api/plans/${week}`, { headers })).json())
      .school_lunch_entries,
  ).toEqual({});
  await page.getByRole('button', { name: 'I feel lucky' }).click();
  const picks = await results(page);
  await page.route(
    '**/api/plans/*/school-lunch',
    (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          detail: 'Test: lunch save unavailable. Please retry.',
        }),
      }),
    { times: 1 },
  );
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Confirm', exact: true })
    .click();
  await expect(page.getByRole('alert')).toHaveText(
    'Test: lunch save unavailable. Please retry.',
  );
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Confirm', exact: true })
    .click();
  await saved(page, picks);
  let response = await request.put(`/api/plans/${week}/entry`, {
    headers,
    data: { date: week, recipe_id: dinner.recipe_id, servings: 2 },
  });
  expect(
    Object.keys((await response.json()).school_lunch_entries),
  ).toHaveLength(5);
  response = await request.delete(`/api/plans/${week}/entry?date=${week}`, {
    headers,
  });
  expect(
    Object.keys((await response.json()).school_lunch_entries),
  ).toHaveLength(5);
  await page.reload();
  await saved(page, picks);
  await page.getByRole('button', { name: 'I feel lucky' }).click();
  await results(page);
  await expect(
    page.getByText(/Confirm replaces the five school lunches/),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await saved(page, picks);
});

test('Mobile and reduced motion: classic dice, keyboard stop, results fit viewport', async ({
  page,
  request,
}, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await seed(page, request, 5);
  await page.getByRole('button', { name: 'Dice', exact: true }).click();
  await page.getByRole('button', { name: 'I feel lucky' }).click();
  await expect(page.locator('.classic-dice-face')).toHaveCount(6);
  const stop = page.getByRole('button', { name: 'Stop dice', exact: true });
  await stop.focus();
  await page.keyboard.press('Enter');
  const picks = await results(page);
  await page.screenshot({ path: info.outputPath('mobile-results.png') });
  const box = await page.getByRole('dialog').boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Confirm', exact: true })
    .click();
  await saved(page, picks);
});

test('API rejects duplicates, untagged and foreign recipes, invalid weeks, unauthenticated saves; failed writes are atomic', async ({
  page,
  request,
}) => {
  const { headers, recipes, dinner } = await seed(page, request, 6);
  const ids = recipes.slice(0, 5).map((r) => r.recipe_id);
  const foreignAuth = await request.post('/api/auth/register', {
    data: {
      email: `foreign-${Date.now()}@example.com`,
      password: 'LunchReview2026!',
    },
  });
  const foreignHeaders = {
    Authorization: `Bearer ${(await foreignAuth.json()).access_token}`,
  };
  const foreignTag = await (
    await request.post('/api/tags', {
      headers: foreignHeaders,
      data: { name: lunchTag, type: 'OTHER' },
    })
  ).json();
  const foreignRecipe = await (
    await request.post('/api/recipes', {
      headers: foreignHeaders,
      data: {
        title: 'Other household lunch',
        tag_ids: [foreignTag.tag_id],
        default_servings: 1,
      },
    })
  ).json();
  const valid = await request.put(`/api/plans/${week}/school-lunch`, {
    headers,
    data: { recipe_ids: ids },
  });
  expect(valid.status()).toBe(200);
  const original = await valid.json();
  for (const invalid of [
    ids.slice(0, 4),
    [...ids, recipes[5].recipe_id],
    [ids[0], ids[0], ...ids.slice(2)],
    [dinner.recipe_id, ...ids.slice(1)],
    [foreignRecipe.recipe_id, ...ids.slice(1)],
  ]) {
    const r = await request.put(`/api/plans/${week}/school-lunch`, {
      headers,
      data: { recipe_ids: invalid },
    });
    expect(r.status()).toBe(422);
  }
  for (const badWeek of ['2026-10-20', '2026-02-30', '20261019', 'no-date']) {
    const r = await request.put(`/api/plans/${badWeek}/school-lunch`, {
      headers,
      data: { recipe_ids: ids },
    });
    expect(r.status()).toBe(422);
  }
  const noAuth = await request.put(`/api/plans/${week}/school-lunch`, {
    data: { recipe_ids: ids },
  });
  expect([401, 403]).toContain(noAuth.status());
  const after = await (
    await request.get(`/api/plans/${week}`, { headers })
  ).json();
  expect(after).toEqual(original);
  await page.reload();
  await expect(page.getByTestId('lunch-cell').first()).toContainText(
    recipes[0].title,
  );
});
