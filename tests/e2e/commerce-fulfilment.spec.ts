import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { expect, test, type Locator, type Page } from '@playwright/test';
import type { CatalogueProduct, EvidenceRecord, FulfilmentStatus, InventoryMovement, InventoryReservation, OrderRecord, StockLot } from '../../shared/platform-contracts';
import { fixture, login } from './fixtures';

function form(page: Page, title: string): Locator {
  return page.locator('.xp-form-panel').filter({ has: page.getByRole('heading', { name: title, exact: true }) });
}

async function submit<T>(page: Page, target: Locator, button: string, path: string): Promise<T> {
  const pending = page.waitForResponse(response => new URL(response.url()).pathname === `/api/platform${path}` && response.request().method() === 'POST');
  await target.getByRole('button', { name: button, exact: true }).click();
  const response = await pending;
  const result = await response.json();
  expect(response.ok(), `${path}: ${result.code ?? 'request failed'}`).toBe(true);
  expect(result.ok).toBe(true);
  return result.data as T;
}

async function readRecord<T>(page: Page, path: string): Promise<T> {
  const response = await page.request.get(`/api/platform${path}`);
  const result = await response.json();
  expect(response.ok(), `${path}: ${result.code ?? 'read failed'}`).toBe(true);
  expect(result.ok).toBe(true);
  return result.data as T;
}

async function openOrder(page: Page, role: 'founder' | 'customer', orderId: string): Promise<Locator> {
  await page.goto(`/${role}/orders/${orderId}`);
  const detail = page.locator('.xp-panel').filter({ has: page.getByRole('heading', { name: `Pesanan ${orderId}`, exact: true }) });
  await expect(detail).toBeVisible();
  return detail;
}

/** A complete one-page PDF authored by this test, clearly marked as isolated QA evidence. */
function qaPdf(label: string): Buffer {
  const text = `ISOLATED QA ONLY - ${label}`.replace(/[()\\]/g, character => `\\${character}`);
  const stream = `BT /F1 11 Tf 40 740 Td (${text}) Tj ET\n`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}endstream`,
  ];
  let content = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(content));
    content += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(content);
  content += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  content += offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
  content += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(content);
}

async function uploadProof(page: Page, role: 'founder' | 'customer', orderId: string, name: string): Promise<EvidenceRecord> {
  const detail = await openOrder(page, role, orderId);
  await detail.getByRole('button', { name: 'Bukti', exact: true }).click();
  const bytes = qaPdf(`${name} for order ${orderId}; no bank transaction or customer data`);
  await detail.getByLabel('Pilih fail', { exact: true }).setInputFiles({ name, mimeType: 'application/pdf', buffer: bytes });
  const evidence = await submit<EvidenceRecord>(page, detail, 'Muat naik bukti', '/evidence/upload');
  expect(evidence).toMatchObject({ entityId: orderId, name, kind: 'file', size: bytes.length, mimeType: 'application/pdf', visibility: 'case' });
  expect(evidence.sha256).toBe(createHash('sha256').update(bytes).digest('hex'));
  const refreshed = await openOrder(page, role, orderId);
  await refreshed.getByRole('button', { name: 'Bukti', exact: true }).click();
  const uploaded = refreshed.locator('.xp-evidence-item').filter({ hasText: evidence.id });
  await expect(uploaded).toContainText(name);
  const pendingDownload = page.waitForEvent('download');
  await uploaded.getByRole('link', { name: 'Download file', exact: true }).click();
  const downloaded = await pendingDownload;
  expect(await downloaded.failure()).toBeNull();
  expect(await readFile((await downloaded.path())!)).toEqual(bytes);
  return evidence;
}

async function transition(page: Page, role: 'founder' | 'customer', orderId: string, next: FulfilmentStatus, evidenceIds: string[] = []): Promise<OrderRecord> {
  await openOrder(page, role, orderId);
  const command = form(page, `Teruskan ke ${next}`);
  await command.getByLabel('Evidence IDs').fill(evidenceIds.join(','));
  const updated = await submit<OrderRecord>(page, command, `Sahkan ${next}`, `/orders/${orderId}/transition`);
  expect(updated.fulfilmentStatus).toBe(next);
  const detail = await openOrder(page, role, orderId);
  await expect(detail.locator('.xp-detail-grid .xp-status').first()).toHaveText(next);
  return updated;
}

async function payment(page: Page, orderId: string, action: 'verify' | 'request_refund' | 'refund', amount: string, reference: string, evidenceIds: string[]): Promise<OrderRecord> {
  const detail = await openOrder(page, 'founder', orderId);
  await detail.getByRole('button', { name: 'Pembayaran', exact: true }).click();
  const command = form(page, 'Semakan bayaran');
  await command.getByLabel('Tindakan').selectOption(action);
  await command.getByLabel('Amaun (RM)').fill(amount);
  await command.getByRole('combobox', { name: /^Sumber/ }).selectOption('cash');
  await command.getByLabel('Reference sumber sebenar').fill(reference);
  await command.getByLabel('Evidence IDs').fill(evidenceIds.join(','));
  return submit<OrderRecord>(page, command, 'Sahkan keputusan bayaran', `/orders/${orderId}/payment`);
}

test('commerce UI verifies uploaded payment, completes reserved fulfilment and records a separately evidenced partial refund', async ({ page, browser }) => {
  test.setTimeout(150_000);
  const customerContext = await browser.newContext({ baseURL: fixture().origin, acceptDownloads: true });
  try {
    const customer = await customerContext.newPage();
    await login(page, 'founder');
    await login(customer, 'customer');
    const unique = crypto.randomUUID();
    const name = `QA commerce ${unique}`;

    await page.goto('/founder/inventory');
    await page.getByRole('button', { name: 'Tambah produk', exact: true }).click();
    const productForm = form(page, 'Produk baharu');
    await productForm.getByLabel('Nama produk').fill(name);
    await productForm.getByLabel('Deskripsi disahkan').fill('Isolated QA product for lifecycle verification only; not a real business offering.');
    await productForm.getByLabel('Harga / unit (RM)').fill('20.00');
    await productForm.getByLabel('Pack size').fill('1');
    await productForm.getByLabel('Publication').selectOption('true');
    const product = await submit<CatalogueProduct>(page, productForm, 'Simpan rekod', '/catalogue');
    expect(product).toMatchObject({ name, priceSen: 2000, packSize: 1, status: 'published' });

    // A unique product keeps this scenario independent of the shared fixture product's stock.
    await page.getByRole('button', { name: 'Receive stock', exact: true }).click();
    const receiving = form(page, 'Rekod penerimaan stok');
    await receiving.getByLabel('Produk').selectOption(product.id);
    await receiving.getByLabel('Outlet / lokasi').fill('hq');
    await receiving.getByLabel('Kuantiti unit').fill('1');
    await receiving.getByLabel('Batch ID').fill(`qa-commerce-${unique}`);
    await receiving.getByLabel('Keadaan stok').selectOption('available');
    await receiving.getByLabel('Sebab / receiving reference').fill(`Isolated QA receipt ${unique}; no production stock`);
    const lot = await submit<StockLot>(page, receiving, 'Simpan rekod', '/inventory/receive');
    expect(lot).toMatchObject({ productId: product.id, quantity: 1, locationId: 'hq', ownerId: 'business' });

    const currentCatalogue = await readRecord<{ version: number }>(customer, '/catalogue/version');
    await customer.goto(`/flows/order?product=${product.id}`);
    await customer.getByRole('button', { name: 'Mulakan flow', exact: true }).click();
    await customer.getByRole('combobox', { name: 'Produk', exact: true }).selectOption(product.id);
    await customer.getByLabel('Kuantiti', { exact: true }).fill('1');
    await customer.getByRole('button', { name: 'Teruskan', exact: true }).click();
    await customer.getByLabel('Pickup', { exact: true }).check();
    await customer.getByRole('button', { name: 'Teruskan', exact: true }).click();
    await customer.getByLabel('Maklumat penerimaan', { exact: true }).fill(`Isolated QA pickup ${unique}; no personal contact`);
    await customer.getByRole('button', { name: 'Teruskan', exact: true }).click();
    await customer.getByRole('button', { name: 'Sahkan semakan server', exact: true }).click();
    await expect(customer.getByRole('region', { name: 'Harga disahkan server' })).toContainText(`Katalog v${currentCatalogue.version}`);
    await customer.getByRole('button', { name: 'Hantar permintaan', exact: true }).click();
    await expect(customer.getByRole('heading', { name: 'Permintaan telah diterima.', exact: true })).toBeVisible();
    const orderId = await customer.locator('.flow-receipt strong').innerText();
    const requested = await readRecord<OrderRecord>(customer, `/orders/${orderId}`);
    expect(requested).toMatchObject({ amountSen: 2000, paymentState: 'pending', fulfilmentStatus: 'requested', paidAmountSen: 0, refundAmountSen: 0 });
    expect(requested.lines).toEqual([{ productId: product.id, name, quantity: 1, priceSen: 2000, publishedVersion: product.publishedVersion }]);
    type Inventory = { lots: StockLot[]; movements: InventoryMovement[]; reservations: InventoryReservation[] };
    const reserved = await readRecord<Inventory>(page, '/inventory');
    expect(reserved.reservations.filter(item => item.orderId === orderId)).toMatchObject([{ productId: product.id, status: 'active', quantity: 1 }]);
    expect(reserved.lots.find(item => item.id === lot.id)?.quantity).toBe(1);

    const paymentProof = await uploadProof(customer, 'customer', orderId, 'qa-payment-proof.pdf');
    expect(await readRecord<OrderRecord>(customer, `/orders/${orderId}`)).toMatchObject({ paymentState: 'pending', paidAmountSen: 0, fulfilmentStatus: 'requested' });
    const verified = await payment(page, orderId, 'verify', '20.00', `QA-cash-verified-${unique}`, [paymentProof.id]);
    expect(verified).toMatchObject({ paymentState: 'verified', paidAmountSen: 2000, refundAmountSen: 0, fulfilmentStatus: 'requested' });

    await transition(page, 'founder', orderId, 'review');
    await transition(page, 'founder', orderId, 'accepted');
    const acceptedInventory = await readRecord<Inventory>(page, '/inventory');
    expect(acceptedInventory.reservations.find(item => item.orderId === orderId)).toMatchObject({ status: 'active', expiresAt: '9999-12-31T23:59:59.999Z' });
    expect(acceptedInventory.lots.find(item => item.id === lot.id)?.quantity).toBe(1);
    expect(acceptedInventory.movements.filter(item => item.sourceEntityId === orderId)).toEqual([]);
    await transition(page, 'founder', orderId, 'packing');
    const packingProof = await uploadProof(page, 'founder', orderId, 'qa-packing-dispatch-proof.pdf');
    const packingInventory = await readRecord<Inventory>(page, '/inventory');
    expect(packingInventory.lots.find(item => item.id === lot.id)?.quantity).toBe(1);
    expect(packingInventory.reservations.filter(item => item.orderId === orderId)).toMatchObject([{ status: 'active' }]);
    expect(packingInventory.movements.filter(item => item.sourceEntityId === orderId)).toEqual([]);
    await transition(page, 'founder', orderId, 'packed', [packingProof.id]);
    const packedInventory = await readRecord<Inventory>(page, '/inventory');
    expect(packedInventory.lots.find(item => item.id === lot.id)?.quantity).toBe(0);
    expect(packedInventory.reservations.filter(item => item.orderId === orderId)).toMatchObject([{ status: 'consumed' }]);
    expect(packedInventory.movements.filter(item => item.sourceEntityId === orderId)).toMatchObject([{ productId: product.id, quantityDelta: -1 }]);
    await transition(page, 'founder', orderId, 'dispatched', [packingProof.id]);
    const receivedProof = await uploadProof(customer, 'customer', orderId, 'qa-received-proof.pdf');
    await transition(customer, 'customer', orderId, 'received', [receivedProof.id]);
    const consumed = await readRecord<Inventory>(page, '/inventory');
    expect(consumed.lots.find(item => item.id === lot.id)?.quantity).toBe(0);
    expect(consumed.reservations.filter(item => item.orderId === orderId)).toMatchObject([{ status: 'consumed' }]);
    expect(consumed.movements.filter(item => item.sourceEntityId === orderId)).toMatchObject([{ productId: product.id, quantityDelta: -1 }]);

    // The current UI exposes refund requests to the founder; customer review remains read-only.
    const refundRequest = await payment(page, orderId, 'request_refund', '5.00', `QA-refund-request-${unique}`, []);
    expect(refundRequest).toMatchObject({ paymentState: 'refund_requested', paidAmountSen: 2000, refundAmountSen: 0, fulfilmentStatus: 'received' });
    const refundProof = await uploadProof(page, 'founder', orderId, 'qa-partial-refund-proof.pdf');
    expect(await readRecord<OrderRecord>(page, `/orders/${orderId}`)).toMatchObject({ paymentState: 'refund_requested', refundAmountSen: 0 });
    const refunded = await payment(page, orderId, 'refund', '5.00', `QA-cash-refund-${unique}`, [refundProof.id]);
    expect(refunded).toMatchObject({ paymentState: 'part_refunded', amountSen: 2000, paidAmountSen: 2000, refundAmountSen: 500, fulfilmentStatus: 'received' });
    const finalDetail = await openOrder(customer, 'customer', orderId);
    await expect(finalDetail.locator('.xp-detail-grid .xp-status')).toHaveText(['received', 'part refunded']);
    await finalDetail.getByRole('button', { name: 'Pembayaran', exact: true }).click();
    await expect(finalDetail).toContainText(/RM\s*20\.00/);
    await expect(finalDetail).toContainText(/RM\s*5\.00/);
    await expect(finalDetail.getByRole('button', { name: 'Sahkan keputusan bayaran', exact: true })).toHaveCount(0);
  } finally {
    await customerContext.close();
  }
});
