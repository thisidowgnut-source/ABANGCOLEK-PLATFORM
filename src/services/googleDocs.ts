/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getAccessToken } from './googleAuth';

export interface GoogleDocItem {
  id: string;
  name: string;
  createdTime?: string;
  modifiedTime?: string;
  webViewLink?: string;
  iconLink?: string;
}

export interface GoogleDocDetail {
  documentId: string;
  title: string;
  body?: any;
  revisionId?: string;
  extractedText?: string;
}

/**
 * List Google Docs from Google Drive
 */
export async function listGoogleDocs(): Promise<GoogleDocItem[]> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('AUTH_REQUIRED: Please sign in with Google to view your documents.');
  }

  const query = encodeURIComponent("mimeType='application/vnd.google-apps.document' and trashed=false");
  const fields = encodeURIComponent('files(id,name,createdTime,modifiedTime,webViewLink,iconLink)');
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&orderBy=modifiedTime%20desc&pageSize=50`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to fetch documents (${res.status})`);
  }

  const data = await res.json();
  return data.files || [];
}

/**
 * Fetch a Google Doc's content and extract plain text
 */
export async function getGoogleDoc(documentId: string): Promise<GoogleDocDetail> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('AUTH_REQUIRED: Please sign in with Google to view this document.');
  }

  const url = `https://docs.googleapis.com/v1/documents/${documentId}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to fetch document (${res.status})`);
  }

  const data = await res.json();
  let extractedText = '';

  if (data.body?.content) {
    for (const elem of data.body.content) {
      if (elem.paragraph?.elements) {
        for (const pe of elem.paragraph.elements) {
          if (pe.textRun?.content) {
            extractedText += pe.textRun.content;
          }
        }
      }
    }
  }

  return {
    documentId: data.documentId,
    title: data.title,
    body: data.body,
    revisionId: data.revisionId,
    extractedText,
  };
}

/**
 * Create a new Google Doc and optionally insert initial text content
 */
export async function createGoogleDoc(title: string, initialContent?: string): Promise<GoogleDocDetail> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('AUTH_REQUIRED: Please sign in with Google to create documents.');
  }

  const res = await fetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title: title || 'Untitled Document' }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to create document (${res.status})`);
  }

  const created = await res.json();
  const documentId = created.documentId;

  if (initialContent) {
    await appendTextToGoogleDoc(documentId, initialContent);
  }

  return getGoogleDoc(documentId);
}

/**
 * Append or insert text into a Google Document
 */
export async function appendTextToGoogleDoc(documentId: string, text: string): Promise<any> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('AUTH_REQUIRED: Please sign in with Google.');
  }

  const url = `https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [
        {
          insertText: {
            location: { index: 1 },
            text: text.endsWith('\n') ? text : text + '\n\n',
          },
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to update document text (${res.status})`);
  }

  return res.json();
}

/**
 * Delete a Google Doc file from Google Drive.
 * CRITICAL: Must be confirmed by user in UI.
 */
export async function deleteGoogleDoc(documentId: string): Promise<boolean> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('AUTH_REQUIRED: Please sign in with Google.');
  }

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${documentId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok && res.status !== 204 && res.status !== 200) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to delete document (${res.status})`);
  }

  return true;
}
