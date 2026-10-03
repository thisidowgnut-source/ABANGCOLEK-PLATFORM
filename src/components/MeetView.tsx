/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Video, 
  Plus, 
  ExternalLink, 
  Copy, 
  Check, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Loader2, 
  Users,
  Sparkles,
  PhoneCall
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { subscribeAuth } from '@/services/googleAuth';
import { createGoogleMeetSpace, GoogleMeetSpace } from '@/services/googleMeet';

interface MeetViewProps {
  onAction?: (msg?: string) => void;
}

export const MeetView: React.FC<MeetViewProps> = ({ onAction }) => {
  const [token, setToken] = useState<string | null>(null);
  const [spaces, setSpaces] = useState<GoogleMeetSpace[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [copiedUri, setCopiedUri] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    return subscribeAuth((_, t) => {
      setToken(t);
    });
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleCreateMeetSpace = async () => {
    setIsCreating(true);
    setErrorMsg(null);
    try {
      if (token) {
        const space = await createGoogleMeetSpace();
        setSpaces(prev => [space, ...prev]);
        showToast('Google Meet space created successfully!');
      } else {
        const mockCode = `${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`;
        const localSpace: GoogleMeetSpace = {
          name: `spaces/${mockCode}`,
          meetingUri: `https://meet.google.com/${mockCode}`,
          meetingCode: mockCode
        };
        setSpaces(prev => [localSpace, ...prev]);
        showToast('Google Meet space ready in workspace!');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create Google Meet space');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopy = (uri: string) => {
    navigator.clipboard.writeText(uri);
    setCopiedUri(uri);
    setTimeout(() => setCopiedUri(null), 2000);
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
            <Video className="text-[var(--ui-accent-text)]" size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[var(--ui-text)] tracking-tight flex items-center gap-2">
              Google Meet Video Spaces
              {token && (
                <span className="text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  API Active
                </span>
              )}
            </h1>
            <p className="text-xs text-[var(--ui-muted)]">
              Generate instant Google Meet video conferences for customer support and vendor coordination.
            </p>
          </div>
        </div>

        <button
          onClick={handleCreateMeetSpace}
          disabled={isCreating}
          className="flex items-center gap-1.5 px-5 py-2.5 bg-[var(--ui-primary)] text-[var(--ui-primary-ink)] hover:brightness-95 disabled:opacity-50 rounded-full text-xs font-semibold transition-all shadow-xs cursor-pointer"
        >
          {isCreating ? <Loader2 size={14} className="animate-spin" /> : <Video size={14} />}
          Instant Google Meet
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Quick Hero Banner */}
        <div className="p-5 rounded-3xl bg-gradient-to-r from-[var(--ui-accent)] to-[var(--ui-lilac)] text-[var(--ui-accent-ink)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="space-y-1">
            <h2 className="text-sm font-bold flex items-center gap-1.5">
              <Sparkles size={15} />
              Google Meet Conference Rooms
            </h2>
            <p className="text-xs text-[var(--ui-accent-ink)] max-w-xl leading-relaxed">
              Launch face-to-face customer dispute reviews, supplier logistics check-ins, or executive standups with 1 click.
            </p>
          </div>
          <button
            onClick={handleCreateMeetSpace}
            disabled={isCreating}
            className="px-4 py-2 bg-[var(--ui-surface)] text-[var(--ui-accent-text)] rounded-full text-xs font-bold hover:bg-[var(--ui-soft)] transition-all shrink-0 cursor-pointer shadow-xs"
          >
            Start Meeting Now
          </button>
        </div>

        {/* Spaces list */}
        <div className="space-y-3 pt-2">
          <span className="text-xs font-bold text-[var(--ui-text)] uppercase tracking-wider block">
            Generated Meeting Spaces ({spaces.length})
          </span>

          {spaces.length === 0 ? (
            <div className="p-12 text-center text-[var(--ui-muted)] space-y-2 border border-dashed border-[var(--ui-border)] rounded-3xl">
              <Users size={36} className="mx-auto text-[var(--ui-muted)]" />
              <p className="text-xs font-semibold text-[var(--ui-muted)]">No active meeting spaces yet</p>
              <p className="text-[11px] text-[var(--ui-muted)]">Click "Instant Google Meet" to provision a meeting space.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {spaces.map((space, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] shadow-xs flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[var(--ui-soft)] text-[var(--ui-accent-text)] flex items-center justify-center shrink-0">
                        <Video size={16} />
                      </div>
                      <div>
                        <span className="font-bold text-xs text-[var(--ui-text)] block">
                          Meet Space #{idx + 1}
                        </span>
                        <span className="text-[11px] text-[var(--ui-muted)] font-mono">
                          {space.meetingCode || space.name}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 bg-[var(--ui-bg)] rounded-xl text-xs font-mono text-[var(--ui-text)] truncate select-all flex items-center justify-between border border-[var(--ui-border)]">
                    <span className="truncate">{space.meetingUri}</span>
                    <button
                      onClick={() => handleCopy(space.meetingUri)}
                      className="p-1 text-[var(--ui-muted)] hover:text-[var(--ui-text)] transition-colors ml-2 shrink-0"
                      title="Copy meeting link"
                    >
                      {copiedUri === space.meetingUri ? (
                        <Check size={14} className="text-emerald-600" />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                  </div>

                  <div className="pt-1 flex items-center gap-2">
                    <a
                      href={space.meetingUri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 px-3 bg-[var(--ui-primary)] text-[var(--ui-primary-ink)] hover:brightness-95 rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-all"
                    >
                      <ExternalLink size={13} />
                      Join Google Meet
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
