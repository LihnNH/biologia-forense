import { expect, test, type Page } from '@playwright/test';
import { hotspotDetails } from '../src/data/dna';

async function open2d(page: Page) {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, ...args: Parameters<typeof original>) {
      if (String(args[0]).startsWith('webgl') && this.closest('#dna-viewer')) return null;
      return original.apply(this, args);
    } as typeof original;
  });
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/');
  await page.locator('#open-dna-info-home').click();
  await expect(page.locator('.dna-static-image')).toBeVisible();
}

test('os seis pontos 2D reutilizam os textos e atalhos do 3D e a imagem não cria novos pontos', async ({ page }, testInfo) => {
  await open2d(page);
  await expect(page.locator('.dna-image-point')).toHaveText(['1', '2', '3', '4', '5', '6']);
  await expect(page.locator('#copy-dna-image-positions, #dna-viewer textarea')).toHaveCount(0);
  await expect(page.locator('#dna-viewer canvas')).toBeHidden();
  for (const [index, detail] of hotspotDetails.entries()) {
    await page.keyboard.press(String(index + 1));
    await expect(page.locator('#dna-callout-title')).toHaveText(detail.title);
    await expect(page.locator('#dna-callout-text')).toHaveText(detail.text);
    await expect(page.locator('#dna-callout-kicker')).toHaveText(`Tecla ${index + 1}`);
    await expect(page.locator('#dna-callout-layer')).toHaveAttribute('aria-hidden', 'false');
    await expect.poll(() => page.locator('#dna-callout-path').getAttribute('d')).toMatch(/^M /);
  }
  await page.keyboard.press('6');
  await expect(page.locator('#dna-callout-layer')).toHaveAttribute('aria-hidden', 'true');
  await page.locator('.dna-image-point').nth(0).click();
  await expect(page.locator('#dna-callout-title')).toHaveText(hotspotDetails[0].title);
  await expect(page.locator('#dna-callout')).toHaveCSS('opacity', '1');
  await page.screenshot({ path: testInfo.outputPath('dna-2d-explanation.png') });
  await page.locator('.dna-image-point').nth(0).click();
  await expect(page.locator('#dna-callout-layer')).toHaveAttribute('aria-hidden', 'true');
  const box = (await page.locator('.dna-static-image').boundingBox())!;
  await page.mouse.click(box.x + 10, box.y + 10);
  await expect(page.locator('.dna-image-point')).toHaveCount(6);
  await page.keyboard.press('2');
  await expect(page.locator('#dna-callout-title')).toHaveText(hotspotDetails[1].title);
  await page.locator('#close-dna-info').click();
  await page.locator('#open-dna-info-home').click();
  await expect(page.locator('#dna-callout-layer')).toHaveAttribute('aria-hidden', 'true');
});

test('pontos e linha da explicação 2D acompanham a imagem ao redimensionar', async ({ page }) => {
  await open2d(page);
  const positions = [
    { x: .403, y: .447341 }, { x: .513, y: .420525 }, { x: .664, y: .590998 },
    { x: .643, y: .665699 }, { x: .702, y: .636968 }, { x: .678, y: .698261 },
  ];
  const image = page.locator('.dna-static-image');
  await page.keyboard.press('1');
  for (const viewport of [{ width: 1366, height: 768 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport);
    const resized = (await image.boundingBox())!;
    for (const [index, position] of positions.entries()) {
      const marker = (await page.locator('.dna-image-point').nth(index).boundingBox())!;
      expect(Math.abs(marker.x + marker.width / 2 - (resized.x + resized.width * position.x))).toBeLessThan(1);
      expect(Math.abs(marker.y + marker.height / 2 - (resized.y + resized.height * position.y))).toBeLessThan(1);
    }
    const viewer = (await page.locator('#dna-viewer').boundingBox())!;
    const expectedX = resized.x - viewer.x - 1 + resized.width * positions[0].x;
    const expectedY = resized.y - viewer.y - 1 + resized.height * positions[0].y;
    await expect.poll(async () => {
      const start = /^M ([\d.-]+) ([\d.-]+)/.exec(await page.locator('#dna-callout-path').getAttribute('d') ?? '');
      return start ? Math.hypot(Number(start[1]) - expectedX, Number(start[2]) - expectedY) : Infinity;
    }).toBeLessThan(1);
  }
});
