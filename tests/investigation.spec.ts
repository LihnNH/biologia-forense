import { expect, test, type Page } from '@playwright/test';
import { CASES, CASE_LABELS, CASE_ORDER, CASE_RESULTS } from '../src/data/cases';

async function chooseSuspect(page: Page, name: string) {
  await page.locator('#change-guess').click();
  await page.locator('#suspect-list').getByRole('button', { name: new RegExp(name) }).click();
  await expect(page.locator('#statement-text')).toContainText('Idade:');
  await page.locator('#mark-as-guess').click();
  await expect(page.locator('#guess-selected-name')).toHaveText(name);
}

async function enterCode(page: Page, code: string) {
  const fields = page.locator('.code-input');
  for (let index = 0; index < 4; index++) await fields.nth(index).fill(code[index]);
}

test('a página inicial mantém os cards, recursos e fundo sem erros de runtime', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Biologia Forense', exact: true })).toBeVisible();
  await expect(page.locator('.case-card')).toHaveCount(4);
  await expect(page.locator('.smoke')).toHaveCount(1);
  await expect(page.locator('.forensic-noise')).toHaveCount(1);
  await expect.poll(() => page.locator('img').evaluateAll(images => images.every(img => img instanceof HTMLImageElement && img.complete && img.naturalWidth > 0))).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('home.png'), fullPage: true });
  await page.locator('[data-case="Faca"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#case-title')).toHaveText('Lâmina Sombria');
  await expect(page.getByRole('list', { name: 'Suspeitos — Lâmina Sombria' })).toBeVisible();
  await expect(page.locator('#case-description')).toHaveCount(0);
  expect(errors).toEqual([]);
});

for (const id of CASE_ORDER) {
  test(`exibe as fotos de ${CASE_LABELS[id]} sem ações nos retratos`, async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await expect(page.locator('.suspect-gallery')).toHaveCount(0);
    await page.locator(`[data-case="${id}"]`).click();
    const gallery = page.getByRole('list', { name: `Suspeitos — ${CASE_LABELS[id]}` });
    const portraits = gallery.getByRole('img');
    await expect(portraits).toHaveCount(CASES[id].suspects.length);
    for (const suspect of CASES[id].suspects) {
      await expect(gallery.getByRole('img', { name: `Foto de ${suspect.name}`, exact: true })).toBeVisible();
    }
    await expect.poll(() => portraits.evaluateAll(images => images.every(img => img instanceof HTMLImageElement && img.complete && img.naturalWidth > 0))).toBe(true);
    await expect(page.locator('#case-description, #open-suspects')).toHaveCount(0);
    await expect(gallery.getByRole('button')).toHaveCount(0);
    await expect(gallery.getByRole('link')).toHaveCount(0);
    await portraits.first().click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.locator('#case-view')).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('suspects-desktop.png'), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    await page.screenshot({ path: testInfo.outputPath('suspects-mobile.png'), fullPage: true });
    await page.locator('#open-guess').click();
    await expect(page.locator('#guess-view')).toBeVisible();
    await expect(page.locator('.suspect-gallery')).toHaveCount(0);
    await page.locator('#back-to-case').click();
    await expect(gallery).toBeVisible();
    await page.locator('#case-view').getByRole('button', { name: 'Voltar', exact: true }).click();
    await expect(page.locator('#home-view')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test(`resolve ${CASE_LABELS[id]} apenas com o culpado e código corretos`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/');
    await page.locator(`[data-case="${id}"]`).click();
    await page.locator('#open-guess').click();
    await expect(page.locator('.code-input').first()).toBeDisabled();
    await chooseSuspect(page, CASE_RESULTS[id].culprit);
    await enterCode(page, CASE_RESULTS[id].code.toLowerCase());
    await expect(page.locator('#done-view')).toBeVisible();
    await expect(page.locator('#culprit-name')).toHaveText(CASE_RESULTS[id].culprit);
    await expect(page.locator('#result-title')).toContainText(`${CASE_LABELS[id]}: caso solucionado`);
    await page.locator('#done-home').click();
    await page.locator(`[data-case="${id}"]`).click();
    await page.locator('#open-guess').click();
    await expect(page.locator('#guess-selected-name')).toHaveText('Nenhum suspeito marcado');
    expect(errors).toEqual([]);
  });
}

for (const failure of ['code', 'suspect', 'both'] as const) {
  test(`não revela qual parte falhou quando o erro está em ${failure}`, async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-case="Faca"]').click();
    await page.locator('#open-guess').click();
    const suspect = failure === 'code' ? CASE_RESULTS.Faca.culprit : CASES.Faca.suspects.find(s => s.name !== CASE_RESULTS.Faca.culprit)!.name;
    await chooseSuspect(page, suspect);
    await enterCode(page, failure === 'suspect' ? CASE_RESULTS.Faca.code : 'AAAA');
    await expect(page.getByRole('alertdialog')).toBeVisible();
    await expect(page.locator('#guess-error-copy')).toHaveText('Alguma parte do seu palpite não confere com as evidências. Revise os suspeitos deste caso e tente novamente.');
    await page.keyboard.press('Escape');
    await expect(page.locator('#suspects-modal')).toBeVisible();
    await expect(page.locator('.guess-badge')).toHaveCount(0);
    await page.locator('#close-suspects').click();
    await expect(page.locator('.code-input').first()).toBeDisabled();
  });
}

test('mantém palpites por caso e cancela a confirmação ao navegar', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-case="Faca"]').click();
  await page.locator('#open-guess').click();
  await chooseSuspect(page, CASE_RESULTS.Faca.culprit);
  await page.locator('#back-to-case').click();
  await page.locator('#case-view').getByRole('button', { name: 'Voltar', exact: true }).click();
  await page.locator('[data-case="Corda"]').click();
  await page.locator('#open-guess').click();
  await expect(page.locator('#guess-selected-name')).toHaveText('Nenhum suspeito marcado');
  await page.locator('#back-to-case').click();
  await page.locator('#case-view').getByRole('button', { name: 'Voltar', exact: true }).click();
  await page.locator('[data-case="Faca"]').click();
  await page.locator('#open-guess').click();
  await expect(page.locator('#guess-selected-name')).toHaveText(CASE_RESULTS.Faca.culprit);
  await page.clock.install();
  await enterCode(page, CASE_RESULTS.Faca.code);
  await page.locator('#back-to-case').click();
  await page.clock.runFor(1000);
  await expect(page.locator('#case-view')).toBeVisible();
  await expect(page.locator('#done-view')).toBeHidden();
});

test('colar, apagar e filtrar o código funciona com inputs controlados', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-case="Veneno"]').click();
  await page.locator('#open-guess').click();
  await chooseSuspect(page, CASE_RESULTS.Veneno.culprit);
  const fields = page.locator('.code-input');
  await fields.first().fill('x');
  await expect(fields.first()).toHaveValue('');
  await fields.first().evaluate(element => {
    const data = new DataTransfer();
    data.setData('text/plain', '1c-g!t');
    element.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }));
  });
  await expect(fields.nth(0)).toHaveValue('C');
  await expect(fields.nth(1)).toHaveValue('G');
  await expect(fields.nth(2)).toHaveValue('T');
  await expect(fields.nth(3)).toBeFocused();
  await page.keyboard.press('Backspace');
  await expect(fields.nth(2)).toHaveValue('');
  await expect(fields.nth(2)).toBeFocused();
  await fields.nth(2).fill('t');
  await fields.nth(3).fill('a');
  await expect(page.locator('#done-view')).toBeVisible();
});

test('modais mantêm foco e Escape retorna do depoimento para os suspeitos', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-case="Martelo"]').click();
  await page.locator('#open-guess').click();
  await page.locator('#change-guess').click();
  await expect(page.locator('#suspect-list button').first()).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('#close-suspects')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#suspect-list button').first()).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#statement-modal')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#suspects-modal')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#change-guess')).toBeFocused();
});

test('o visualizador 3D carrega pelo npm e mantém os atalhos e controles', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.locator('#open-dna-info-home').click();
  await expect(page.locator('#dna-3d-status')).toHaveClass(/hidden/, { timeout: 20_000 });
  await expect(page.locator('#dna-viewer canvas')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('dna.png') });
  await page.locator('#dna-title-toggle').click();
  await expect(page.locator('#dna-title-toggle')).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('1');
  await expect(page.locator('#dna-callout-title')).toHaveText('Base Nitrogenada');
  await expect(page.locator('#dna-callout-layer')).toHaveAttribute('aria-hidden', 'false');
  await expect.poll(() => page.locator('#dna-callout-path').getAttribute('d')).toMatch(/^M /);
  await page.keyboard.press('2');
  await expect(page.locator('#dna-callout-title')).toHaveText('Adenina');
  await page.keyboard.press('2');
  await expect(page.locator('#dna-callout-layer')).toHaveAttribute('aria-hidden', 'true');
  await page.keyboard.press('l');
  await expect(page.locator('#dna-license-card')).toHaveAttribute('aria-hidden', 'false');
  const canvas = page.locator('#dna-viewer canvas');
  await canvas.focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('+');
  await page.locator('#close-dna-info').click();
  await expect(page.locator('#home-view')).toBeVisible();
  await page.locator('#open-dna-info-home').click();
  await expect(page.locator('#dna-viewer canvas')).toHaveCount(1);
  await expect(page.locator('#dna-title-toggle')).toHaveAttribute('aria-expanded', 'true');
  expect(errors).toEqual([]);
});

test('exibe a hélice 2D quando WebGL está indisponível', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, ...args: Parameters<typeof original>) {
      if (String(args[0]).startsWith('webgl') || args[0] === 'experimental-webgl') return null;
      return original.apply(this, args);
    } as typeof original;
  });
  await page.goto('/');
  await page.locator('#open-dna-info-home').click();
  await expect(page.locator('#dna-webgl-fallback')).toBeVisible();
  await expect(page.locator('.helix-rung')).toHaveCount(6);
  await expect(page.locator('#dna-3d-status')).toHaveText('Modo compatível 2D ativo');
  await page.locator('#close-dna-info').click();
  await expect(page.locator('#home-view')).toBeVisible();
});

test('mantém o fallback 2D quando o arquivo GLB falha', async ({ page }) => {
  await page.route('**/*.glb*', route => route.request().resourceType() === 'fetch' ? route.abort() : route.continue());
  await page.goto('/');
  await page.locator('#open-dna-info-home').click();
  await expect(page.locator('#dna-webgl-fallback')).toBeVisible();
  await expect(page.locator('#dna-fallback-message')).toContainText('não pôde ser aberto');
});

test('mantém a entrada antiga e as páginas de apoio em React', async ({ page }) => {
  await page.goto('/trabalho.html');
  await expect(page.locator('.case-card')).toHaveCount(4);
  await page.goto('/debug/gabarito.html');
  await expect(page.getByRole('heading', { name: 'Gabarito Forense' })).toBeVisible();
  for (const id of CASE_ORDER) await expect(page.locator('.suspect').filter({ hasText: CASE_RESULTS[id].culprit })).toHaveCount(1);
  await page.goto('/debug/positions.html');
  await expect(page.locator('#status')).toContainText('Pronto.', { timeout: 20_000 });
  await expect(page.locator('#copy-positions')).toBeDisabled();
  const box = await page.locator('canvas').boundingBox();
  expect(box!.height).toBeGreaterThan(400);
  // Find an actual intersection with the model rather than assuming its shape.
  for (let row = 2; row <= 8; row++) {
    for (let col = 2; col <= 8; col++) {
      await page.mouse.click(box!.x + box!.width * col / 10, box!.y + box!.height * row / 10);
      if (await page.locator('.point-row').count()) break;
    }
    if (await page.locator('.point-row').count()) break;
  }
  await expect(page.locator('.point-row')).toHaveCount(1);
  await expect(page.locator('#point-count')).toHaveText('1 ponto');
  await expect(page.locator('#copy-positions')).toBeEnabled();
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: async (text: string) => { sessionStorage.setItem('copiedPositions', text); } },
  }));
  await page.locator('#copy-positions').click();
  await expect(page.locator('#copy-positions')).toHaveText('Copied!');
  expect(await page.evaluate(() => JSON.parse(sessionStorage.getItem('copiedPositions')!))).toEqual([
    { id: 1, position: { x: expect.any(Number), y: expect.any(Number), z: expect.any(Number) } },
  ]);
});

test('layout mobile continua acessível sem rolagem horizontal', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('[data-case="Corda"]')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.screenshot({ path: testInfo.outputPath('home-mobile.png'), fullPage: true });
  await page.locator('[data-case="Corda"]').click();
  await page.locator('#open-guess').click();
  await chooseSuspect(page, CASE_RESULTS.Corda.culprit);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
