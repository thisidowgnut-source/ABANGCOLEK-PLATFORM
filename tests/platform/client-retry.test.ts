import { expect, test } from 'bun:test';
import { api, jsonMutation, resetClientSession } from '../../src/features/platform/client';

test('uncertain mutation retry reuses its key until a server outcome is known', async () => {
  resetClientSession(); const original = globalThis.fetch; const keys: string[] = []; let attempt = 0;
  globalThis.fetch = (async (_url, options) => {
    keys.push(new Headers(options?.headers).get('Idempotency-Key')!);
    if (++attempt === 1) throw new TypeError('Connection lost after submit');
    return Response.json({ ok: true, data: { id: 'one-receipt' } });
  }) as typeof fetch;
  try {
    await expect(api('/orders', jsonMutation({ lines: [{ productId: 'sku', quantity: 1 }] }))).rejects.toThrow();
    await api('/orders', jsonMutation({ lines: [{ productId: 'sku', quantity: 1 }] }));
    expect(keys[0]).toBe(keys[1]);
    await api('/orders', jsonMutation({ lines: [{ productId: 'sku', quantity: 1 }] }));
    expect(keys[2]).not.toBe(keys[1]);
  } finally { globalThis.fetch = original; resetClientSession(); }
});
