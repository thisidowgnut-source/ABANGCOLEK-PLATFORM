/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getAccessToken } from './googleAuth';

export interface GoogleMeetSpace {
  name: string;
  meetingUri: string;
  meetingCode?: string;
  activeConference?: {
    conferenceRecord: string;
  };
}

/**
 * Create a new Google Meet space / video meeting room
 */
export async function createGoogleMeetSpace(): Promise<GoogleMeetSpace> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('AUTH_REQUIRED: Please sign in with Google to create a Google Meet space.');
  }

  const res = await fetch('https://meet.googleapis.com/v2/spaces', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to create Google Meet space (${res.status})`);
  }

  return res.json();
}
