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
  await expect(page.locator('#close-page-help')).toBeFocused();
}

async function choose(page: Page) {
  await page.locator('#open-pick').click();
  await page.getByRole('button', { name: 'Marcar Rafael Oliveira como suspeito', exact: true }).click();
  await page.locator('#open-guess').click();
}

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
  await expect(page.locator('#page-help-modal')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await openCase(page, 'Faca');
  await page.getByRole('button', { name: 'Ver informações de Rafael Oliveira', exact: true }).click();
  await expect(page.locator('.portrait-modal')).toHaveAttribute('data-phase', 'open');
  await page.keyboard.press('h');
  await expect(page.locator('#page-help-modal')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.locator('.portrait-modal')).toHaveCount(0);
  await choose(page);
  for (const field of await page.locator('.code-input').all()) await field.fill('A');
  await expect(page.locator('#guess-error-modal')).toBeVisible();
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
  await expect(page.locator('.finale-blackout')).toBeVisible();
  await page.keyboard.press('h');
  await expect(page.locator('#page-help-modal')).toHaveCount(0);
  await expect(page.locator('.finale-screen')).toHaveAttribute('data-phase', 'complete');
  await page.keyboard.press('h');
  await expect(page.locator('#page-help-modal')).toHaveCount(0);
});

test('H fica inativo no DNA e nas páginas de debug', async ({ page }) => {
  await ready(page);
  await page.locator('#open-dna-info-home').click();
  await expect(page.locator('#info-view')).toBeVisible();
  await page.keyboard.press('h');
  await expect(page.locator('#page-help-modal')).toHaveCount(0);
  for (const url of ['/debug/', '/debug/gabarito.html', '/debug/positions.html']) {
    await page.goto(url);
    await expect(page.locator('body')).toBeVisible();
    await page.keyboard.press('h');
    await expect(page.locator('#page-help-modal')).toHaveCount(0);
  }
});

test('a ajuda acompanha o idioma escolhido', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('forensic-language', 'en'));
  await ready(page);
  await openHelp(page, 'Choose your case');
  await expect(page.locator('#page-help-steps')).toContainText('science fair leaflet');
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
