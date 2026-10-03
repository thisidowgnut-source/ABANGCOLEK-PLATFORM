/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import AppRouter, { PlatformErrorBoundary } from './features/platform/AppRouter';
import './index.css';

// Google Maps Platform Quota Defense Listener (Tier 1)
(window as any).gm_authFailure = () => {
  window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
};
const origError = console.error;
console.error = (...args: unknown[]) => {
  origError.apply(console, args);
  const msg = args.map((a) => String(a)).join(' ');
  if (msg.includes('OverQuotaMapError') || msg.includes('QuotaExceededError')) {
    window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
  }
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PlatformErrorBoundary><AppRouter /></PlatformErrorBoundary>
  </StrictMode>,
);

// The worker only caches public HTML/assets; development HMR must never be cached.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/platform-sw.js').catch(() => {
      window.dispatchEvent(new CustomEvent('platform-offline-unavailable'));
    });
  });
}
