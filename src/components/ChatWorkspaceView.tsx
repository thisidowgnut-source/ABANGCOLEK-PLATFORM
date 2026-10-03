/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  Send, 
  Hash, 
  Users, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Loader2,
  ShieldAlert
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { subscribeAuth } from '@/services/googleAuth';
import { 
  listChatSpaces, 
  listChatMessages, 
  sendChatMessage, 
  GoogleChatSpace, 
  GoogleChatMessage 
} from '@/services/googleChat';

interface ChatWorkspaceViewProps {
  onAction?: (msg?: string) => void;
}

export const ChatWorkspaceView: React.FC<ChatWorkspaceViewProps> = ({ onAction }) => {
  const [token, setToken] = useState<string | null>(null);
  const [spaces, setSpaces] = useState<GoogleChatSpace[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<GoogleChatSpace | null>(null);
  const [messages, setMessages] = useState<GoogleChatMessage[]>([]);
  const [isLoadingSpaces, setIsLoadingSpaces] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Mandatory Confirmation Dialog for sending message
  const [showConfirmSend, setShowConfirmSend] = useState(false);

  useEffect(() => {
    return subscribeAuth((_, t) => {
      setToken(t);
    });
  }, []);

  useEffect(() => {
    loadSpaces();
  }, [token]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadSpaces = async () => {
    setIsLoadingSpaces(true);
    setErrorMsg(null);
    try {
      if (token) {
        const live = await listChatSpaces();
        setSpaces(live);
        if (live.length > 0 && !selectedSpace) {
          handleSelectSpace(live[0]);
        }
      } else {
        const sampleSpaces: GoogleChatSpace[] = [
          { name: 'spaces/operations_hub', displayName: 'Retail Operations & Fleet Hub', type: 'SPACE' },
          { name: 'spaces/customer_support', displayName: 'Escalated Customer Disputes', type: 'SPACE' }
        ];
        setSpaces(sampleSpaces);
        if (!selectedSpace) {
          handleSelectSpace(sampleSpaces[0]);
        }
      }
    } catch (err: any) {
      if (!err.message?.includes('AUTH_REQUIRED')) {
        setErrorMsg(err.message || 'Failed to list Google Chat spaces');
      }
    } finally {
      setIsLoadingSpaces(false);
    }
  };

  const handleSelectSpace = async (space: GoogleChatSpace) => {
    setSelectedSpace(space);
    setIsLoadingMessages(true);
    try {
      if (token && !space.name.startsWith('spaces/operations_hub')) {
        const liveMsgs = await listChatMessages(space.name);
        setMessages(liveMsgs);
      } else {
        setMessages([
          {
            name: 'msg_1',
            text: '⚠️ Carrier alert: 5 delayed shipments detected in São Paulo distribution hub.',
            createTime: new Date(Date.now() - 3600000).toISOString(),
            sender: { displayName: 'Retail Agent Bot' }
          },
          {
            name: 'msg_2',
            text: 'Refund processed for order #38290. Customer notified via Gmail.',
            createTime: new Date(Date.now() - 1800000).toISOString(),
            sender: { displayName: 'Support Lead' }
          }
        ]);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch messages');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleInitiateSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedSpace) return;
    setShowConfirmSend(true);
  };

  const handleConfirmSend = async () => {
    if (!selectedSpace || !inputText.trim()) return;
    setIsSending(true);
    setShowConfirmSend(false);
    try {
      if (token && !selectedSpace.name.startsWith('spaces/operations_hub')) {
        const sent = await sendChatMessage(selectedSpace.name, inputText);
        setMessages(prev => [...prev, sent]);
      } else {
        const localMsg: GoogleChatMessage = {
          name: 'msg_' + Date.now(),
          text: inputText,
          createTime: new Date().toISOString(),
          sender: { displayName: 'You' }
        };
        setMessages(prev => [...prev, localMsg]);
      }
      showToast('Message sent to Google Chat space!');
      setInputText('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send message');
    } finally {
      setIsSending(false);
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
            <MessageSquare className="text-[var(--ui-accent-text)]" size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[var(--ui-text)] tracking-tight flex items-center gap-2">
              Google Chat Spaces
              {token && (
                <span className="text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Synced
                </span>
              )}
            </h1>
            <p className="text-xs text-[var(--ui-muted)]">
              Operations channels, customer issue escalation, and real-time team alerts.
            </p>
          </div>
        </div>

        <button
          onClick={() => loadSpaces()}
          disabled={isLoadingSpaces}
          className="p-2 text-[var(--ui-muted)] hover:text-[var(--ui-text)] bg-[var(--ui-bg)] hover:bg-[var(--ui-soft)] rounded-full border border-[var(--ui-border)] transition-all"
          title="Refresh chat spaces"
        >
          <RefreshCw size={15} className={cn(isLoadingSpaces && "animate-spin")} />
        </button>
      </header>

      {/* Main split */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Spaces directory */}
        <div className="w-full md:w-[280px] border-b md:border-b-0 md:border-r border-[var(--ui-border)] p-4 space-y-2 overflow-y-auto shrink-0 bg-[var(--ui-bg)]">
          <span className="text-xs font-bold text-[var(--ui-text)] uppercase tracking-wider block px-2 mb-2">
            Chat Spaces ({spaces.length})
          </span>

          {spaces.map((space) => {
            const isSelected = selectedSpace?.name === space.name;
            return (
              <button
                key={space.name}
                onClick={() => handleSelectSpace(space)}
                className={cn(
                  "w-full text-left p-3 rounded-2xl border transition-all flex items-center gap-2.5",
                  isSelected
                    ? "bg-[var(--ui-soft)] border-[var(--ui-border)] text-[var(--ui-text)] font-semibold shadow-xs"
                    : "bg-[var(--ui-surface)] hover:bg-[var(--ui-bg)] border-[var(--ui-border)] text-[var(--ui-text)]"
                )}
              >
                <Hash size={15} className={isSelected ? "text-[var(--ui-accent-text)]" : "text-[var(--ui-muted)]"} />
                <span className="text-xs truncate">{space.displayName || space.name}</span>
              </button>
            );
          })}
        </div>

        {/* Message Thread */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[var(--ui-surface)]">
          <div className="px-6 py-3 border-b border-[var(--ui-border)] flex items-center justify-between text-xs bg-[var(--ui-bg)]">
            <span className="font-bold text-[var(--ui-text)] flex items-center gap-1.5">
              <Hash size={14} className="text-[var(--ui-accent-text)]" />
              {selectedSpace?.displayName || 'Chat Thread'}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-3.5">
            {messages.map((m, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-[var(--ui-bg)] border border-[var(--ui-border)] space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-xs text-[var(--ui-text)]">
                    {m.sender?.displayName || 'Team Member'}
                  </span>
                  <span className="text-[10px] text-[var(--ui-muted)]">
                    {m.createTime ? new Date(m.createTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                  </span>
                </div>
                <p className="text-xs text-[var(--ui-text)] leading-relaxed whitespace-pre-wrap">
                  {m.text}
                </p>
              </div>
            ))}
          </div>

          {/* Input Box */}
          <form onSubmit={handleInitiateSend} className="p-4 border-t border-[var(--ui-border)] bg-[var(--ui-surface)] flex gap-2">
            <input
              type="text"
              placeholder="Post a message to this Google Chat space..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 px-4 py-2 text-xs bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-full focus:outline-hidden focus:ring-2 focus:ring-[var(--ui-accent)] font-sans"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="px-4 py-2 bg-[var(--ui-primary)] text-[var(--ui-primary-ink)] hover:brightness-95 disabled:opacity-50 rounded-full text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Send size={13} />
              Post Message
            </button>
          </form>
        </div>
      </div>

      {/* MANDATORY CONFIRMATION MODAL FOR SENDING CHAT MESSAGE */}
      <AnimatePresence>
        {showConfirmSend && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--ui-surface)] rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-[var(--ui-border)] space-y-4"
            >
              <div className="w-10 h-10 rounded-2xl bg-[var(--ui-soft)] text-[var(--ui-accent-text)] flex items-center justify-center border border-[var(--ui-border)]">
                <ShieldAlert size={20} />
              </div>

              <div>
                <h3 className="font-bold text-sm text-[var(--ui-text)]">Post Message to Google Chat?</h3>
                <p className="text-xs text-[var(--ui-muted)] mt-1.5 leading-relaxed">
                  You are about to post this message to <span className="font-semibold text-[var(--ui-text)]">"{selectedSpace?.displayName || 'Chat Space'}"</span> on behalf of your Google account:
                  <br />
                  <span className="italic text-[var(--ui-text)] mt-1 block">"{inputText}"</span>
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmSend(false)}
                  disabled={isSending}
                  className="px-4 py-2 text-xs font-medium text-[var(--ui-muted)] hover:bg-[var(--ui-soft)] rounded-full transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSend}
                  disabled={isSending}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[var(--ui-primary)] text-[var(--ui-primary-ink)] hover:brightness-95 disabled:opacity-50 rounded-full text-xs font-semibold shadow-xs transition-all cursor-pointer"
                >
                  {isSending ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      Posting...
                    </>
                  ) : (
                    'Confirm & Post'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
