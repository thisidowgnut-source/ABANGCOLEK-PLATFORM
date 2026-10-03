import type { FlowIntent, PublicProduct } from '../../../shared/platform-contracts';
export function lineAnswers(intent: FlowIntent, product: PublicProduct, quantity: number): Record<string,unknown> {
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 10000) throw new Error('Kuantiti mesti integer positif, maksimum 10,000.');
  if (intent !== 'stock_receipt' && quantity % product.packSize !== 0) throw new Error(`Pilih gandaan pack ${product.packSize}.`);
  const lines = [{ productId: product.id, quantity }];
  // Receipts describe physical arrivals; current HQ availability is not receiving evidence.
  return intent === 'stock_receipt' ? { lines } : { lines, catalogueVersion: product.publishedVersion };
}
