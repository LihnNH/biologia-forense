import { expect, test, type Page } from '@playwright/test';
import { CASES, CASE_LABELS, CASE_ORDER, CASE_RESULTS } from '../src/data/cases';

async function chooseSuspect(page: Page, name: string) {
  await page.locator('#open-pick').click();
  await page.getByRole('button', { name: `Marcar ${name} como suspeito`, exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.suspect-portrait.is-guess')).toHaveCount(1);
  await expect(page.locator('.suspect-portrait.is-guess').getByRole('img')).toHaveAttribute('alt', `Foto de ${name}`);
  await expect(page.locator('#open-guess')).toBeEnabled();
}

async function enterCode(page: Page, code: string) {
  const fields = page.locator('.code-input');
  for (let index = 0; index < 4; index++) await fields.nth(index).fill(code[index]);
}

async function readFinaleSmokeTint(page: Page) {
  return page.locator('canvas.smoke').evaluate(element => {
    const gl = (element as HTMLCanvasElement).getContext('webgl');
    const program = gl?.getParameter(gl.CURRENT_PROGRAM) as WebGLProgram | null;
    return gl && program ? gl.getUniform(program, gl.getUniformLocation(program, 'u_finale_tint')!) as number : null;
  });
}

test('carrega os 19 retratos antes de liberar a página e mantém o DNA preparado', async ({ page }, testInfo) => {
  const portraitsRequested = new Set<string>();
  let modelsRequested = 0;
  page.on('request', request => {
    if (request.url().endsWith('.webp')) portraitsRequested.add(request.url());
    if (request.url().endsWith('.glb')) modelsRequested++;
  });
  await page.addInitScript(() => {
    const compile = WebGL2RenderingContext.prototype.compileShader;
    WebGL2RenderingContext.prototype.compileShader = function (shader: WebGLShader) {
      sessionStorage.setItem('shaderCompiles', String(Number(sessionStorage.getItem('shaderCompiles') || 0) + 1));
      return compile.call(this, shader);
    };
  });
  let release!: () => void;
  const pausedPortrait = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/laura-almeida-*.webp', async route => {
    await pausedPortrait;
    await route.continue();
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('progressbar', { name: 'Carregamento inicial' })).toBeVisible();
  await expect(page.locator('main.page')).toHaveAttribute('inert', '');
  await expect(page.locator('#home-view')).toBeHidden();
  await expect.poll(() => portraitsRequested.size).toBe(19);
  await expect.poll(async () => Number(await page.locator('.startup-progress').getAttribute('value'))).toBeGreaterThan(0);
  await page.screenshot({ path: testInfo.outputPath('startup-loading.png') });
  release();
  await expect(page.locator('.startup-screen')).toHaveCount(0);
  expect(modelsRequested).toBe(1);
  expect(await page.evaluate(() => document.fonts.status)).toBe('loaded');
  const shaderCompiles = await page.evaluate(() => Number(sessionStorage.getItem('shaderCompiles')));
  expect(shaderCompiles).toBeGreaterThan(0);
  await page.locator('#open-dna-info-home').click();
  await expect(page.locator('#dna-3d-status')).toHaveClass(/hidden/);
  await page.locator('#dna-viewer canvas').focus();
  await page.keyboard.press('ArrowRight');
  await page.locator('#close-dna-info').click();
  await page.locator('#open-dna-info-home').click();
  expect(await page.evaluate(() => Number(sessionStorage.getItem('shaderCompiles')))).toBe(shaderCompiles);
  expect(modelsRequested).toBe(1);
});

test('uma foto com falha permite tentar novamente sem bloquear a aplicação', async ({ page }) => {
  let failPortrait = true;
  await page.route('**/laura-almeida-*.webp', route => failPortrait ? route.abort() : route.continue());
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeVisible();
  await expect(page.locator('main.page')).toHaveAttribute('inert', '');
  failPortrait = false;
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.locator('.startup-screen')).toHaveCount(0);
  await page.locator('[data-case="Martelo"]').click();
  await expect.poll(() => page.getByRole('img', { name: 'Foto de Laura Almeida', exact: true }).evaluate(image => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0)).toBe(true);
});

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
  test(`exibe a galeria de ${CASE_LABELS[id]} e abre as informações pelos retratos`, async ({ page }, testInfo) => {
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
    await expect(gallery.getByRole('button')).toHaveCount(CASES[id].suspects.length);
    await expect(gallery.getByRole('link')).toHaveCount(0);
    await portraits.first().click();
    const dialog = page.getByRole('dialog', { name: CASES[id].suspects[0].name });
    await expect(dialog).toHaveAttribute('data-phase', 'open');
    await expect(dialog.locator('.suspect-text')).toContainText('Idade:');
    await expect(page.locator('main.page')).toHaveAttribute('inert', '');
    await page.keyboard.press('Tab');
    await expect(dialog.getByRole('button', { name: 'Fechar' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(gallery.getByRole('button').first()).toBeFocused();
    await expect(page.locator('#case-view')).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('suspects-desktop.png'), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    await page.screenshot({ path: testInfo.outputPath('suspects-mobile.png'), fullPage: true });
    await expect(page.locator('#open-guess')).toBeDisabled();
    await chooseSuspect(page, CASES[id].suspects[0].name);
    await page.locator('#open-guess').click();
    await expect(page.locator('#guess-view')).toBeVisible();
    await expect(page.locator('#guess-selected-name')).toHaveText(CASES[id].suspects[0].name);
    await expect(page.locator('#change-guess, #mark-as-guess')).toHaveCount(0);
    await page.locator('#back-to-case').click();
    await expect(page.locator('.suspect-portrait.is-guess')).toHaveCount(1);
    await expect(gallery).toBeVisible();
    await page.locator('#case-view').getByRole('button', { name: 'Voltar', exact: true }).click();
    await expect(page.locator('#home-view')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test(`resolve ${CASE_LABELS[id]} apenas com o culpado e código corretos`, async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('/');
    await page.locator(`[data-case="${id}"]`).click();
    await expect(page.locator('#open-guess')).toBeDisabled();
    await chooseSuspect(page, CASE_RESULTS[id].culprit);
    await page.locator('#open-guess').click();
    await expect(page.locator('.code-input').first()).toBeFocused();
    await expect.poll(() => readFinaleSmokeTint(page)).toBe(0);
    await enterCode(page, CASE_RESULTS[id].code.toLowerCase());
    await expect(page.locator('#done-view')).toBeVisible();
    await expect(page.locator('#culprit-name')).toHaveText(CASE_RESULTS[id].culprit);
    await expect(page.locator('#result-title')).toContainText(`${CASE_LABELS[id]}: caso solucionado`);
    await expect(page.locator('.finale-screen')).toHaveAttribute('data-phase', 'complete');
    await expect(page.locator('.finale-status')).toHaveCSS('opacity', '1');
    await expect(page.locator('.finale-content')).toHaveCSS('opacity', '1');
    await expect(page.locator('canvas.smoke')).toBeVisible();
    await expect.poll(() => readFinaleSmokeTint(page)).toBe(1);
    await expect(page.locator('#result-explanation > p').first()).toBeVisible();
    await expect(page.locator('#result-explanation')).not.toContainText('as duas partes da investigação');
    await expect(page.locator('#result-explanation')).not.toContainText(/O culpado é|A responsável é/);
    await expect(page.locator('.finale-culprit')).toHaveText(`O culpado era ${CASE_RESULTS[id].culprit}`);
    await expect(page.locator('#done-home')).toBeVisible();
    await expect(page.locator('.finale-name-image')).toBeVisible();
    await expect(page.locator('.finale-artwork img')).toHaveAttribute('alt', `Foto de ${CASE_RESULTS[id].culprit}`);
    await expect(page.locator('.finale-artwork img')).toHaveAttribute('src', /-finale-/);
    await expect.poll(() => page.locator('.finale-screen img').evaluateAll(images => images.every(image => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0))).toBe(true);
    expect(await page.locator('.finale-name-image').evaluate(image => image.getBoundingClientRect().height)).toBeLessThanOrEqual(46);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1440);
    await page.screenshot({ path: testInfo.outputPath('solution-desktop.png'), fullPage: true });
    await page.locator('#done-home').click();
    await expect.poll(() => readFinaleSmokeTint(page)).toBe(0);
    await page.locator(`[data-case="${id}"]`).click();
    await expect(page.locator('#open-guess')).toBeDisabled();
    await expect(page.locator('.suspect-portrait.is-guess')).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}

for (const failure of ['code', 'suspect', 'both'] as const) {
  test(`não revela qual parte falhou quando o erro está em ${failure}`, async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-case="Faca"]').click();
    const suspect = failure === 'code' ? CASE_RESULTS.Faca.culprit : CASES.Faca.suspects.find(s => s.name !== CASE_RESULTS.Faca.culprit)!.name;
    await chooseSuspect(page, suspect);
    await page.locator('#open-guess').click();
    await expect(page.locator('#guess-selected-name')).toHaveText(suspect);
    await expect(page.locator('#code-status')).toHaveText('Aguardando código...');
    const wrongOrRightCode = failure === 'suspect' ? CASE_RESULTS.Faca.code : 'AAAA';
    for (let index = 0; index < 3; index++) await page.locator('.code-input').nth(index).fill(wrongOrRightCode[index]);
    await expect(page.getByRole('alertdialog')).toHaveCount(0);
    await expect(page.locator('#code-status')).toHaveText('Aguardando código...');
    await enterCode(page, failure === 'suspect' ? CASE_RESULTS.Faca.code : 'AAAA');
    await expect(page.getByRole('alertdialog')).toBeVisible();
    await expect(page.locator('#guess-error-copy')).toHaveText('Alguma parte do seu palpite não confere com as evidências. Revise os suspeitos deste caso e tente novamente.');
    await page.keyboard.press('Escape');
    await expect(page.locator('#case-view')).toBeVisible();
    await expect(page.locator('.suspect-portrait.is-guess')).toHaveCount(0);
    await expect(page.locator('#open-guess')).toBeDisabled();
    await expect(page.locator('#open-pick')).toBeFocused();
    await chooseSuspect(page, CASE_RESULTS.Faca.culprit);
    await page.locator('#open-guess').click();
    await enterCode(page, CASE_RESULTS.Faca.code);
    await expect(page.locator('#done-view')).toBeVisible();
  });
}

test('mantém palpites por caso e cancela a confirmação ao navegar', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-case="Faca"]').click();
  await chooseSuspect(page, CASE_RESULTS.Faca.culprit);
  await page.locator('#case-view').getByRole('button', { name: 'Voltar', exact: true }).click();
  await page.locator('[data-case="Corda"]').click();
  await expect(page.locator('#open-guess')).toBeDisabled();
  await expect(page.locator('.suspect-portrait.is-guess')).toHaveCount(0);
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
  await chooseSuspect(page, CASE_RESULTS.Veneno.culprit);
  await page.locator('#open-guess').click();
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

test('seleção pelas fotos funciona com teclado e Escape cancela o modo Palpite', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-case="Martelo"]').click();
  await page.locator('#open-pick').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.suspect-gallery')).toHaveClass(/is-picking/);
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('.portrait-button').last()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#open-pick')).toBeFocused();
  await expect(page.locator('.suspect-gallery')).not.toHaveClass(/is-picking/);
  await expect(page.locator('#open-guess')).toBeDisabled();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Enter');
  await expect(page.locator('.suspect-portrait').last()).toHaveClass(/is-guess/);
  await expect(page.locator('#open-guess')).toBeEnabled();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog', { name: 'Laura Almeida' })).toHaveAttribute('data-phase', 'open');
  await page.keyboard.press('Escape');
  await expect(page.locator('.portrait-button').last()).toBeFocused();
});

test('Depoimentos cancela a escolha, restaura o botão Palpite e preserva o suspeito marcado', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-case="Faca"]').click();
  const pick = page.locator('#open-pick');
  await expect(pick).toHaveText('Palpite');
  await pick.click();
  await expect(pick).toHaveText('Depoimentos');
  await expect(pick).toHaveAttribute('aria-pressed', 'true');
  await pick.click();
  await expect(pick).toHaveText('Palpite');
  await expect(pick).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('.suspect-gallery')).not.toHaveClass(/is-picking/);
  await expect(page.locator('#open-guess')).toBeDisabled();
  await page.getByRole('button', { name: 'Ver informações de Rafael Oliveira', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Rafael Oliveira' })).toHaveAttribute('data-phase', 'open');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await chooseSuspect(page, 'Rafael Oliveira');
  await pick.click();
  await expect(pick).toHaveText('Depoimentos');
  await pick.click();
  await expect(pick).toHaveText('Palpite');
  await expect(pick).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('.suspect-portrait.is-guess').getByRole('img')).toHaveAttribute('alt', 'Foto de Rafael Oliveira');
  await expect(page.locator('#open-guess')).toBeEnabled();
});

test('fechar o depoimento com o mouse não mantém o realce branco do retrato', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.locator('[data-case="Faca"]').click();
  const first = page.locator('.suspect-portrait').first();
  await first.getByRole('button').click();
  await expect(page.getByRole('dialog')).toHaveAttribute('data-phase', 'open');
  await page.getByRole('button', { name: 'Fechar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.mouse.move(5, 5);
  await expect(first.getByRole('button')).toBeFocused();
  expect(await first.getByRole('button').evaluate(element => element.matches(':focus-visible'))).toBe(false);
  const border = await first.evaluate(element => getComputedStyle(element).borderColor);
  expect(border).toBe(await page.locator('.suspect-portrait').nth(1).evaluate(element => getComputedStyle(element).borderColor));
  await page.keyboard.press('Tab');
  const second = page.locator('.suspect-portrait').nth(1);
  await expect(second.getByRole('button')).toBeFocused();
  expect(await second.getByRole('button').evaluate(element => element.matches(':focus-visible'))).toBe(true);
  expect(await second.evaluate(element => getComputedStyle(element).borderColor)).not.toBe(border);
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
  await page.getByRole('button', { name: `Ver informações de ${CASE_RESULTS.Corda.culprit}`, exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveAttribute('data-phase', 'open');
  await expect(page.locator('.portrait-panel')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('portrait-mobile.png'), fullPage: true });
  await page.getByRole('button', { name: 'Fechar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test('Palpite mantém o tremor e marca a seleção com a borda animada original', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.locator('[data-case="Faca"]').click();
  await expect(page.locator('#open-guess')).toBeDisabled();
  expect(await page.locator('#open-guess').evaluate(element => Number(getComputedStyle(element).opacity))).toBeLessThan(.5);
  const start = await page.locator('#open-pick').evaluate(element => {
    (element as HTMLButtonElement).click();
    const portraits = [...document.querySelectorAll<HTMLElement>('.suspect-portrait')];
    return portraits.map(portrait => ({
      tilt: portrait.style.getPropertyValue('--portrait-tilt'),
      durations: portrait.getAnimations().map(animation => animation.effect!.getTiming().duration),
    }));
  });
  expect(start).toHaveLength(5);
  for (const portrait of start) {
    expect(portrait.durations).toContain(535);
    expect(Math.abs(parseFloat(portrait.tilt))).toBeGreaterThanOrEqual(1.5);
    expect(Math.abs(parseFloat(portrait.tilt))).toBeLessThanOrEqual(3);
  }
  await expect(page.locator('.suspect-gallery')).toHaveClass(/is-picking/);
  await expect.poll(() => page.locator('.suspect-portrait').evaluateAll(elements => elements.every(element => element.getAnimations().every(animation => animation.playState === 'finished')))).toBe(true);
  const first = page.locator('.suspect-portrait').first();
  await first.hover();
  await expect.poll(() => first.evaluate(element => new DOMMatrixReadOnly(getComputedStyle(element).transform).m42)).toBeLessThan(-7.5);
  const angle = await first.evaluate(element => {
    const matrix = new DOMMatrixReadOnly(getComputedStyle(element).transform);
    return Math.atan2(matrix.b, matrix.a) * 180 / Math.PI;
  });
  expect(angle).toBeCloseTo(parseFloat(start[0].tilt), 0);
  await page.getByRole('button', { name: 'Marcar Rafael Oliveira como suspeito', exact: true }).click();
  await expect(first).toHaveClass(/is-guess/);
  expect(await first.evaluate(element => getComputedStyle(element, '::before').animationName)).toBe('guessOrbit');
  expect(await first.evaluate(element => getComputedStyle(element, '::before').animationDuration)).toBe('2.2s');
  expect(await first.evaluate(element => getComputedStyle(element, '::before').backgroundImage)).toContain('conic-gradient');
  await expect.poll(() => first.evaluate(element => getComputedStyle(element).borderColor)).toBe('rgba(255, 82, 96, 0.74)');
  expect(await first.evaluate(element => getComputedStyle(element).borderWidth)).toBe('2px');
  await expect(page.locator('.suspect-glow')).toHaveCount(0);
  const initialAngle = await first.evaluate(element => getComputedStyle(element, '::before').getPropertyValue('--guess-angle'));
  await expect.poll(() => first.evaluate(element => getComputedStyle(element, '::before').getPropertyValue('--guess-angle'))).not.toBe(initialAngle);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('#open-guess')).toBeEnabled();
  await page.screenshot({ path: testInfo.outputPath('selected-portrait.png'), fullPage: true });
  await chooseSuspect(page, 'Mariana Costa');
  await expect(first).not.toHaveClass(/is-guess/);
  await expect(page.locator('.suspect-portrait').nth(1)).toHaveClass(/is-guess/);
  expect(await first.evaluate(element => getComputedStyle(element, '::before').content)).toBe('none');
  expect(await page.locator('.suspect-portrait').nth(1).evaluate(element => getComputedStyle(element, '::before').animationName)).toBe('guessOrbit');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('.suspect-portrait.is-guess')).toHaveCount(1);
  await page.screenshot({ path: testInfo.outputPath('glow-mobile.png'), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.setViewportSize({ width: 1440, height: 900 });
  expect(await page.locator('.suspect-portrait').evaluateAll(elements => elements.map(element => (element as HTMLElement).style.getPropertyValue('--portrait-tilt')))).toEqual(start.map(portrait => portrait.tilt));
  await page.locator('#open-guess').click();
  await expect(page.locator('#guess-selected-name')).toHaveText('Mariana Costa');
  await expect(page.locator('#change-guess, #mark-as-guess')).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath('code-with-selected-suspect.png'), fullPage: true });
});

test('a foto desaparece rapidamente e o painel cresce direto até o tamanho final', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.locator('[data-case="Faca"]').click();
  const source = page.getByRole('button', { name: 'Ver informações de Rafael Oliveira', exact: true });
  const measurements = await source.evaluate(async element => {
    const original = element.querySelector('img')!.getBoundingClientRect();
    const started = performance.now();
    (element as HTMLButtonElement).click();
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    const photo = document.querySelector<HTMLElement>('.portrait-flight')!;
    const animation = photo.getAnimations().find(item => (item.effect as KeyframeEffect).getKeyframes().some(frame => 'width' in frame))!;
    const fade = photo.getAnimations().find(item => (item.effect as KeyframeEffect).getKeyframes().some(frame => 'opacity' in frame))!;
    // Pause at defined points to inspect geometry without machine-speed timing races.
    animation.pause();
    animation.currentTime = 0;
    const atStart = photo.getBoundingClientRect();
    animation.currentTime = 300;
    const expanded = photo.getBoundingClientRect();
    animation.currentTime = 0;
    animation.play();
    await fade.finished;
    const fadeElapsed = performance.now() - started;
    await animation.finished;
    const panel = document.querySelector<HTMLElement>('.portrait-panel')!;
    await Promise.all(panel.getAnimations().map(item => item.finished));
    const finished = panel.getBoundingClientRect();
    const contentOpacity = Number(getComputedStyle(document.querySelector('.portrait-content')!).opacity);
    await new Promise(resolve => setTimeout(resolve, 180));
    const settled = panel.getBoundingClientRect();
    return { original: original.toJSON(), atStart: atStart.toJSON(), expanded: expanded.toJSON(), fadeElapsed, finished: finished.toJSON(), settled: settled.toJSON(), contentOpacity, opacity: Number(getComputedStyle(photo).opacity) };
  });
  expect(measurements.atStart.x).toBeCloseTo(measurements.original.x, 0);
  expect(measurements.atStart.y).toBeCloseTo(measurements.original.y, 0);
  expect(measurements.atStart.width).toBeCloseTo(measurements.original.width, 0);
  expect(measurements.expanded.width).toBeGreaterThan(measurements.original.width * 2);
  expect(measurements.fadeElapsed).toBeLessThan(350);
  expect(measurements.opacity).toBe(0);
  expect(measurements.contentOpacity).toBe(1);
  for (const dimension of ['x', 'y', 'width', 'height'] as const) {
    expect(measurements.settled[dimension]).toBeCloseTo(measurements.finished[dimension], 1);
  }
  await expect(page.getByRole('dialog')).toHaveAttribute('data-phase', 'open');
  await page.screenshot({ path: testInfo.outputPath('portrait-expanded.png'), fullPage: true });
  await page.getByRole('button', { name: 'Fechar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(source).toBeFocused();
});

test('Escape durante a expansão restaura o retrato e permite abrir outro suspeito', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await page.locator('[data-case="Veneno"]').click();
  const sources = page.locator('.portrait-button');
  await sources.first().evaluate(element => {
    (element as HTMLButtonElement).click();
    setTimeout(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })), 100);
  });
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(sources.first()).toBeFocused();
  await expect(page.locator('main.page')).not.toHaveAttribute('inert', '');
  await sources.nth(1).click();
  await expect(page.getByRole('dialog', { name: 'Vanessa Ribeiro' })).toHaveAttribute('data-phase', 'open');
  await page.locator('.portrait-backdrop').click({ position: { x: 5, y: 5 } });
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(sources.nth(1)).toBeFocused();
  expect(errors).toEqual([]);
});
