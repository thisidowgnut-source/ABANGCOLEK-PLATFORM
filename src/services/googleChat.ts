/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getAccessToken } from './googleAuth';

export interface GoogleChatSpace {
  name: string; // e.g. "spaces/AAAAAAAAAAA"
  displayName?: string;
  type?: 'ROOM' | 'DM' | 'SPACE';
  spaceThreadingState?: string;
}

export interface GoogleChatMessage {
  name: string; // e.g. "spaces/AAAA/messages/BBBB"
  text: string;
  createTime?: string;
  sender?: {
    displayName?: string;
    avatarUrl?: string;
  };
}

/**
 * List spaces user belongs to
 */
export async function listChatSpaces(): Promise<GoogleChatSpace[]> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('AUTH_REQUIRED: Please sign in with Google to view Chat spaces.');
  }

  const res = await fetch('https://chat.googleapis.com/v1/spaces', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to list chat spaces (${res.status})`);
  }

  const data = await res.json();
  return data.spaces || [];
}

/**
 * List messages in a Chat space
 */
export async function listChatMessages(spaceName: string): Promise<GoogleChatMessage[]> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('AUTH_REQUIRED: Please sign in with Google to read messages.');
  }

  const res = await fetch(`https://chat.googleapis.com/v1/${spaceName}/messages?pageSize=30`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to list chat messages (${res.status})`);
  }

  const data = await res.json();
  return data.messages || [];
}

/**
 * Send a message to a Google Chat space.
 * CRITICAL: Must be confirmed by user in UI.
 */
export async function sendChatMessage(spaceName: string, text: string): Promise<GoogleChatMessage> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('AUTH_REQUIRED: Please sign in with Google to send messages.');
  }

  const res = await fetch(`https://chat.googleapis.com/v1/${spaceName}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to send chat message (${res.status})`);
  }

  return res.json();
}
