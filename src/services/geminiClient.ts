import { GoogleGenAI } from '@google/genai';
import { currentCsrfToken } from '../features/platform/client';

// Initialize only for an AI request; a missing AI credential must not blank the dashboard.
export function getGeminiClient(): GoogleGenAI {
  const csrf = currentCsrfToken();
  if (!csrf) throw new Error('Masuk dengan membership founder sebelum menggunakan integrasi AI.');
  return new GoogleGenAI({ apiKey: 'same-origin-proxy', httpOptions: {
    baseUrl: `${window.location.origin}/api/platform/legacy-ai`, apiVersion: 'v1beta',
    headers: { 'X-CSRF-Token': csrf }, timeout: 25_000,
  } });
}
