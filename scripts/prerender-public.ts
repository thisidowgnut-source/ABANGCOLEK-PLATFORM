import { Database } from 'bun:sqlite';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve,relative,isAbsolute } from 'node:path';
import { createHash } from 'node:crypto';
import { buildPublicHtml, type PublicSnapshot } from './public-html';
import type { CatalogueProduct, InventoryReservation, StockLot } from '../shared/platform-contracts';

const projectRoot = resolve(import.meta.dir, '..');
const outputRoot=resolve(projectRoot,process.env.PLATFORM_PUBLIC_OUTPUT??'dist');
const outputRelative=relative(projectRoot,outputRoot);
if(!outputRelative||outputRelative.startsWith('..')||isAbsolute(outputRelative))throw new Error('Public output must be a child directory within the project.');
const databasePath = resolve(projectRoot, process.env.PLATFORM_DATABASE ?? 'var/lib/platform/platform.sqlite');
const snapshot: PublicSnapshot = { version: 0, products: [], generatedAt: new Date().toISOString() };
if (existsSync(databasePath)) {
  const database = new Database(databasePath, { readonly: true, strict: true });
  try {
    const read = <T>(kind: string): T[] => database.query<{ data: string }, [string]>('SELECT data FROM records WHERE kind=?').all(kind).map(row => JSON.parse(row.data) as T);
    snapshot.version = Number(database.query<{ value: string }, [string]>('SELECT value FROM metadata WHERE key=?').get('catalogue_version')?.value ?? '0');
    const lots = read<StockLot>('lots'), reservations = read<InventoryReservation>('reservations');
    snapshot.products = read<CatalogueProduct>('catalogue').filter(product => product.status === 'published').map(product => ({ id: product.id, name: product.name, description: product.description, priceSen: product.priceSen, currency: 'MYR', packSize: product.packSize, publishedVersion: snapshot.version, availableQuantity: Math.max(0, lots.filter(lot => lot.productId === product.id && lot.ownerId === 'business' && lot.locationId === 'hq' && lot.status === 'available'&&(!lot.expiryAt||lot.expiryAt>snapshot.generatedAt)).reduce((sum, lot) => sum + lot.quantity, 0) - reservations.filter(reservation => reservation.productId === product.id && reservation.ownerId === 'business' && reservation.locationId === 'hq' && reservation.status === 'active' && reservation.expiresAt > snapshot.generatedAt).reduce((sum, reservation) => sum + reservation.quantity, 0)) }));
  } finally { database.close(); }
}
const template = readFileSync(resolve(outputRoot, 'index.html'), 'utf8');
const shellRevision = createHash('sha256').update(template).digest('hex').slice(0, 16);
const workerPath = resolve(outputRoot, 'platform-sw.js');
writeFileSync(workerPath, readFileSync(workerPath, 'utf8').replace('abangcolek-public-shell-v1', `abangcolek-public-shell-${shellRevision}`));
const save = (relative: string, html: string) => { const destination = resolve(outputRoot, relative); mkdirSync(dirname(destination), { recursive: true }); writeFileSync(destination, html); };
save('index.html', buildPublicHtml(template, snapshot, 'home'));
save('products/index.html', buildPublicHtml(template, snapshot, 'products'));
for (const product of snapshot.products) {
  if (!/^[a-zA-Z0-9_-]+$/.test(product.id)) throw new Error('Published product has an invalid public route identifier.');
  save(`products/${product.id}/index.html`, buildPublicHtml(template, snapshot, product));
}
writeFileSync(resolve(outputRoot, 'public-catalogue.json'), JSON.stringify(snapshot));
console.info(`Public HTML generated: catalogue version ${snapshot.version}, ${snapshot.products.length} published products. Rebuild after catalogue changes.`);
