import { expect, test, type Page } from '@playwright/test';
import { openCase } from './helpers/cases';
import { CASE_RESULTS } from '../src/data/cases';

test.use({ viewport: { width: 1366, height: 768 } });
test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => localStorage.setItem('forensic-smoke', JSON.stringify({ enabled: false })));
});

async function ready(page: Page) {
  await page.goto('/');
  await expect(page.locator('.startup-screen')).toHaveCount(0);
}

async function openHelp(page: Page, title: string) {
  await page.keyboard.press('h');
  await expect(page.getByRole('dialog', { name: title, exact: true })).toBeVisible();
  await expect(page.locator(title === 'Escolha seu caso' || title === 'Choose your case' ? '#page-help-modal .modal-panel' : '#close-page-help')).toBeFocused();
}

async function choose(page: Page) {
  await page.locator('#open-pick').click();
  await page.getByRole('button', { name: 'Marcar Rafael Oliveira como suspeito', exact: true }).click();
  await page.locator('#open-guess').click();
}

test('o botão redondo abre a ajuda de cada tela e preserva o código e o palpite', async ({ page }) => {
  await ready(page);
  const button = page.getByRole('button', { name: 'Ajuda', exact: true });
  await expect(button).toHaveText('?');
  await expect(button).toHaveAttribute('aria-keyshortcuts', 'H');
  const bounds = await button.boundingBox();
  expect(bounds!.width).toBe(bounds!.height);
  expect(bounds!.x + bounds!.width).toBe(1366 - 24);
  expect(bounds!.y + bounds!.height).toBe(768 - 24);
  await button.click();
  await expect(page.getByRole('dialog', { name: 'Escolha seu caso' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(button).toBeFocused();
  await openCase(page, 'Faca');
  await button.click();
  await expect(page.getByRole('dialog', { name: 'Investigue os suspeitos' })).toBeVisible();
  await expect(page.locator('.page-help-shortcuts')).toHaveCount(0);
  await page.locator('#close-page-help').click();
  await expect(button).toBeFocused();
  await choose(page);
  await page.locator('.code-input').nth(0).press('t');
  await page.locator('.code-input').nth(1).press('a');
  await button.click();
  await expect(page.getByRole('dialog', { name: 'Descubra o código' })).toBeVisible();
  await expect(page.locator('.page-help-shortcuts')).toHaveCount(0);
  await page.keyboard.press('h');
  await expect(page.locator('.code-input').nth(0)).toHaveValue('T');
  await expect(page.locator('.code-input').nth(1)).toHaveValue('A');
  await expect(page.locator('#guess-selected-name')).toHaveText('Rafael Oliveira');
});

test('a lista de teclas aparece só na ajuda inicial, com squircle e fallback do gabarito', async ({ page }, testInfo) => {
  await ready(page);
  await page.locator('#open-page-help').click();
  const panel = page.locator('#page-help-modal .modal-panel');
  await expect(panel).toBeFocused();
  expect(await panel.evaluate(element => element.scrollTop)).toBe(0);
  await expect(page.locator('#page-help-title')).toBeInViewport();
  await expect(page.locator('.page-help-shortcut')).toHaveCount(13);
  const shortcut = (key: string) => page.locator('.page-help-shortcut').filter({ has: page.locator('kbd', { hasText: new RegExp(`^${key}$`) }) });
  await expect(shortcut('H')).toContainText('Abrir ou fechar a ajuda');
  await expect(shortcut('C')).toContainText('configurações');
  await expect(shortcut('1').locator('kbd')).toHaveText(['1', '2', '3', '4', '5', '6']);
  await expect(shortcut('L')).toContainText('licença');
  await expect(shortcut('Backspace')).toContainText('campo vazio');
  const key = page.locator('kbd').first();
  const style = await key.evaluate(element => ({
    supported: CSS.supports('corner-shape', 'squircle'),
    corner: getComputedStyle(element).getPropertyValue('corner-shape'),
    radius: getComputedStyle(element).borderRadius,
    font: getComputedStyle(element).fontFamily
  }));
  expect(style.supported ? ['squircle', 'superellipse(2)'] : ['']).toContain(style.corner);
  expect(style.radius).toBe(style.supported ? '17.92px' : '8px');
  expect(style.font).toContain('Bebas Neue');
  await page.screenshot({ path: testInfo.outputPath('help-shortcuts-top.png') });
  await page.locator('#close-page-help').focus();
  await page.screenshot({ path: testInfo.outputPath('help-shortcuts-bottom.png') });
  await page.locator('#close-page-help').click();
  await expect(page.locator('#open-page-help')).toBeFocused();
});

test('H abre a ajuda da tela inicial e mantém foco, atalhos e fechamento isolados', async ({ page }, testInfo) => {
  await ready(page);
  const card = page.locator('[data-case="Faca"]');
  await card.focus();
  await page.keyboard.press('Shift+h');
  await expect(page.getByRole('dialog', { name: 'Escolha seu caso' })).toBeVisible();
  await expect(page.locator('#page-help-steps')).toContainText('panfleto da feira');
  await expect(page.locator('#page-help-steps')).toContainText('mais gostou');
  await expect(page.locator('main.page')).toHaveAttribute('inert', '');
  await page.keyboard.press('Tab');
  await expect(page.locator('#close-page-help')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('#close-page-help')).toBeFocused();
  await page.keyboard.press('c');
  await expect(page.locator('#settings-modal')).toHaveCount(0);
  await page.evaluate(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'h', repeat: true, bubbles: true })));
  await expect(page.locator('#page-help-modal')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('home-help.png') });
  await page.keyboard.press('h');
  await expect(page.locator('#page-help-modal')).toHaveCount(0);
  await expect(card).toBeFocused();
  await page.keyboard.press('Control+h');
  await expect(page.locator('#page-help-modal')).toHaveCount(0);
  await openHelp(page, 'Escolha seu caso');
  await page.keyboard.press('Escape');
  await expect(page.locator('#page-help-modal')).toHaveCount(0);
  await expect(card).toBeFocused();
});

test('a ajuda dos suspeitos preserva o modo Palpite e o suspeito já marcado', async ({ page }) => {
  await ready(page);
  await openCase(page, 'Faca');
  await page.locator('#open-pick').click();
  await openHelp(page, 'Investigue os suspeitos');
  await expect(page.locator('#page-help-steps')).toContainText('depoimento');
  await expect(page.locator('#page-help-steps')).toContainText('Palpite');
  await expect(page.locator('#page-help-steps')).toContainText('Código');
  await expect(page.locator('.page-help-shortcuts')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.locator('.suspect-gallery')).toHaveClass(/is-picking/);
  await page.getByRole('button', { name: 'Marcar Rafael Oliveira como suspeito', exact: true }).click();
  await openHelp(page, 'Investigue os suspeitos');
  await page.locator('#close-page-help').click();
  await expect(page.locator('.suspect-portrait.is-guess')).toHaveCount(1);
  await expect(page.locator('#open-guess')).toBeEnabled();
});

test('H funciona nos campos do código sem perder letras nem o palpite', async ({ page }, testInfo) => {
  await ready(page);
  await openCase(page, 'Faca');
  await choose(page);
  const fields = page.locator('.code-input');
  await fields.nth(0).press('t');
  await fields.nth(1).press('a');
  await openHelp(page, 'Descubra o código');
  await expect(page.locator('#page-help-steps')).toContainText('lanterna de luz UV');
  await expect(page.locator('#page-help-steps')).toContainText('arma do crime');
  await expect(page.locator('#page-help-steps')).toContainText('riscos');
  await expect(page.locator('#page-help-steps')).toContainText('nosso cartaz');
  await expect(page.locator('.page-help-shortcuts')).toHaveCount(0);
  for (const field of await fields.all()) await expect(field).toBeDisabled();
  await page.screenshot({ path: testInfo.outputPath('code-help.png') });
  await page.keyboard.press('Escape');
  await expect(fields.nth(0)).toHaveValue('T');
  await expect(fields.nth(1)).toHaveValue('A');
  await expect(fields.nth(2)).toHaveValue('');
  await expect(page.locator('#guess-selected-name')).toHaveText('Rafael Oliveira');
  await fields.nth(2).press('c');
  await expect(fields.nth(2)).toHaveValue('C');
  await expect(page.locator('#settings-modal')).toHaveCount(0);
});

test('H não sobrepõe configurações e o coração herda exatamente a cor do crédito', async ({ page }) => {
  await ready(page);
  await page.keyboard.press('c');
  await expect(page.locator('#settings-modal')).toBeVisible();
  await expect(page.locator('#open-page-help')).toHaveCount(0);
  await page.keyboard.press('h');
  await expect(page.locator('#page-help-modal')).toHaveCount(0);
  const colors = await page.locator('.settings-credit').evaluate(element => ({
    text: getComputedStyle(element).color,
    heart: getComputedStyle(element.querySelector('svg path')!).fill
  }));
  expect(colors.heart).toBe(colors.text);
  await expect(page.locator('.settings-credit a')).toHaveAttribute('href', 'https://github.com/LihnNH');
});

test('H não sobrepõe o modal de visitantes, depoimentos ou erro de código', async ({ page }) => {
  await ready(page);
  await page.locator('[data-case="Faca"]').click();
  await page.keyboard.press('h');
  await expect(page.locator('#visitor-group-modal')).toBeVisible();
  await expect(page.locator('#open-page-help')).toHaveCount(0);
  await expect(page.locator('#page-help-modal')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await openCase(page, 'Faca');
  await page.getByRole('button', { name: 'Ver informações de Rafael Oliveira', exact: true }).click();
  await expect(page.locator('.portrait-modal')).toHaveAttribute('data-phase', 'open');
  await expect(page.locator('#open-page-help')).toHaveCount(0);
  await page.keyboard.press('h');
  await expect(page.locator('#page-help-modal')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.locator('.portrait-modal')).toHaveCount(0);
  await choose(page);
  for (const field of await page.locator('.code-input').all()) await field.fill('A');
  await expect(page.locator('#guess-error-modal')).toBeVisible();
  await expect(page.locator('#open-page-help')).toHaveCount(0);
  await page.keyboard.press('h');
  await expect(page.locator('#page-help-modal')).toHaveCount(0);
  await expect(page.locator('#guess-error-modal')).toBeVisible();
});

test('H não abre ajuda durante a verificação, a transição ou na solução', async ({ page }) => {
  await ready(page);
  await openCase(page, 'Faca');
  await choose(page);
  for (let index = 0; index < 4; index++) await page.locator('.code-input').nth(index).fill(CASE_RESULTS.Faca.code[index]);
  await page.locator('.code-input').last().evaluate(element => (element as HTMLInputElement).select());
  await page.keyboard.press('h');
  await expect(page.locator('.code-input').last()).toHaveValue(CASE_RESULTS.Faca.code[3]);
  await expect(page.locator('#page-help-modal')).toHaveCount(0);
  await expect(page.locator('#open-page-help')).toHaveCount(0);
  await expect(page.locator('.finale-blackout')).toBeVisible();
  await page.keyboard.press('h');
  await expect(page.locator('#page-help-modal')).toHaveCount(0);
  await expect(page.locator('.finale-screen')).toHaveAttribute('data-phase', 'complete');
  await expect(page.locator('#open-page-help')).toHaveCount(0);
  await page.keyboard.press('h');
  await expect(page.locator('#page-help-modal')).toHaveCount(0);
});

test('H fica inativo no DNA e nas páginas de debug', async ({ page }) => {
  await ready(page);
  await page.locator('#open-dna-info-home').click();
  await expect(page.locator('#info-view')).toBeVisible();
  await expect(page.locator('#open-page-help')).toHaveCount(0);
  await page.keyboard.press('h');
  await expect(page.locator('#page-help-modal')).toHaveCount(0);
  for (const url of ['/debug/', '/debug/gabarito.html', '/debug/positions.html']) {
    await page.goto(url);
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('#open-page-help')).toHaveCount(0);
    await page.keyboard.press('h');
    await expect(page.locator('#page-help-modal')).toHaveCount(0);
  }
});

test('a ajuda acompanha o idioma escolhido', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('forensic-language', 'en'));
  await ready(page);
  await openHelp(page, 'Choose your case');
  await expect(page.locator('#page-help-steps')).toContainText('science fair leaflet');
  await expect(page.getByRole('heading', { name: 'Keyboard shortcuts' })).toBeVisible();
  await expect(page.locator('.page-help-shortcuts')).toContainText('With the 3D DNA model focused');
  await expect(page.locator('.page-help-key').filter({ hasText: /^Space$/ })).toHaveText('Space');
  await page.keyboard.press('Escape');
  await openCase(page, 'Faca');
  await openHelp(page, 'Investigate the suspects');
  await expect(page.locator('#page-help-steps')).toContainText('Guess');
  await expect(page.locator('#page-help-steps')).toContainText('Code');
  await page.keyboard.press('Escape');
  await page.locator('#open-pick').click();
  await page.getByRole('button', { name: 'Select Rafael Oliveira as your suspect', exact: true }).click();
  await page.locator('#open-guess').click();
  await openHelp(page, 'Discover the code');
  await expect(page.locator('#page-help-steps')).toContainText('UV flashlight');
  await expect(page.locator('#page-help-steps')).toContainText('our poster');
});
