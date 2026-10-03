/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getAccessToken } from './googleAuth';

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

let isGapiLoaded = false;
let isPickerLoaded = false;

/**
 * Dynamically load Google API client script
 */
export async function loadGapiPickerScript(): Promise<void> {
  if (isPickerLoaded && window.google?.picker) {
    return;
  }

  return new Promise((resolve, reject) => {
    if (window.gapi) {
      window.gapi.load('picker', () => {
        isPickerLoaded = true;
        resolve();
      });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      isGapiLoaded = true;
      window.gapi.load('picker', () => {
        isPickerLoaded = true;
        resolve();
      });
    };
    script.onerror = () => {
      reject(new Error('Failed to load Google Picker API script.'));
    };
    document.body.appendChild(script);
  });
}

export interface PickedFile {
  id: string;
  name: string;
  mimeType: string;
  url: string;
  description?: string;
  lastEditedUtc?: number;
}

export interface OpenPickerOptions {
  viewId?: string; // 'DOCS', 'DOCUMENTS', 'SPREADSHEETS', 'FORMS'
  mimeType?: string;
  title?: string;
  onPicked: (file: PickedFile) => void;
  onCancel?: () => void;
}

/**
 * Open the Google Picker dialog
 */
export async function openGooglePicker(options: OpenPickerOptions): Promise<void> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('AUTH_REQUIRED: Please sign in with Google to use the Google Picker.');
  }

  await loadGapiPickerScript();

  if (!window.google?.picker) {
    throw new Error('Google Picker library failed to initialize.');
  }

  const pickerOrigin =
    window.location.ancestorOrigins && window.location.ancestorOrigins.length > 0
      ? window.location.ancestorOrigins[window.location.ancestorOrigins.length - 1]
      : window.location.origin;

  let view = new window.google.picker.DocsView(
    window.google.picker.ViewId[options.viewId || 'DOCS'] || window.google.picker.ViewId.DOCS
  );

  if (options.mimeType) {
    view.setMimeTypes(options.mimeType);
  }

  const pickerBuilder = new window.google.picker.PickerBuilder()
    .addView(view)
    .setOAuthToken(token)
    .setOrigin(pickerOrigin)
    .setCallback((data: any) => {
      if (data.action === window.google.picker.Action.PICKED) {
        const doc = data.docs[0];
        options.onPicked({
          id: doc.id,
          name: doc.name,
          mimeType: doc.mimeType,
          url: doc.url,
          description: doc.description,
          lastEditedUtc: doc.lastEditedUtc,
        });
      } else if (data.action === window.google.picker.Action.CANCEL) {
        if (options.onCancel) options.onCancel();
      }
    });

  if (options.title) {
    pickerBuilder.setTitle(options.title);
  }

  const picker = pickerBuilder.build();
  picker.setVisible(true);
}
