/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getAccessToken } from './googleAuth';

export interface GoogleTaskList {
  id: string;
  title: string;
  updated?: string;
}

export interface GoogleTaskItem {
  id: string;
  title: string;
  updated?: string;
  notes?: string;
  status: 'needsAction' | 'completed';
  due?: string;
  completed?: string;
}

/**
 * List all task lists for user
 */
export async function listGoogleTaskLists(): Promise<GoogleTaskList[]> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('AUTH_REQUIRED: Please sign in with Google to view your tasks.');
  }

  const res = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to fetch task lists (${res.status})`);
  }

  const data = await res.json();
  return data.items || [];
}

/**
 * List tasks in a specific task list
 */
export async function listGoogleTasks(taskListId = '@default'): Promise<GoogleTaskItem[]> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('AUTH_REQUIRED: Please sign in with Google to view tasks.');
  }

  const url = `https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks?showCompleted=true&showHidden=true`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to fetch tasks (${res.status})`);
  }

  const data = await res.json();
  return data.items || [];
}

/**
 * Create a new task
 */
export async function createGoogleTask(
  taskListId = '@default',
  title: string,
  notes?: string,
  due?: string
): Promise<GoogleTaskItem> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('AUTH_REQUIRED: Please sign in with Google to create tasks.');
  }

  const body: any = { title };
  if (notes) body.notes = notes;
  if (due) body.due = due;

  const url = `https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to create task (${res.status})`);
  }

  return res.json();
}

/**
 * Update task status (complete or needsAction)
 */
export async function updateGoogleTaskStatus(
  taskListId: string,
  taskId: string,
  status: 'needsAction' | 'completed'
): Promise<GoogleTaskItem> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('AUTH_REQUIRED: Please sign in with Google.');
  }

  const url = `https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${taskId}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to update task (${res.status})`);
  }

  return res.json();
}

/**
 * Delete a task.
 * CRITICAL: Must be confirmed by user in UI.
 */
export async function deleteGoogleTask(taskListId: string, taskId: string): Promise<boolean> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('AUTH_REQUIRED: Please sign in with Google.');
  }

  const url = `https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${taskId}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok && res.status !== 204 && res.status !== 200) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to delete task (${res.status})`);
  }

  return true;
}

/**
 * Clear all completed tasks.
 * CRITICAL: Must be confirmed by user in UI.
 */
export async function clearCompletedTasks(taskListId = '@default'): Promise<boolean> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('AUTH_REQUIRED: Please sign in with Google.');
  }

  const url = `https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/clear`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok && res.status !== 204 && res.status !== 200) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to clear completed tasks (${res.status})`);
  }

  return true;
}
