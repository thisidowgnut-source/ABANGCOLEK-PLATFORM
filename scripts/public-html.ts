import type { PublicProduct } from '../shared/platform-contracts';
export interface PublicSnapshot { version: number; products: PublicProduct[]; generatedAt: string }
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]!));
const safeJson = (value: unknown) => JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
/** Only an explicitly published projection enters public HTML; operational records never do. */
export function buildPublicHtml(template: string, snapshot: PublicSnapshot, view: 'home' | 'products' | PublicProduct): string {
  const product = typeof view === 'object' ? view : null;
  const title = product ? `${product.name} | ABANGCOLEK` : view === 'products' ? 'Produk | ABANGCOLEK' : 'ABANGCOLEK — Rasa yang menyatukan';
  const description = product?.description ?? 'Terokai produk ABANGCOLEK, buat pesanan dan dapatkan bantuan dalam satu tempat.';
  const canonical=product?`/products/${encodeURIComponent(product.id)}`:view==='products'?'/products':'/';
  const products = product ? [product] : snapshot.products;
  const cards = products.map(item => `<article><h2><a href="/products/${encodeURIComponent(item.id)}">${escapeHtml(item.name)}</a></h2><p>${escapeHtml(item.description)}</p><p>RM${(item.priceSen / 100).toFixed(2)}</p><a href="/flows/order">Buat pesanan</a></article>`).join('');
  const markup = `<header><a href="/">ABANGCOLEK</a><nav aria-label="Navigasi utama"><a href="/products">Produk</a> · <a href="/become-dealer">Jadi ejen</a> · <a href="/help">Bantuan</a> · <a href="/login">Log masuk</a></nav></header><main id="platform-main" data-catalogue-version="${snapshot.version}"><h1>${escapeHtml(product?.name ?? (view === 'products' ? 'Pilihan ABANGCOLEK' : 'Rasa yang menyatukan.'))}</h1><p>${escapeHtml(description)}</p>${cards || '<p>Katalog belum diterbitkan. Hubungi pasukan ABANGCOLEK untuk maklumat produk.</p>'}<noscript><p>Paparan produk tersedia tanpa JavaScript. Aktifkan JavaScript untuk menggunakan portal pesanan dengan selamat.</p></noscript></main>`;
  const structured = products.map(item => ({ '@context': 'https://schema.org', '@type': 'Product', name: item.name, description: item.description, sku: item.id, offers: { '@type': 'Offer', priceCurrency: 'MYR', price: (item.priceSen / 100).toFixed(2), availability: item.availableQuantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock' } }));
  const metadata = `<title>${escapeHtml(title)}</title><link rel="canonical" href="${escapeHtml(canonical)}"/><meta name="description" content="${escapeHtml(description)}"/><meta property="og:title" content="${escapeHtml(title)}"/><meta property="og:description" content="${escapeHtml(description)}"/>${structured.length ? `<script id="platform-product-metadata" type="application/ld+json">${safeJson(structured.length === 1 ? structured[0] : structured)}</script>` : ''}`;
  return template
    .replace(/<title>[\s\S]*?<\/title>/i, '')
    .replace(/<link\s+[^>]*rel="canonical"[^>]*>/gi, '')
    .replace(/<script\s+[^>]*id="platform-product-metadata"[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<meta\s+[^>]*(?:name="description"|property="og:(?:title|description)")[^>]*>/gi, '')
    .replace('</head>', `${metadata}</head>`)
    .replace(/<div id="root">[\s\S]*?<\/div>/, `<div id="root">${markup}</div>`);
}
