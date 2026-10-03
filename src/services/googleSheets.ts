/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getAccessToken } from './googleAuth';

export interface GoogleSheetSummary {
  id: string;
  name: string;
  modifiedTime?: string;
  webViewLink?: string;
}

/**
 * List Google Sheets from Google Drive
 */
export async function listGoogleSheets(): Promise<GoogleSheetSummary[]> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('AUTH_REQUIRED: Please sign in with Google to view sheets.');
  }

  const query = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
  const fields = encodeURIComponent('files(id,name,modifiedTime,webViewLink)');
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&orderBy=modifiedTime%20desc&pageSize=30`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to fetch spreadsheets (${res.status})`);
  }

  const data = await res.json();
  return data.files || [];
}

/**
 * Create a new Google Spreadsheet and populate initial values
 */
export async function createGoogleSpreadsheet(
  title: string,
  headers: string[],
  rows: (string | number)[][] = []
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('AUTH_REQUIRED: Please sign in with Google to create spreadsheets.');
  }

  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: { title: title || 'Retail Operations Export' },
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to create spreadsheet (${createRes.status})`);
  }

  const created = await createRes.json();
  const spreadsheetId = created.spreadsheetId;

  // Insert header and rows into the default first sheet
  const values = [headers, ...rows];
  if (values.length > 0) {
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values }),
      }
    );
  }

  return {
    spreadsheetId,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
  };
}

/**
 * Read values from a spreadsheet
 */
export async function readSpreadsheetValues(spreadsheetId: string, range = 'A1:Z50'): Promise<any[][]> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('AUTH_REQUIRED: Please sign in with Google to read spreadsheet.');
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to read sheet (${res.status})`);
  }

  const data = await res.json();
  return data.values || [];
}

/**
 * Delete a spreadsheet from Drive.
 * CRITICAL: Must be confirmed by user in UI.
 */
export async function deleteSpreadsheet(spreadsheetId: string): Promise<boolean> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('AUTH_REQUIRED: Please sign in with Google.');
  }

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${spreadsheetId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok && res.status !== 204 && res.status !== 200) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to delete spreadsheet (${res.status})`);
  }

  return true;
}
