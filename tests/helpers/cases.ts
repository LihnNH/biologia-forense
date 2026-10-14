import { expect, type Page } from '@playwright/test';
import type { CaseId } from '../../src/data/cases';

export async function confirmTestGroup(page: Page) {
  await expect(page.locator('#visitor-group-modal')).toBeVisible();
  await page.locator('#group-visitors').fill('0');
  await page.locator('#confirm-group-visitors').click();
  await expect(page.locator('#visitor-group-modal')).toHaveCount(0);
}

export async function openCase(page: Page, id: CaseId) {
  await page.locator(`[data-case="${id}"]`).click();
  await confirmTestGroup(page);
}
