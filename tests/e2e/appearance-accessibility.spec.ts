import { expect, test } from '@playwright/test';

for (const theme of ['dark', 'light'] as const) {
  test(`${theme} login has readable text, discernible input boundaries and reduced motion`, async ({ page }) => {
    await page.addInitScript(value => localStorage.setItem('abangcolek-workspace-theme', value), theme);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/login');
    await expect(page.getByLabel('Email', { exact: true })).toBeVisible();
    const ratios = await page.evaluate(() => {
      const luminance = (color: string) => {
        const rgb = color.match(/[\d.]+/g)!.slice(0, 3).map(Number).map(channel => {
          const value = channel / 255;
          return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
        });
        return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
      };
      const contrast = (foreground: string, background: string) => {
        const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
        return (values[0] + .05) / (values[1] + .05);
      };
      const card = document.querySelector('.platform-auth-card')!;
      const label = card.querySelector('label')!;
      const input = card.querySelector('input')!;
      const paragraph = card.querySelector('p')!;
      const primary = card.querySelector('.platform-primary')!;
      const cs = getComputedStyle(card), ls = getComputedStyle(label), ins = getComputedStyle(input), ps = getComputedStyle(paragraph), bs = getComputedStyle(primary);
      return {
        label: contrast(ls.color, cs.backgroundColor), muted: contrast(ps.color, cs.backgroundColor),
        primary: contrast(bs.color, bs.backgroundColor), inputBorder: contrast(ins.borderTopColor, ins.backgroundColor),
        overflow: document.documentElement.scrollWidth > innerWidth,
      };
    });
    expect(ratios.label).toBeGreaterThanOrEqual(4.5);
    expect(ratios.muted).toBeGreaterThanOrEqual(4.5);
    expect(ratios.primary).toBeGreaterThanOrEqual(4.5);
    expect(ratios.inputBorder).toBeGreaterThanOrEqual(3);
    expect(ratios.overflow).toBe(false);
    await page.getByRole('button', { name: 'Masuk workspace', exact: true }).focus();
    await expect(page.getByRole('button', { name: 'Masuk workspace', exact: true })).toBeFocused();
    expect(await page.getByRole('button', { name: 'Masuk workspace', exact: true }).evaluate(element => getComputedStyle(element).outlineStyle)).not.toBe('none');
    await page.keyboard.down('Space');
    expect(await page.getByRole('button', { name: 'Masuk workspace', exact: true }).evaluate(element => getComputedStyle(element).transform)).toBe('none');
    await page.keyboard.up('Space');
  });
}
