/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Send, 
  Inbox, 
  Trash2, 
  RefreshCw, 
  Plus, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  User, 
  Sparkles, 
  X, 
  Loader2,
  Calendar,
  Clock,
  ArrowRight,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { GoogleSignInButton } from './GoogleSignInButton';
import { subscribeAuth } from '@/services/googleAuth';
import { 
  listGmailMessages, 
  getGmailMessage, 
  sendGmailMessage, 
  deleteGmailMessage,
  createGmailDraft,
  GmailMessageSummary,
  GmailFullMessage
} from '@/services/googleGmail';
import { MOCK_DB } from '@/services/gemini';

interface GmailViewProps {
  onAction?: (msg?: string) => void;
}

export const GmailView: React.FC<GmailViewProps> = ({ onAction }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [messages, setMessages] = useState<GmailMessageSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<GmailFullMessage | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Compose State
  const [showCompose, setShowCompose] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Destructive Confirmation Modal State (MANDATORY REQUIREMENT)
  const [confirmSendModal, setConfirmSendModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    return subscribeAuth((u, t) => {
      setUser(u);
      setToken(t);
    });
  }, []);

  useEffect(() => {
    loadEmails();
  }, [token]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadEmails = async (query = searchQuery) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      if (token) {
        const live = await listGmailMessages(query);
        setMessages(live);
      } else {
        // Sample preview messages for customer operations
        setMessages([
          {
            id: 'sample_1',
            threadId: 't_1',
            subject: 'Order #38290 Delayed Shipping Infiltration',
            from: 'Maria Santos <m.santos@exemplo.com.br>',
            date: 'Today, 10:14 AM',
            snippet: 'Hello, my order for the espresso machine was supposed to arrive yesterday in São Paulo...',
            unread: true,
          },
          {
            id: 'sample_2',
            threadId: 't_2',
            subject: 'Refund Confirmation Request for Damaged Package',
            from: 'Carlos Ferreira <carlos.f@empresa.com>',
            date: 'Yesterday, 4:30 PM',
            snippet: 'The package arrived damaged. Could you please process a refund or replacement?',
            unread: false,
          },
          {
            id: 'sample_3',
            threadId: 't_3',
            subject: 'Supplier Restock Notice - Electronics Q4',
            from: 'Logistics Partner <dispatch@carrier-log.com>',
            date: 'Sep 27, 2026',
            snippet: 'New inventory arriving at the main distribution hub next Tuesday morning...',
            unread: false,
          }
        ]);
      }
    } catch (err: any) {
      if (!err.message?.includes('AUTH_REQUIRED')) {
        setErrorMsg(err.message || 'Failed to load emails');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectMessage = async (msg: GmailMessageSummary) => {
    setSelectedMessageId(msg.id);
    setIsLoadingDetail(true);
    try {
      if (token && !msg.id.startsWith('sample_')) {
        const full = await getGmailMessage(msg.id);
        setSelectedDetail(full);
      } else {
        setSelectedDetail({
          ...msg,
          bodyText: msg.snippet + '\n\nWe appreciate your prompt attention to this matter.\n\nBest regards,\nCustomer Operations'
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load email details');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Step 1: User clicks "Send Email" button -> opens explicit confirmation modal
  const handleInitiateSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTo.trim() || !composeSubject.trim()) return;
    setConfirmSendModal(true);
  };

  // Step 2: User explicitly confirms sending email
  const handleConfirmSend = async () => {
    setIsSending(true);
    setConfirmSendModal(false);
    try {
      if (token) {
        await sendGmailMessage(composeTo, composeSubject, composeBody);
        showToast(`Email sent to ${composeTo}!`);
      } else {
        MOCK_DB.emails.unshift({ to: composeTo, subject: composeSubject, body: composeBody, date: new Date().toISOString() });
        showToast(`Draft sent in local workspace! (Sign in to send via live Gmail)`);
      }
      setShowCompose(false);
      setComposeTo('');
      setComposeSubject('');
      setComposeBody('');
      loadEmails();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send email');
    } finally {
      setIsSending(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      if (token && !deleteTargetId.startsWith('sample_')) {
        await deleteGmailMessage(deleteTargetId);
      }
      setMessages(prev => prev.filter(m => m.id !== deleteTargetId));
      if (selectedMessageId === deleteTargetId) {
        setSelectedMessageId(null);
        setSelectedDetail(null);
      }
      showToast('Email message deleted.');
      setDeleteTargetId(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete message.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAiDraftReply = () => {
    if (!selectedDetail) return;
    const prompt = `Draft a professional customer service email response to "${selectedDetail.from}" regarding "${selectedDetail.subject}". The customer said: "${selectedDetail.bodyText}". Offer an appropriate solution or refund status.`;
    if (onAction) {
      onAction(prompt);
    }
  };

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
            <Mail className="text-[var(--ui-accent-text)]" size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[var(--ui-text)] tracking-tight flex items-center gap-2">
              Gmail Inbox & Operations
              {token && (
                <span className="text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </span>
              )}
            </h1>
            <p className="text-xs text-[var(--ui-muted)]">
              Read customer queries, draft responses, and send emails via Gmail.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => loadEmails()}
            disabled={isLoading}
            className="p-2 text-[var(--ui-muted)] hover:text-[var(--ui-text)] bg-[var(--ui-bg)] hover:bg-[var(--ui-soft)] rounded-full border border-[var(--ui-border)] transition-all"
            title="Refresh emails"
          >
            <RefreshCw size={15} className={cn(isLoading && "animate-spin")} />
          </button>

          <button
            onClick={() => setShowCompose(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[var(--ui-primary)] hover:brightness-95 text-[var(--ui-primary-ink)] rounded-full text-xs font-semibold transition-all shadow-xs cursor-pointer"
          >
            <Plus size={14} />
            Compose Email
          </button>
        </div>
      </header>

      {/* Search Bar & Banner */}
      <div className="px-6 pt-3 pb-2 border-b border-[var(--ui-border)] flex items-center gap-3 bg-[var(--ui-bg)]">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ui-muted)]" />
          <input
            type="text"
            placeholder="Search emails by sender or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadEmails()}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[var(--ui-surface)] border border-[var(--ui-border)] rounded-full focus:outline-hidden focus:ring-2 focus:ring-[var(--ui-accent)]"
          />
        </div>
        <span className="text-[11px] text-[var(--ui-muted)] font-medium">
          {messages.length} messages
        </span>
      </div>

      {/* Main split */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Email List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[var(--ui-border)]">
          {messages.length === 0 && !isLoading ? (
            <div className="p-12 text-center text-[var(--ui-muted)] space-y-2">
              <Inbox size={36} className="mx-auto text-[var(--ui-muted)]" />
              <p className="text-xs font-medium text-[var(--ui-muted)]">No emails found</p>
            </div>
          ) : (
            messages.map((m) => {
              const isSelected = selectedMessageId === m.id;
              return (
                <div
                  key={m.id}
                  onClick={() => handleSelectMessage(m)}
                  className={cn(
                    "p-4 flex items-start gap-3 cursor-pointer transition-colors relative group",
                    isSelected ? "bg-[var(--ui-soft)]" : "hover:bg-[var(--ui-bg)]",
                    m.unread && "font-semibold text-[var(--ui-text)]"
                  )}
                >
                  <div className={cn(
                    "w-2 h-2 rounded-full mt-2 shrink-0",
                    m.unread ? "bg-[var(--ui-soft)]0" : "bg-transparent"
                  )} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-[var(--ui-text)] truncate font-semibold">
                        {m.from || 'Unknown Sender'}
                      </span>
                      <span className="text-[10px] text-[var(--ui-muted)] shrink-0 font-normal">
                        {m.date}
                      </span>
                    </div>

                    <div className="text-xs text-[var(--ui-text)] font-medium truncate mt-0.5">
                      {m.subject}
                    </div>

                    <p className="text-[11px] text-[var(--ui-muted)] line-clamp-1 mt-1 font-normal">
                      {m.snippet}
                    </p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTargetId(m.id);
                    }}
                    title="Delete message"
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-[var(--ui-muted)] hover:text-red-600 rounded-lg hover:bg-[var(--ui-soft)] transition-all shrink-0"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Email Reading Panel */}
        <div className={cn(
          "w-full md:w-[460px] border-t md:border-t-0 md:border-l border-[var(--ui-border)] bg-[var(--ui-bg)] flex flex-col shrink-0 overflow-y-auto",
          !selectedMessageId && "hidden md:flex"
        )}>
          {selectedDetail ? (
            <div className="p-6 flex flex-col h-full space-y-4">
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-[var(--ui-border)]">
                <div>
                  <h2 className="text-sm font-bold text-[var(--ui-text)] leading-snug">
                    {selectedDetail.subject}
                  </h2>
                  <div className="text-xs text-[var(--ui-muted)] mt-1">
                    From: <span className="font-semibold text-[var(--ui-text)]">{selectedDetail.from}</span>
                  </div>
                  <div className="text-[10px] text-[var(--ui-muted)] mt-0.5">
                    {selectedDetail.date}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedMessageId(null);
                    setSelectedDetail(null);
                  }}
                  className="p-1 text-[var(--ui-muted)] hover:text-[var(--ui-text)] rounded-full hover:bg-[var(--ui-soft)]"
                >
                  <X size={15} />
                </button>
              </div>

              {/* AI Reply Quick Action */}
              <div className="p-3 rounded-2xl bg-gradient-to-r from-[var(--ui-accent)] to-[var(--ui-lilac)] text-[var(--ui-accent-ink)] flex items-center justify-between shadow-xs">
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold flex items-center gap-1.5">
                    <Sparkles size={13} />
                    Agent Draft Reply
                  </div>
                  <div className="text-[10px] text-[var(--ui-accent-ink)]">
                    Generate an operational response in Agent Chat
                  </div>
                </div>
                <button
                  onClick={handleAiDraftReply}
                  className="px-3 py-1 bg-[var(--ui-surface)] text-[var(--ui-accent-text)] rounded-full text-xs font-bold hover:bg-[var(--ui-soft)] transition-all cursor-pointer shrink-0"
                >
                  Draft
                </button>
              </div>

              {/* Email Content Body */}
              <div className="flex-1 bg-[var(--ui-surface)] p-4 rounded-2xl border border-[var(--ui-border)] text-xs text-[var(--ui-text)] leading-relaxed overflow-y-auto whitespace-pre-wrap font-sans shadow-xs">
                {selectedDetail.bodyText}
              </div>

              {/* Quick reply button */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  onClick={() => {
                    setComposeTo(selectedDetail.from || '');
                    setComposeSubject(`Re: ${selectedDetail.subject}`);
                    setShowCompose(true);
                  }}
                  className="px-4 py-2 bg-[var(--ui-primary)] hover:brightness-95 text-[var(--ui-primary-ink)] rounded-full text-xs font-medium transition-all shadow-xs flex items-center gap-1.5"
                >
                  <Send size={12} />
                  Reply to Customer
                </button>

                <button
                  onClick={() => setDeleteTargetId(selectedDetail.id)}
                  className="p-2 text-[var(--ui-muted)] hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-[var(--ui-muted)] space-y-2">
              <Mail size={32} className="text-[var(--ui-muted)]" />
              <p className="text-xs font-semibold text-[var(--ui-muted)]">Select an email to read</p>
              <p className="text-[11px] text-[var(--ui-muted)] max-w-[200px]">
                Click on any incoming customer query or order message to inspect details.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* COMPOSE MODAL */}
      <AnimatePresence>
        {showCompose && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--ui-surface)] rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[var(--ui-border)] flex flex-col space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[var(--ui-border)]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[var(--ui-soft)] text-[var(--ui-accent-text)] flex items-center justify-center">
                    <Mail size={16} />
                  </div>
                  <h3 className="font-bold text-sm text-[var(--ui-text)]">New Message</h3>
                </div>
                <button onClick={() => setShowCompose(false)} className="text-[var(--ui-muted)] hover:text-[var(--ui-text)] p-1">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleInitiateSend} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-[var(--ui-text)] block mb-1">To</label>
                  <input
                    type="email"
                    required
                    placeholder="customer@example.com"
                    value={composeTo}
                    onChange={(e) => setComposeTo(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-[var(--ui-accent)]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[var(--ui-text)] block mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    placeholder="Order Update / Refund Confirmation"
                    value={composeSubject}
                    onChange={(e) => setComposeSubject(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-[var(--ui-accent)] font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[var(--ui-text)] block mb-1">Message Body</label>
                  <textarea
                    rows={6}
                    required
                    placeholder="Write your email message..."
                    value={composeBody}
                    onChange={(e) => setComposeBody(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-[var(--ui-accent)] leading-relaxed font-sans"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCompose(false)}
                    className="px-4 py-2 text-xs font-medium text-[var(--ui-muted)] hover:bg-[var(--ui-soft)] rounded-full transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-5 py-2 bg-[var(--ui-primary)] hover:brightness-95 text-[var(--ui-primary-ink)] rounded-full text-xs font-semibold shadow-xs transition-all cursor-pointer"
                  >
                    <Send size={13} />
                    Send Email...
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MANDATORY CONFIRMATION DIALOG FOR SENDING EMAIL */}
      <AnimatePresence>
        {confirmSendModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--ui-surface)] rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-[var(--ui-border)] space-y-4"
            >
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
                <ShieldAlert size={20} />
              </div>

              <div>
                <h3 className="font-bold text-sm text-[var(--ui-text)]">Confirm Sending Email?</h3>
                <p className="text-xs text-[var(--ui-muted)] mt-1.5 leading-relaxed">
                  You are about to send an email on behalf of your Google account to:
                  <br />
                  <span className="font-semibold text-[var(--ui-text)]">{composeTo}</span>
                  <br />
                  Subject: <span className="font-semibold text-[var(--ui-text)]">"{composeSubject}"</span>
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmSendModal(false)}
                  disabled={isSending}
                  className="px-4 py-2 text-xs font-medium text-[var(--ui-muted)] hover:bg-[var(--ui-soft)] rounded-full transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSend}
                  disabled={isSending}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[var(--ui-primary)] hover:brightness-95 disabled:opacity-50 text-[var(--ui-primary-ink)] rounded-full text-xs font-semibold shadow-xs transition-all cursor-pointer"
                >
                  {isSending ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Confirm & Send'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MANDATORY CONFIRMATION DIALOG FOR DELETING EMAIL */}
      <AnimatePresence>
        {deleteTargetId && (
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
                <h3 className="font-bold text-sm text-[var(--ui-text)]">Delete Email Message?</h3>
                <p className="text-xs text-[var(--ui-muted)] mt-1 leading-relaxed">
                  Are you sure you want to permanently delete this email from your Gmail mailbox? This action cannot be undone.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteTargetId(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 text-xs font-medium text-[var(--ui-muted)] hover:bg-[var(--ui-soft)] rounded-full transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
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
    </div>
  );
};
