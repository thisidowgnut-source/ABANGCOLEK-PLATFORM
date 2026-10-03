/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getAccessToken } from './googleAuth';

export interface GmailMessageHeader {
  name: string;
  value: string;
}

export interface GmailMessageSummary {
  id: string;
  threadId: string;
  snippet?: string;
  subject?: string;
  from?: string;
  to?: string;
  date?: string;
  labelIds?: string[];
  unread?: boolean;
}

export interface GmailFullMessage extends GmailMessageSummary {
  bodyText?: string;
}

/**
 * Base64url encode a string or UTF-8 buffer
 */
function toBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Base64url decode a string
 */
function fromBase64Url(str: string): string {
  try {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch (e) {
    return str;
  }
}

/**
 * List recent messages in user's Gmail inbox
 */
export async function listGmailMessages(query?: string, maxResults = 25): Promise<GmailMessageSummary[]> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('AUTH_REQUIRED: Please sign in with Google to read your Gmail messages.');
  }

  const qParam = query ? `&q=${encodeURIComponent(query)}` : '';
  const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}${qParam}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to list emails (${res.status})`);
  }

  const data = await res.json();
  const messagesList: { id: string; threadId: string }[] = data.messages || [];

  // Fetch summaries in parallel (first 15 for snappiness)
  const summaries = await Promise.all(
    messagesList.slice(0, 15).map(async (m) => {
      try {
        const detailRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date&metadataHeaders=To`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!detailRes.ok) return { id: m.id, threadId: m.threadId };
        const detail = await detailRes.json();
        const headers: GmailMessageHeader[] = detail.payload?.headers || [];
        const subject = headers.find(h => h.name.toLowerCase() === 'subject')?.value || '(No Subject)';
        const from = headers.find(h => h.name.toLowerCase() === 'from')?.value || '';
        const to = headers.find(h => h.name.toLowerCase() === 'to')?.value || '';
        const date = headers.find(h => h.name.toLowerCase() === 'date')?.value || '';
        const unread = detail.labelIds?.includes('UNREAD');

        return {
          id: m.id,
          threadId: m.threadId,
          snippet: detail.snippet || '',
          subject,
          from,
          to,
          date,
          labelIds: detail.labelIds || [],
          unread,
        };
      } catch {
        return { id: m.id, threadId: m.threadId, subject: 'Email message' };
      }
    })
  );

  return summaries;
}

/**
 * Fetch full body of a Gmail message
 */
export async function getGmailMessage(id: string): Promise<GmailFullMessage> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('AUTH_REQUIRED: Please sign in with Google to read this message.');
  }

  const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to fetch message (${res.status})`);
  }

  const data = await res.json();
  const headers: GmailMessageHeader[] = data.payload?.headers || [];
  const subject = headers.find(h => h.name.toLowerCase() === 'subject')?.value || '(No Subject)';
  const from = headers.find(h => h.name.toLowerCase() === 'from')?.value || '';
  const to = headers.find(h => h.name.toLowerCase() === 'to')?.value || '';
  const date = headers.find(h => h.name.toLowerCase() === 'date')?.value || '';

  // Extract body text
  let bodyText = '';
  if (data.payload?.body?.data) {
    bodyText = fromBase64Url(data.payload.body.data);
  } else if (data.payload?.parts) {
    // Find text/plain part or text/html part
    const textPart = data.payload.parts.find((p: any) => p.mimeType === 'text/plain') ||
                     data.payload.parts.find((p: any) => p.mimeType === 'text/html') ||
                     data.payload.parts[0];
    if (textPart?.body?.data) {
      bodyText = fromBase64Url(textPart.body.data);
    }
  }

  return {
    id: data.id,
    threadId: data.threadId,
    snippet: data.snippet,
    subject,
    from,
    to,
    date,
    labelIds: data.labelIds,
    bodyText: bodyText || data.snippet,
  };
}

/**
 * Send an email via Gmail API.
 * CRITICAL: Must be preceded by explicit user confirmation in the UI.
 */
export async function sendGmailMessage(to: string, subject: string, bodyText: string): Promise<{ id: string }> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('AUTH_REQUIRED: Please sign in with Google to send emails.');
  }

  const rawMessage = [
    `To: ${to}`,
    `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
    '',
    bodyText,
  ].join('\r\n');

  const encoded = toBase64Url(rawMessage);

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: encoded }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to send email (${res.status})`);
  }

  return res.json();
}

/**
 * Create a draft message in Gmail
 */
export async function createGmailDraft(to: string, subject: string, bodyText: string): Promise<any> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('AUTH_REQUIRED: Please sign in with Google.');
  }

  const rawMessage = [
    `To: ${to}`,
    `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
    '',
    bodyText,
  ].join('\r\n');

  const encoded = toBase64Url(rawMessage);

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message: { raw: encoded } }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to create draft (${res.status})`);
  }

  return res.json();
}

/**
 * Delete a message from Gmail.
 * CRITICAL: Must be preceded by explicit user confirmation in the UI.
 */
export async function deleteGmailMessage(id: string): Promise<boolean> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('AUTH_REQUIRED: Please sign in with Google.');
  }

  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok && res.status !== 204 && res.status !== 200) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to delete message (${res.status})`);
  }

  return true;
}
