import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { CASE_ORDER, CASE_RESULTS, type CaseId } from '../src/data/cases';

test.use({ viewport: { width: 1366, height: 768 } });
test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => localStorage.setItem('forensic-smoke', JSON.stringify({ enabled: false })));
});

async function promptGroup(page: Page, id: CaseId) {
  await page.locator(`[data-case="${id}"]`).click();
  await expect(page.locator('#visitor-group-modal')).toBeVisible();
  await expect(page.locator('#group-visitors')).toBeFocused();
}

async function addGroup(page: Page, id: CaseId, value: string) {
  await promptGroup(page, id);
  await page.locator('#group-visitors').fill(value);
  await page.locator('#confirm-group-visitors').click();
  await expect(page.locator('#visitor-group-modal')).toHaveCount(0);
  await expect(page.locator('#case-view')).toBeVisible();
}

async function settings(page: Page) {
  await page.keyboard.press('c');
  await expect(page.locator('#settings-modal')).toBeVisible();
  await expect.poll(() => page.locator('#settings-modal').evaluate(element => getComputedStyle(element).opacity)).toBe('1');
}

async function closeSettings(page: Page) {
  await page.keyboard.press('c');
  await expect(page.locator('#settings-modal')).toHaveCount(0);
}

async function exportStatistics(page: Page) {
  const downloading = page.waitForEvent('download');
  await page.locator('#export-fair-statistics').click();
  const download = await downloading;
  expect(download.suggestedFilename()).toMatch(/^estatisticas-feira-\d{4}-\d{2}-\d{2}\.json$/);
  expect(await download.failure()).toBeNull();
  return JSON.parse(await readFile((await download.path())!, 'utf8'));
}

async function solve(page: Page, id: CaseId, incorrectGuess = false) {
  await page.locator('#open-pick').click();
  const choice = incorrectGuess ? page.locator('.portrait-button').first() : page.getByRole('button', { name: `Marcar ${CASE_RESULTS[id].culprit} como suspeito`, exact: true });
  await choice.click();
  await page.locator('#open-guess').click();
  for (let index = 0; index < 4; index++) await page.locator('.code-input').nth(index).fill(CASE_RESULTS[id].code[index]);
  await expect(page.locator('.finale-screen')).toHaveAttribute('data-phase', 'complete');
}

function caseCount(page: Page, kind: 'chosen' | 'solved', id: CaseId) {
  return page.locator(`[data-statistic-kind="${kind}"] [data-statistic-case="${id}"] .fair-statistics-case-heading span:last-child`);
}

test('registra com teclado e −/+, soma os grupos e mantém o total ao recarregar', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await promptGroup(page, 'Faca');
  await page.locator('#group-visitors').press('ArrowUp');
  await page.getByRole('button', { name: 'Aumentar visitantes' }).click();
  await expect(page.locator('#group-visitors')).toHaveValue('2');
  await page.getByRole('button', { name: 'Diminuir visitantes' }).click();
  await page.locator('#group-visitors').press('ArrowDown');
  await expect(page.locator('#group-visitors')).toHaveValue('0');
  await page.screenshot({ path: testInfo.outputPath('visitor-group.png') });
  await page.locator('#group-visitors').fill('5');
  await page.locator('#group-visitors').press('Enter');
  await expect(page.locator('#visitor-group-modal')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('visitantes_totais'))).toBe('5');
  await page.locator('#case-view .case-back').click();
  await addGroup(page, 'Veneno', '3');
  await page.locator('#case-view .case-back').click();
  await addGroup(page, 'Faca', '1');
  await settings(page);
  await expect(page.locator('#total-visitors')).toHaveText('9');
  await expect(page.locator('#total-groups')).toHaveText('3');
  await expect(page.locator('#total-solved')).toHaveText('0');
  await expect(page.locator('[data-statistic-kind="chosen"] [data-statistic-case="Faca"] .fair-statistics-case-heading')).toHaveText('Lâmina Sombria2');
  const bars = await page.locator('[data-statistic-kind="chosen"] .fair-statistics-bar span').evaluateAll(elements => elements.map(element => (element as HTMLElement).style.width));
  expect(bars).toEqual(['100%', '50%', '0%', '0%']);
  expect(await page.locator('#total-visitors').evaluate(element => getComputedStyle(element).fontFamily)).toContain('Bebas Neue');
  await page.locator('.fair-statistics').scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('fair-statistics.png') });
  await page.reload();
  await expect(page.locator('.startup-screen')).toHaveCount(0);
  await settings(page);
  await expect(page.locator('#total-visitors')).toHaveText('9');
  await expect(page.locator('#total-groups')).toHaveText('3');
  expect((await exportStatistics(page)).grupos).toEqual([
    { grupo: '1', visitantes: '5' }, { grupo: '2', visitantes: '3' }, { grupo: '3', visitantes: '1' }
  ]);
  expect(errors).toEqual([]);
});

test('cancelar ou Escape não conta o grupo e devolve o foco ao caso', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.startup-screen')).toHaveCount(0);
  const card = page.locator('[data-case="Martelo"]');
  await card.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#group-visitors')).toBeFocused();
  await page.getByRole('button', { name: 'Diminuir visitantes' }).focus();
  await page.keyboard.press('c');
  await expect(page.locator('#settings-modal')).toHaveCount(0);
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('#confirm-group-visitors')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Diminuir visitantes' })).toBeFocused();
  await page.locator('#group-visitors').fill('12');
  await page.keyboard.press('Escape');
  await expect(page.locator('#visitor-group-modal')).toHaveCount(0);
  await expect(card).toBeFocused();
  await promptGroup(page, 'Martelo');
  await page.locator('#group-visitors').fill('4');
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  expect(await page.evaluate(() => localStorage.getItem('visitantes_totais'))).toBeNull();
  await settings(page);
  await expect(page.locator('#total-visitors, #total-groups, #total-solved')).toHaveText(['0', '0', '0']);
});

test('grupos com 0 podem solucionar o caso sem alterar nenhuma estatística', async ({ page }) => {
  await page.goto('/');
  await addGroup(page, 'Martelo', '0');
  await solve(page, 'Martelo');
  await settings(page);
  await expect(page.locator('#total-visitors, #total-groups, #total-solved')).toHaveText(['0', '0', '0']);
  expect(await page.locator('.fair-statistics-bar span').evaluateAll(elements => elements.map(element => (element as HTMLElement).style.width))).toEqual(Array(8).fill('0%'));
  expect((await exportStatistics(page)).grupos).toEqual([]);
});

test('código errado não conta solução e acertar depois conta uma única vez', async ({ page }) => {
  await page.goto('/');
  await addGroup(page, 'Veneno', '6');
  await page.locator('#open-pick').click();
  await page.locator('.portrait-button').first().click();
  await page.locator('#open-guess').click();
  for (const field of await page.locator('.code-input').all()) await field.fill('A');
  await expect(page.locator('#guess-error-modal')).toBeVisible();
  await settings(page);
  await expect(page.locator('#total-visitors, #total-groups, #total-solved')).toHaveText(['6', '1', '0']);
  await closeSettings(page);
  await page.locator('#retry-suspects').click();
  await page.locator('#open-guess').click();
  for (let index = 0; index < 4; index++) await page.locator('.code-input').nth(index).fill(CASE_RESULTS.Veneno.code[index]);
  await expect(page.locator('.finale-screen')).toHaveAttribute('data-phase', 'complete');
  await expect(page.locator('#result-guess-notice')).toBeVisible();
  await settings(page);
  await expect(page.locator('#total-solved')).toHaveText('1');
  await closeSettings(page);
  await settings(page);
  await expect(page.locator('#total-visitors, #total-groups, #total-solved')).toHaveText(['6', '1', '1']);
});

test('não impõe limites numéricos e preserva inteiros enormes sem perder precisão', async ({ page }) => {
  await page.goto('/');
  await promptGroup(page, 'Corda');
  await page.getByRole('button', { name: 'Diminuir visitantes' }).click();
  await expect(page.locator('#group-visitors')).toHaveValue('-1');
  expect(await page.locator('#group-visitors').getAttribute('min')).toBeNull();
  expect(await page.locator('#group-visitors').getAttribute('max')).toBeNull();
  for (const invalid of ['', '-', '1.5', '1e6', 'abc']) {
    await page.locator('#group-visitors').fill(invalid);
    await expect(page.locator('#confirm-group-visitors')).toBeDisabled();
    await expect(page.locator('#visitor-group-error')).toHaveText('Digite um número inteiro.');
  }
  await page.locator('#group-visitors').fill('99999999999999999999999999999999999999');
  await page.locator('#confirm-group-visitors').click();
  await expect(page.locator('#visitor-group-modal')).toHaveCount(0);
  await page.locator('#case-view .case-back').click();
  await addGroup(page, 'Faca', '1');
  expect(await page.evaluate(() => localStorage.getItem('visitantes_totais'))).toBe('100000000000000000000000000000000000000');
  await settings(page);
  await expect(page.locator('#total-groups')).toHaveText('2');
  const total = await page.locator('#total-visitors').textContent();
  expect(total?.replace(/\D/g, '')).toBe('100000000000000000000000000000000000000');
  expect((await exportStatistics(page)).grupos).toEqual([
    { grupo: '1', visitantes: '99999999999999999999999999999999999999' },
    { grupo: '2', visitantes: '1' }
  ]);
});

test('uma confirmação repetida enquanto salva não soma duas vezes', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    const target = window as unknown as { releaseCount: () => void };
    void navigator.locks.request('forensic-fair-statistics', () => new Promise<void>(resolve => { target.releaseCount = resolve; }));
  });
  await expect.poll(() => page.evaluate(() => typeof (window as unknown as { releaseCount?: () => void }).releaseCount)).toBe('function');
  await promptGroup(page, 'Faca');
  await page.locator('#group-visitors').fill('7');
  await page.locator('#visitor-group-modal form').evaluate(form => {
    (form as HTMLFormElement).requestSubmit();
    (form as HTMLFormElement).requestSubmit();
  });
  await expect(page.locator('#confirm-group-visitors')).toBeDisabled();
  await page.keyboard.press('Escape');
  await expect(page.locator('#visitor-group-modal')).toBeVisible();
  await page.evaluate(() => (window as unknown as { releaseCount: () => void }).releaseCount());
  await expect(page.locator('#visitor-group-modal')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('visitantes_totais'))).toBe('7');
  await settings(page);
  await expect(page.locator('#total-groups')).toHaveText('1');
  expect((await exportStatistics(page)).grupos).toEqual([{ grupo: '1', visitantes: '7' }]);
});

test('dados antigos inválidos são tratados como zero sem travar o fluxo', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('visitantes_totais', 'NaN');
    localStorage.setItem('forensic-fair-statistics', '{bad JSON');
  });
  await addGroup(page, 'Martelo', '4');
  await settings(page);
  await expect(page.locator('#total-visitors, #total-groups, #total-solved')).toHaveText(['4', '1', '0']);
});

test('falha de armazenamento não registra metade do grupo e permite tentar novamente', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('visitantes_totais', '10');
    const original = Storage.prototype.setItem;
    let fail = true;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'forensic-fair-statistics' && fail) { fail = false; throw new DOMException('Storage full', 'QuotaExceededError'); }
      return original.call(this, key, value);
    };
  });
  await promptGroup(page, 'Faca');
  await page.locator('#group-visitors').fill('2');
  await page.locator('#confirm-group-visitors').click();
  await expect(page.locator('#visitor-group-error')).toContainText('Não foi possível salvar');
  await expect(page.locator('#group-visitors')).toHaveValue('2');
  expect(await page.evaluate(() => localStorage.getItem('visitantes_totais'))).toBe('10');
  expect(await page.evaluate(() => localStorage.getItem('forensic-fair-statistics'))).toBeNull();
  await page.locator('#confirm-group-visitors').click();
  await expect(page.locator('#visitor-group-modal')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('visitantes_totais'))).toBe('12');
  await settings(page);
  await expect(page.locator('#total-groups')).toHaveText('1');
  expect((await exportStatistics(page)).grupos).toEqual([{ grupo: '1', visitantes: '2' }]);
});

test('grupos confirmados em duas abas somam sem sobrescrever e os totais se atualizam', async ({ page, context }) => {
  await page.goto('/');
  const other = await context.newPage();
  await other.goto('/');
  await promptGroup(page, 'Faca');
  await promptGroup(other, 'Corda');
  await page.locator('#group-visitors').fill('3');
  await other.locator('#group-visitors').fill('4');
  await Promise.all([page.locator('#confirm-group-visitors').click(), other.locator('#confirm-group-visitors').click()]);
  await expect(page.locator('#visitor-group-modal')).toHaveCount(0);
  await expect(other.locator('#visitor-group-modal')).toHaveCount(0);
  await settings(page);
  await expect(page.locator('#total-visitors, #total-groups')).toHaveText(['7', '2']);
  await other.locator('#case-view .case-back').click();
  await addGroup(other, 'Veneno', '5');
  await expect(page.locator('#total-visitors, #total-groups')).toHaveText(['12', '3']);
  const history = (await exportStatistics(page)).grupos as { grupo: string; visitantes: string }[];
  expect(history.map(group => group.grupo)).toEqual(['1', '2', '3']);
  expect(history.slice(0, 2).map(group => group.visitantes).sort()).toEqual(['3', '4']);
  expect(history[2]).toEqual({ grupo: '3', visitantes: '5' });
  await other.close();
});

test('contagem funciona offline, persiste ao recarregar e é removida ao apagar os dados', async ({ page, context }) => {
  await page.goto('/');
  await settings(page);
  await expect(page.locator('[data-offline]')).toHaveAttribute('data-offline', 'ready', { timeout: 60_000 });
  await closeSettings(page);
  await context.setOffline(true);
  await addGroup(page, 'Veneno', '2');
  await solve(page, 'Veneno', true);
  await settings(page);
  await expect(page.locator('#total-visitors, #total-groups, #total-solved')).toHaveText(['2', '1', '1']);
  const before = await exportStatistics(page);
  expect(before.visitantes_totais).toBe('2');
  expect(before.casos_solucionados).toBe('1');
  expect(before.casos_solucionados_por_caso.Veneno.total).toBe('1');
  expect(before.grupos).toEqual([{ grupo: '1', visitantes: '2' }]);
  await page.reload();
  await expect(page.locator('.startup-screen')).toHaveCount(0);
  await settings(page);
  await expect(page.locator('#total-visitors, #total-groups, #total-solved')).toHaveText(['2', '1', '1']);
  expect((await exportStatistics(page)).grupos).toEqual(before.grupos);
  await page.locator('#clear-offline-data').click();
  await expect(page.locator('[data-offline]')).toHaveAttribute('data-offline', 'cleared');
  await expect(page.locator('#total-visitors, #total-groups, #total-solved')).toHaveText(['0', '0', '0']);
  expect(await page.evaluate(() => localStorage.getItem('visitantes_totais'))).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem('forensic-fair-statistics'))).toBeNull();
  const after = await exportStatistics(page);
  expect(after.visitantes_totais).toBe('0');
  expect(after.grupos_atendidos).toBe('0');
  expect(after.casos_solucionados).toBe('0');
  expect(after.grupos).toEqual([]);
  expect(Object.values(after.casos_escolhidos).map(value => (value as { total: string }).total)).toEqual(['0', '0', '0', '0']);
  expect(Object.values(after.casos_solucionados_por_caso).map(value => (value as { total: string }).total)).toEqual(['0', '0', '0', '0']);
});

test('exporta JSON com todos os casos e preserva a precisão sem alterar os dados', async ({ page }) => {
  await page.goto('/');
  const visitors = '100000000000000000000000000000000000000';
  await page.evaluate(visitors => {
    localStorage.setItem('visitantes_totais', visitors);
    localStorage.setItem('forensic-fair-statistics', JSON.stringify({ visitors, groups: '12', solved: '7', cases: { Faca: '5', Veneno: '4', Martelo: '2', Corda: '1' }, solvedCases: { Faca: '3', Veneno: '2', Martelo: '1', Corda: '1' } }));
  }, visitors);
  await settings(page);
  const snapshot = await page.evaluate(() => JSON.stringify(localStorage));
  const report = await exportStatistics(page);
  expect(Number.isNaN(Date.parse(report.exportado_em))).toBe(false);
  expect(report.visitantes_totais).toBe(visitors);
  expect(report.grupos_atendidos).toBe('12');
  expect(report.casos_solucionados).toBe('7');
  expect(report.casos_escolhidos).toEqual({
    Faca: { nome: 'Lâmina Sombria', total: '5' },
    Veneno: { nome: 'Último Gole', total: '4' },
    Martelo: { nome: 'Impacto Fatal', total: '2' },
    Corda: { nome: 'Nó Mortal', total: '1' }
  });
  expect(report.casos_solucionados_por_caso).toEqual({
    Faca: { nome: 'Lâmina Sombria', total: '3' },
    Veneno: { nome: 'Último Gole', total: '2' },
    Martelo: { nome: 'Impacto Fatal', total: '1' },
    Corda: { nome: 'Nó Mortal', total: '1' }
  });
  expect(await page.evaluate(() => JSON.stringify(localStorage))).toBe(snapshot);
});

test('limpar os dados durante um caso impede que a solução recrie estatísticas apagadas', async ({ page, context }) => {
  await page.goto('/');
  await addGroup(page, 'Faca', '4');
  await settings(page);
  await expect(page.locator('[data-offline]')).toHaveAttribute('data-offline', 'ready', { timeout: 60_000 });
  const other = await context.newPage();
  await other.goto('/');
  await addGroup(other, 'Martelo', '3');
  await page.locator('#clear-offline-data').click();
  await expect(page.locator('[data-offline]')).toHaveAttribute('data-offline', 'cleared');
  await closeSettings(page);
  await solve(page, 'Faca');
  await solve(other, 'Martelo');
  await settings(page);
  await expect(page.locator('#total-visitors, #total-groups, #total-solved')).toHaveText(['0', '0', '0']);
  expect(await page.evaluate(() => localStorage.getItem('forensic-fair-statistics'))).toBeNull();
  await other.close();
});

test('modal e estatísticas usam o idioma selecionado', async ({ page }) => {
  await page.goto('/');
  await settings(page);
  await page.getByRole('switch', { name: 'Linguagem', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Fair statistics' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Export JSON', exact: true })).toBeVisible();
  await closeSettings(page);
  await promptGroup(page, 'Faca');
  await expect(page.getByRole('dialog', { name: 'How many visitors are in the group?' })).toBeVisible();
  await page.locator('#group-visitors').fill('2');
  await page.getByRole('button', { name: 'Start case', exact: true }).click();
  await settings(page);
  await expect(page.getByText('Total visitors', { exact: true })).toBeVisible();
  await expect(page.locator('#total-visitors')).toHaveText('2');
});

for (const id of CASE_ORDER) {
  test(`registra a solução de ${id} apenas na coluna correspondente e ignora uma rodada de teste`, async ({ page }) => {
    await page.goto('/');
    await addGroup(page, id, '2');
    await solve(page, id);
    await settings(page);
    for (const other of CASE_ORDER) {
      await expect(caseCount(page, 'chosen', other)).toHaveText(other === id ? '1' : '0');
      await expect(caseCount(page, 'solved', other)).toHaveText(other === id ? '1' : '0');
    }
    await closeSettings(page);
    await page.locator('#done-home').click();
    await addGroup(page, id, '0');
    await solve(page, id);
    await settings(page);
    await expect(page.locator('#total-visitors, #total-groups, #total-solved')).toHaveText(['2', '1', '1']);
    await expect(caseCount(page, 'solved', id)).toHaveText('1');
    await page.reload();
    await expect(page.locator('.startup-screen')).toHaveCount(0);
    await settings(page);
    await expect(caseCount(page, 'solved', id)).toHaveText('1');
    const report = await exportStatistics(page);
    expect(report.casos_solucionados_por_caso[id].total).toBe('1');
  });
}

test('as duas colunas ficam alinhadas com um divisor e escalas independentes', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('visitantes_totais', '30');
    localStorage.setItem('forensic-fair-statistics', JSON.stringify({ groups: '14', solved: '6', cases: { Faca: '6', Veneno: '3', Martelo: '3', Corda: '2' }, solvedCases: { Faca: '1', Veneno: '3', Martelo: '2', Corda: '0' } }));
  });
  await settings(page);
  for (const width of [1920, 1366, 1280]) {
    await page.setViewportSize({ width, height: 768 });
    await page.locator('.fair-statistics-columns').scrollIntoViewIfNeeded();
    const chosen = page.locator('[data-statistic-kind="chosen"]');
    const solved = page.locator('[data-statistic-kind="solved"]');
    const left = (await chosen.boundingBox())!;
    const right = (await solved.boundingBox())!;
    expect(right.x).toBeCloseTo(left.x + left.width, 0);
    expect(right.y).toBeCloseTo(left.y, 0);
    expect(right.width).toBeCloseTo(left.width, 0);
    await expect(solved).toHaveCSS('border-left-width', '1px');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    const bars = (kind: string) => page.locator(`[data-statistic-kind="${kind}"] .fair-statistics-bar span`).evaluateAll(elements => elements.map(element => (element as HTMLElement).style.width));
    expect(await bars('chosen')).toEqual(['100%', '50%', '50%', '33.33%']);
    expect(await bars('solved')).toEqual(['33.33%', '100%', '66.66%', '0%']);
  }
  await page.screenshot({ path: testInfo.outputPath('statistics-two-columns.png') });
});

test('dados antigos preservam o total geral e começam a distribuição das soluções sem inventar valores', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('visitantes_totais', '50');
    localStorage.setItem('forensic-fair-statistics', JSON.stringify({ groups: '10', solved: '7', cases: { Faca: '4', Veneno: '3', Martelo: '2', Corda: '1' } }));
  });
  await settings(page);
  await expect(page.locator('#total-visitors, #total-groups, #total-solved')).toHaveText(['50', '10', '7']);
  await expect(page.locator('[data-statistic-kind="solved"] .fair-statistics-case-heading span:last-child')).toHaveText(['0', '0', '0', '0']);
  await closeSettings(page);
  await addGroup(page, 'Corda', '3');
  await solve(page, 'Corda');
  await settings(page);
  await expect(page.locator('#total-visitors, #total-groups, #total-solved')).toHaveText(['53', '11', '8']);
  await expect(caseCount(page, 'chosen', 'Corda')).toHaveText('2');
  await expect(caseCount(page, 'solved', 'Corda')).toHaveText('1');
  expect((await exportStatistics(page)).grupos).toEqual([{ grupo: '11', visitantes: '3' }]);
});

test('vários grupos solucionando o mesmo caso somam uma solução por grupo', async ({ page }) => {
  await page.goto('/');
  for (let round = 1; round <= 3; round++) {
    await addGroup(page, 'Veneno', String(round));
    await solve(page, 'Veneno', true);
    await settings(page);
    await expect(caseCount(page, 'solved', 'Veneno')).toHaveText(String(round));
    await expect(caseCount(page, 'chosen', 'Veneno')).toHaveText(String(round));
    await closeSettings(page);
    await settings(page);
    await expect(page.locator('#total-solved')).toHaveText(String(round));
    await closeSettings(page);
    await page.locator('#done-home').click();
  }
  await settings(page);
  await expect(page.locator('#total-visitors, #total-groups, #total-solved')).toHaveText(['6', '3', '3']);
});

test('soluções simultâneas em duas abas preservam o total e o caso de cada uma', async ({ page, context }) => {
  await page.goto('/');
  const other = await context.newPage();
  await other.goto('/');
  await addGroup(page, 'Faca', '3');
  await addGroup(other, 'Veneno', '4');
  await Promise.all([solve(page, 'Faca'), solve(other, 'Veneno', true)]);
  await settings(page);
  await expect(page.locator('#total-visitors, #total-groups, #total-solved')).toHaveText(['7', '2', '2']);
  await expect(caseCount(page, 'solved', 'Faca')).toHaveText('1');
  await expect(caseCount(page, 'solved', 'Veneno')).toHaveText('1');
  await settings(other);
  await expect(other.locator('#total-solved')).toHaveText('2');
  const report = await exportStatistics(other);
  expect(report.casos_solucionados_por_caso.Faca.total).toBe('1');
  expect(report.casos_solucionados_por_caso.Veneno.total).toBe('1');
  await other.close();
});

test('falha ao salvar a solução preserva os dados e a recuperação registra uma única vez', async ({ page }) => {
  await page.goto('/');
  await addGroup(page, 'Martelo', '4');
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    const target = window as unknown as { rejectSolution: boolean };
    target.rejectSolution = true;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'forensic-fair-statistics' && JSON.parse(value).solved !== '0' && target.rejectSolution) throw new DOMException('Storage full', 'QuotaExceededError');
      return original.call(this, key, value);
    };
  });
  await solve(page, 'Martelo');
  await settings(page);
  await expect(page.locator('.fair-statistics [role="alert"]')).toContainText('Não foi possível salvar');
  await expect(page.locator('#total-visitors, #total-groups, #total-solved')).toHaveText(['4', '1', '0']);
  await expect(caseCount(page, 'solved', 'Martelo')).toHaveText('0');
  await page.evaluate(() => { (window as unknown as { rejectSolution: boolean }).rejectSolution = false; });
  await closeSettings(page);
  await settings(page);
  await expect(page.locator('#total-solved')).toHaveText('1');
  await expect(caseCount(page, 'solved', 'Martelo')).toHaveText('1');
  await expect(page.locator('.fair-statistics [role="alert"]')).toHaveCount(0);
});

test('sem Web Locks a confirmação, solução e exportação continuam funcionando', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'locks', { value: undefined, configurable: true }));
  await page.goto('/');
  await addGroup(page, 'Corda', '  +0005  ');
  await solve(page, 'Corda');
  await settings(page);
  await expect(page.locator('#total-visitors, #total-groups, #total-solved')).toHaveText(['5', '1', '1']);
  const report = await exportStatistics(page);
  expect(report.casos_solucionados_por_caso.Corda.total).toBe('1');
});

test('após limpar é possível atender um novo grupo sem recuperar a distribuição antiga', async ({ page }) => {
  await page.goto('/');
  await addGroup(page, 'Faca', '5');
  await solve(page, 'Faca');
  await settings(page);
  await expect(page.locator('[data-offline]')).toHaveAttribute('data-offline', 'ready', { timeout: 60_000 });
  await page.locator('#clear-offline-data').click();
  await expect(page.locator('[data-offline]')).toHaveAttribute('data-offline', 'cleared');
  await closeSettings(page);
  await page.locator('#done-home').click();
  await addGroup(page, 'Corda', '2');
  await solve(page, 'Corda');
  await settings(page);
  await expect(page.locator('#total-visitors, #total-groups, #total-solved')).toHaveText(['2', '1', '1']);
  await expect(caseCount(page, 'solved', 'Faca')).toHaveText('0');
  await expect(caseCount(page, 'solved', 'Corda')).toHaveText('1');
  expect((await exportStatistics(page)).grupos).toEqual([{ grupo: '1', visitantes: '2' }]);
});

test('histórico no JSON lista os grupos em ordem sem contar testes ou cancelamentos', async ({ page }) => {
  await page.goto('/');
  await addGroup(page, 'Faca', '5');
  await page.locator('#case-view .case-back').click();
  await addGroup(page, 'Veneno', '0');
  await page.locator('#case-view .case-back').click();
  await promptGroup(page, 'Martelo');
  await page.locator('#group-visitors').fill('7');
  await page.keyboard.press('Escape');
  await addGroup(page, 'Corda', '4');
  await settings(page);
  const report = await exportStatistics(page);
  expect(report.grupos).toEqual([{ grupo: '1', visitantes: '5' }, { grupo: '2', visitantes: '4' }]);
  expect(report.grupos_atendidos).toBe('2');
  expect(report.visitantes_totais).toBe('9');
  await expect(page.locator('.fair-statistics')).not.toContainText('Grupo 1');
});

test('histórico inválido não bloqueia a contagem e mantém os registros válidos', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('visitantes_totais', '9');
    localStorage.setItem('forensic-fair-statistics', JSON.stringify({ groups: '2', groupHistory: [
      { number: '1', visitors: '5' }, null, 'bad', { number: 'x', visitors: '4' },
      { number: '2', visitors: 'NaN' }, { number: '0', visitors: '3' }, { number: '9', visitors: '0' }
    ] }));
  });
  await addGroup(page, 'Veneno', '3');
  await settings(page);
  const report = await exportStatistics(page);
  expect(report.grupos).toEqual([{ grupo: '1', visitantes: '5' }, { grupo: '3', visitantes: '3' }]);
  expect(report.grupos_atendidos).toBe('3');
  expect(report.visitantes_totais).toBe('12');
});
