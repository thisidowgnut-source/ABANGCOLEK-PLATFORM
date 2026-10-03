/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckSquare, 
  Square, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Loader2, 
  ListTodo,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { subscribeAuth } from '@/services/googleAuth';
import { 
  listGoogleTasks, 
  createGoogleTask, 
  updateGoogleTaskStatus, 
  deleteGoogleTask,
  clearCompletedTasks,
  GoogleTaskItem
} from '@/services/googleTasks';
import { MOCK_DB } from '@/services/gemini';

interface TasksViewProps {
  onAction?: (msg?: string) => void;
}

export const TasksView: React.FC<TasksViewProps> = ({ onAction }) => {
  const [token, setToken] = useState<string | null>(null);
  const [tasks, setTasks] = useState<GoogleTaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskNotes, setNewTaskNotes] = useState('');
  const [newTaskDue, setNewTaskDue] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Destructive Confirmation States (MANDATORY REQUIREMENT)
  const [deleteTargetTask, setDeleteTargetTask] = useState<GoogleTaskItem | null>(null);
  const [confirmClearCompleted, setConfirmClearCompleted] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    return subscribeAuth((_, t) => {
      setToken(t);
    });
  }, []);

  useEffect(() => {
    loadTasks();
  }, [token]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadTasks = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      if (token) {
        const live = await listGoogleTasks();
        setTasks(live);
      } else {
        // Pre-seeded retail operational tasks
        setTasks([
          {
            id: 'task_1',
            title: 'Investigate 5 delayed orders in São Paulo logistics hub',
            notes: 'Check carrier delivery tracking and issue refunds if delay exceeds 3 days.',
            status: 'needsAction',
            due: new Date(Date.now() + 86400000).toISOString(),
          },
          {
            id: 'task_2',
            title: 'Follow up with Maria Santos regarding damaged espresso machine',
            notes: 'Customer submitted return request #49102.',
            status: 'needsAction',
            due: new Date(Date.now() + 172800000).toISOString(),
          },
          {
            id: 'task_3',
            title: 'Publish Q4 Customer Satisfaction Google Form survey',
            notes: 'Share link via email blast and monitor CSAT ratings.',
            status: 'completed',
          }
        ]);
      }
    } catch (err: any) {
      if (!err.message?.includes('AUTH_REQUIRED')) {
        setErrorMsg(err.message || 'Failed to fetch tasks');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleTask = async (task: GoogleTaskItem) => {
    const newStatus = task.status === 'completed' ? 'needsAction' : 'completed';
    // Optimistic UI update
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));

    try {
      if (token && !task.id.startsWith('task_')) {
        await updateGoogleTaskStatus('@default', task.id, newStatus);
      }
      showToast(newStatus === 'completed' ? 'Task marked complete!' : 'Task reopened.');
    } catch (err: any) {
      // Revert on failure
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: task.status } : t));
      setErrorMsg(err.message || 'Failed to update task');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setIsSubmitting(true);
    try {
      const dueIso = newTaskDue ? new Date(newTaskDue).toISOString() : undefined;
      if (token) {
        const created = await createGoogleTask('@default', newTaskTitle, newTaskNotes, dueIso);
        setTasks(prev => [created, ...prev]);
        showToast(`Task added to Google Tasks!`);
      } else {
        const localTask: GoogleTaskItem = {
          id: 'task_' + Date.now(),
          title: newTaskTitle,
          notes: newTaskNotes,
          due: dueIso,
          status: 'needsAction'
        };
        setTasks(prev => [localTask, ...prev]);
        MOCK_DB.tasks.unshift(localTask);
        showToast('Task added to workspace!');
      }
      setShowAddModal(false);
      setNewTaskTitle('');
      setNewTaskNotes('');
      setNewTaskDue('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExecuteDelete = async () => {
    if (!deleteTargetTask) return;
    setIsDeleting(true);
    try {
      if (token && !deleteTargetTask.id.startsWith('task_')) {
        await deleteGoogleTask('@default', deleteTargetTask.id);
      }
      setTasks(prev => prev.filter(t => t.id !== deleteTargetTask.id));
      showToast('Task deleted from Google Tasks.');
      setDeleteTargetTask(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete task.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExecuteClearCompleted = async () => {
    setIsDeleting(true);
    try {
      if (token) {
        await clearCompletedTasks('@default');
      }
      setTasks(prev => prev.filter(t => t.status !== 'completed'));
      showToast('Cleared completed tasks.');
      setConfirmClearCompleted(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to clear completed tasks.');
    } finally {
      setIsDeleting(false);
    }
  };

  const activeCount = tasks.filter(t => t.status === 'needsAction').length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;

  return (
    <div className="flex flex-col h-full w-full bg-[var(--ui-surface)] rounded-[32px] border border-[var(--ui-border)] shadow-[0_4px_24px_rgba(0,0,0,0.02)] overflow-hidden relative">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-[var(--ui-inverse)] text-white px-5 py-2.5 rounded-full text-xs font-medium shadow-lg flex items-center gap-2 border border-[var(--ui-border)]"
          >
            <CheckCircle2 size={15} className="text-emerald-400" />
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="px-6 py-4 border-b border-[var(--ui-border)] flex flex-wrap items-center justify-between gap-4 shrink-0 bg-[var(--ui-surface)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[var(--ui-soft)] flex items-center justify-center border border-[var(--ui-border)] shadow-xs">
            <CheckSquare className="text-[var(--ui-accent-text)]" size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[var(--ui-text)] tracking-tight flex items-center gap-2">
              Google Tasks
              {token && (
                <span className="text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Synced
                </span>
              )}
            </h1>
            <p className="text-xs text-[var(--ui-muted)]">
              Track operational to-dos, order investigations, and follow-ups.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {completedCount > 0 && (
            <button
              onClick={() => setConfirmClearCompleted(true)}
              className="text-xs text-[var(--ui-muted)] hover:text-red-600 font-medium px-3 py-1.5 rounded-full hover:bg-[var(--ui-soft)] transition-colors"
            >
              Clear Completed ({completedCount})
            </button>
          )}

          <button
            onClick={() => loadTasks()}
            disabled={isLoading}
            className="p-2 text-[var(--ui-muted)] hover:text-[var(--ui-text)] bg-[var(--ui-bg)] hover:bg-[var(--ui-soft)] rounded-full border border-[var(--ui-border)] transition-all"
            title="Refresh tasks"
          >
            <RefreshCw size={15} className={cn(isLoading && "animate-spin")} />
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[var(--ui-primary)] text-[var(--ui-primary-ink)] hover:brightness-95 rounded-full text-xs font-semibold transition-all shadow-xs cursor-pointer"
          >
            <Plus size={14} />
            Add Task
          </button>
        </div>
      </header>

      {/* Main Task List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {tasks.length === 0 && !isLoading ? (
          <div className="p-12 text-center text-[var(--ui-muted)] space-y-2">
            <ListTodo size={36} className="mx-auto text-[var(--ui-muted)]" />
            <p className="text-xs font-semibold text-[var(--ui-muted)]">All caught up!</p>
            <p className="text-[11px] text-[var(--ui-muted)]">No pending operational tasks.</p>
          </div>
        ) : (
          tasks.map((task) => {
            const isCompleted = task.status === 'completed';
            return (
              <div
                key={task.id}
                className={cn(
                  "p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 group",
                  isCompleted 
                    ? "bg-[var(--ui-bg)] border-[var(--ui-border)] opacity-60" 
                    : "bg-[var(--ui-surface)] hover:bg-[var(--ui-bg)] border-[var(--ui-border)] shadow-xs"
                )}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <button
                    onClick={() => handleToggleTask(task)}
                    className="mt-0.5 text-[var(--ui-muted)] hover:text-[var(--ui-accent-text)] transition-colors shrink-0"
                  >
                    {isCompleted ? (
                      <CheckCircle2 size={18} className="text-emerald-500" />
                    ) : (
                      <Square size={18} />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <span className={cn(
                      "text-xs font-semibold text-[var(--ui-text)] block",
                      isCompleted && "line-through text-[var(--ui-muted)] font-normal"
                    )}>
                      {task.title}
                    </span>

                    {task.notes && (
                      <p className="text-[11px] text-[var(--ui-muted)] mt-1 line-clamp-2">
                        {task.notes}
                      </p>
                    )}

                    {task.due && (
                      <div className="flex items-center gap-1.5 text-[10px] text-[var(--ui-muted)] mt-2 font-medium">
                        <Calendar size={11} />
                        <span>Due: {new Date(task.due).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setDeleteTargetTask(task)}
                  title="Delete task"
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-[var(--ui-muted)] hover:text-red-600 rounded-lg hover:bg-[var(--ui-soft)] transition-all shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* ADD TASK MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--ui-surface)] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[var(--ui-border)] flex flex-col space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[var(--ui-border)]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[var(--ui-soft)] text-[var(--ui-accent-text)] flex items-center justify-center">
                    <CheckSquare size={16} />
                  </div>
                  <h3 className="font-bold text-sm text-[var(--ui-text)]">Add Google Task</h3>
                </div>
                <button onClick={() => setShowAddModal(false)} className="text-[var(--ui-muted)] hover:text-[var(--ui-text)] p-1">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateTask} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-[var(--ui-text)] block mb-1">Task Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Audit delayed packages in São Paulo hub"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-[var(--ui-accent)] font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[var(--ui-text)] block mb-1">Notes / Instructions</label>
                  <textarea
                    rows={3}
                    placeholder="Add details, customer IDs, or tracking numbers..."
                    value={newTaskNotes}
                    onChange={(e) => setNewTaskNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-[var(--ui-accent)]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[var(--ui-text)] block mb-1">Due Date (Optional)</label>
                  <input
                    type="date"
                    value={newTaskDue}
                    onChange={(e) => setNewTaskDue(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-[var(--ui-accent)] text-[var(--ui-text)]"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-xs font-medium text-[var(--ui-muted)] hover:bg-[var(--ui-soft)] rounded-full transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !newTaskTitle.trim()}
                    className="flex items-center gap-1.5 px-5 py-2 bg-[var(--ui-primary)] text-[var(--ui-primary-ink)] hover:brightness-95 disabled:opacity-50 rounded-full text-xs font-semibold shadow-xs transition-all cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save to Google Tasks'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MANDATORY CONFIRMATION MODAL FOR DELETING TASK */}
      <AnimatePresence>
        {deleteTargetTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--ui-surface)] rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-[var(--ui-border)] space-y-4"
            >
              <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center border border-red-100">
                <Trash2 size={20} />
              </div>

              <div>
                <h3 className="font-bold text-sm text-[var(--ui-text)]">Delete Google Task?</h3>
                <p className="text-xs text-[var(--ui-muted)] mt-1 leading-relaxed">
                  Are you sure you want to permanently delete <span className="font-semibold text-[var(--ui-text)]">"{deleteTargetTask.title}"</span>?
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteTargetTask(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 text-xs font-medium text-[var(--ui-muted)] hover:bg-[var(--ui-soft)] rounded-full transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-full text-xs font-semibold shadow-xs transition-all"
                >
                  {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MANDATORY CONFIRMATION MODAL FOR CLEARING COMPLETED TASKS */}
      <AnimatePresence>
        {confirmClearCompleted && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--ui-surface)] rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-[var(--ui-border)] space-y-4"
            >
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
                <Trash2 size={20} />
              </div>

              <div>
                <h3 className="font-bold text-sm text-[var(--ui-text)]">Clear All Completed Tasks?</h3>
                <p className="text-xs text-[var(--ui-muted)] mt-1 leading-relaxed">
                  This will remove all {completedCount} completed tasks from your Google Tasks list.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmClearCompleted(false)}
                  disabled={isDeleting}
                  className="px-4 py-2 text-xs font-medium text-[var(--ui-muted)] hover:bg-[var(--ui-soft)] rounded-full transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteClearCompleted}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-full text-xs font-semibold shadow-xs transition-all"
                >
                  {isDeleting ? 'Clearing...' : 'Clear Completed'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
