/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Plus, 
  ExternalLink, 
  Trash2, 
  RefreshCw, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  X, 
  Loader2, 
  Calendar, 
  FileSpreadsheet, 
  FolderOpen,
  Send,
  BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { subscribeAuth } from '@/services/googleAuth';
import { 
  listGoogleDocs, 
  getGoogleDoc, 
  createGoogleDoc, 
  deleteGoogleDoc,
  GoogleDocItem, 
  GoogleDocDetail 
} from '@/services/googleDocs';
import { openGooglePicker, PickedFile } from '@/services/googlePicker';
import { MOCK_DB } from '@/services/gemini';

interface DocsViewProps {
  onAction?: (msg?: string) => void;
}

export const DocsView: React.FC<DocsViewProps> = ({ onAction }) => {
  const [token, setToken] = useState<string | null>(null);
  const [docs, setDocs] = useState<GoogleDocItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [selectedDocDetail, setSelectedDocDetail] = useState<GoogleDocDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Create Doc Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocContent, setNewDocContent] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Destructive Delete Confirmation Modal (MANDATORY REQUIREMENT)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Picker State
  const [isOpeningPicker, setIsOpeningPicker] = useState(false);
  const [pickedFile, setPickedFile] = useState<PickedFile | null>(null);

  useEffect(() => {
    return subscribeAuth((_, t) => {
      setToken(t);
    });
  }, []);

  useEffect(() => {
    loadDocs();
  }, [token]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadDocs = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      if (token) {
        const live = await listGoogleDocs();
        setDocs(live);
      } else {
        // Pre-seeded retail operational documents
        setDocs([
          {
            id: 'sample_doc_1',
            name: '2026 E-Commerce Logistics SOP & Delivery Protocol',
            modifiedTime: new Date(Date.now() - 86400000).toISOString(),
            webViewLink: '#',
          },
          {
            id: 'sample_doc_2',
            name: 'Customer Refund & CSAT Resolution Playbook',
            modifiedTime: new Date(Date.now() - 172800000).toISOString(),
            webViewLink: '#',
          },
          {
            id: 'sample_doc_3',
            name: 'Q3 Brazil Marketplace Performance Synthesis',
            modifiedTime: new Date(Date.now() - 345600000).toISOString(),
            webViewLink: '#',
          }
        ]);
      }
    } catch (err: any) {
      if (!err.message?.includes('AUTH_REQUIRED')) {
        setErrorMsg(err.message || 'Failed to list documents');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectDoc = async (doc: GoogleDocItem) => {
    setSelectedDocId(doc.id);
    setIsLoadingDetail(true);
    try {
      if (token && !doc.id.startsWith('sample_')) {
        const detail = await getGoogleDoc(doc.id);
        setSelectedDocDetail(detail);
      } else {
        setSelectedDocDetail({
          documentId: doc.id,
          title: doc.name,
          extractedText: `Standard Operating Procedure: ${doc.name}\n\n1. Overview\nThis document outlines standard handling guidelines for retail operations, shipping delays, and customer dispute resolutions.\n\n2. Key Protocols\n- For delivery delays exceeding 48 hours, offer automated shipping refund.\n- Log return requests through the Google Forms portal.\n- Keep track of open tasks in Google Tasks.\n\nApproved by Operations Team.`
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load document content');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim()) return;
    setIsCreating(true);
    try {
      if (token) {
        const created = await createGoogleDoc(newDocTitle, newDocContent);
        showToast(`Document "${created.title}" created in Google Drive!`);
        setShowCreateModal(false);
        setNewDocTitle('');
        setNewDocContent('');
        loadDocs();
        handleSelectDoc({ id: created.documentId, name: created.title });
      } else {
        const draftId = 'doc_' + Date.now();
        const localDoc: GoogleDocItem = {
          id: draftId,
          name: newDocTitle,
          modifiedTime: new Date().toISOString(),
          webViewLink: '#'
        };
        setDocs(prev => [localDoc, ...prev]);
        MOCK_DB.docs.unshift(localDoc);
        showToast('Document created in workspace! Sign in to publish to Google Drive.');
        setShowCreateModal(false);
        handleSelectDoc(localDoc);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create document');
    } finally {
      setIsCreating(false);
    }
  };

  // Google Picker Integration
  const handleOpenPicker = async () => {
    if (!token) {
      setErrorMsg('Please sign in with Google to browse and pick files from Google Drive.');
      return;
    }
    setIsOpeningPicker(true);
    try {
      await openGooglePicker({
        title: 'Select a Google Document from Drive',
        onPicked: (file) => {
          setPickedFile(file);
          showToast(`Selected "${file.name}" from Google Drive!`);
          handleSelectDoc({
            id: file.id,
            name: file.name,
            webViewLink: file.url
          });
        },
        onCancel: () => {
          setIsOpeningPicker(false);
        }
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not open Google Picker');
    } finally {
      setIsOpeningPicker(false);
    }
  };

  const handleExecuteDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      if (token && !deleteTarget.id.startsWith('sample_')) {
        await deleteGoogleDoc(deleteTarget.id);
      }
      setDocs(prev => prev.filter(d => d.id !== deleteTarget.id));
      if (selectedDocId === deleteTarget.id) {
        setSelectedDocId(null);
        setSelectedDocDetail(null);
      }
      showToast(`Document "${deleteTarget.title}" deleted.`);
      setDeleteTarget(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete document.');
    } finally {
      setIsDeleting(false);
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
            <FileText className="text-[var(--ui-accent-text)]" size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[var(--ui-text)] tracking-tight flex items-center gap-2">
              Google Docs & Drive
              {token && (
                <span className="text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Synced
                </span>
              )}
            </h1>
            <p className="text-xs text-[var(--ui-muted)]">
              Create executive documents, read SOPs, and browse Drive with Google Picker.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Native Google Picker Button */}
          <button
            onClick={handleOpenPicker}
            disabled={isOpeningPicker}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[var(--ui-soft)] hover:bg-[var(--ui-soft)] text-[var(--ui-text)] rounded-full text-xs font-medium transition-all shadow-xs cursor-pointer"
            title="Open Google Picker to browse files in Drive"
          >
            <FolderOpen size={14} className="text-amber-600" />
            Pick from Drive
          </button>

          <button
            onClick={() => loadDocs()}
            disabled={isLoading}
            className="p-2 text-[var(--ui-muted)] hover:text-[var(--ui-text)] bg-[var(--ui-bg)] hover:bg-[var(--ui-soft)] rounded-full border border-[var(--ui-border)] transition-all"
            title="Refresh documents"
          >
            <RefreshCw size={15} className={cn(isLoading && "animate-spin")} />
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[var(--ui-primary)] text-[var(--ui-primary-ink)] hover:brightness-95 rounded-full text-xs font-semibold transition-all shadow-xs cursor-pointer"
          >
            <Plus size={14} />
            Create Doc
          </button>
        </div>
      </header>

      {/* Main split */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Document List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--ui-muted)]">
              Your Google Documents ({docs.length})
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {docs.map((doc) => {
              const isSelected = selectedDocId === doc.id;
              return (
                <div
                  key={doc.id}
                  onClick={() => handleSelectDoc(doc)}
                  className={cn(
                    "p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group",
                    isSelected
                      ? "bg-[var(--ui-soft)] border-[var(--ui-border)] shadow-xs"
                      : "bg-[var(--ui-surface)] hover:bg-[var(--ui-bg)] border-[var(--ui-border)]"
                  )}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[var(--ui-soft)] text-[var(--ui-accent-text)] flex items-center justify-center shrink-0">
                          <FileText size={15} />
                        </div>
                        <span className="font-semibold text-xs text-[var(--ui-text)] group-hover:text-[var(--ui-accent-text)] line-clamp-1">
                          {doc.name}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] text-[var(--ui-muted)] mt-3 font-medium">
                      <Calendar size={11} />
                      <span>
                        {doc.modifiedTime ? new Date(doc.modifiedTime).toLocaleDateString() : 'Recent'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-[var(--ui-border)] flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                    {doc.webViewLink && doc.webViewLink !== '#' ? (
                      <a
                        href={doc.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-semibold text-[var(--ui-accent-text)] hover:underline flex items-center gap-1"
                      >
                        Open in Google Docs <ExternalLink size={11} />
                      </a>
                    ) : (
                      <span className="text-[10px] text-[var(--ui-muted)]">Local document</span>
                    )}

                    <button
                      onClick={() => setDeleteTarget({ id: doc.id, title: doc.name })}
                      title="Delete document"
                      className="p-1.5 text-[var(--ui-muted)] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Doc Reader Panel */}
        <div className={cn(
          "w-full md:w-[480px] border-t md:border-t-0 md:border-l border-[var(--ui-border)] bg-[var(--ui-bg)] flex flex-col shrink-0 overflow-y-auto",
          !selectedDocId && "hidden md:flex"
        )}>
          {selectedDocDetail ? (
            <div className="p-6 flex flex-col h-full space-y-4">
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-[var(--ui-border)]">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--ui-accent-text)] bg-[var(--ui-soft)] px-2 py-0.5 rounded-md">
                    Google Document
                  </span>
                  <h2 className="text-sm font-bold text-[var(--ui-text)] mt-1 leading-snug">
                    {selectedDocDetail.title}
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setSelectedDocId(null);
                    setSelectedDocDetail(null);
                  }}
                  className="p-1 text-[var(--ui-muted)] hover:text-[var(--ui-text)] rounded-full hover:bg-[var(--ui-soft)]"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Text content viewer */}
              <div className="flex-1 bg-[var(--ui-surface)] p-5 rounded-2xl border border-[var(--ui-border)] text-xs text-[var(--ui-text)] leading-relaxed overflow-y-auto whitespace-pre-wrap font-sans shadow-xs">
                {selectedDocDetail.extractedText || 'No text content available in this document.'}
              </div>

              {/* External Edit button */}
              <div className="pt-2 flex items-center justify-between">
                <a
                  href={`https://docs.google.com/document/d/${selectedDocDetail.documentId}/edit`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-[var(--ui-primary)] text-[var(--ui-primary-ink)] hover:brightness-95 rounded-full text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all"
                >
                  <ExternalLink size={13} />
                  Edit in Google Docs
                </a>

                <button
                  onClick={() => setDeleteTarget({ id: selectedDocDetail.documentId, title: selectedDocDetail.title })}
                  className="p-2 text-[var(--ui-muted)] hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-[var(--ui-muted)] space-y-2">
              <BookOpen size={32} className="text-[var(--ui-muted)]" />
              <p className="text-xs font-semibold text-[var(--ui-muted)]">Select a document to read</p>
              <p className="text-[11px] text-[var(--ui-muted)] max-w-[200px]">
                Click on any document card or use Google Picker to inspect contents.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CREATE DOC MODAL */}
      <AnimatePresence>
        {showCreateModal && (
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
                    <FileText size={16} />
                  </div>
                  <h3 className="font-bold text-sm text-[var(--ui-text)]">Create New Google Doc</h3>
                </div>
                <button onClick={() => setShowCreateModal(false)} className="text-[var(--ui-muted)] hover:text-[var(--ui-text)] p-1">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateDocument} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-[var(--ui-text)] block mb-1">Document Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Q4 Order Fulfillment Analysis & Action Plan"
                    value={newDocTitle}
                    onChange={(e) => setNewDocTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-[var(--ui-accent)] font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[var(--ui-text)] block mb-1">Initial Content / Body</label>
                  <textarea
                    rows={6}
                    placeholder="Enter document outline, report findings, or operational notes..."
                    value={newDocContent}
                    onChange={(e) => setNewDocContent(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-[var(--ui-accent)] font-sans leading-relaxed"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-xs font-medium text-[var(--ui-muted)] hover:bg-[var(--ui-soft)] rounded-full transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating || !newDocTitle.trim()}
                    className="flex items-center gap-1.5 px-5 py-2 bg-[var(--ui-primary)] text-[var(--ui-primary-ink)] hover:brightness-95 disabled:opacity-50 rounded-full text-xs font-semibold shadow-xs transition-all cursor-pointer"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        Creating in Google Drive...
                      </>
                    ) : (
                      'Create in Google Docs'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MANDATORY CONFIRMATION MODAL FOR DELETING DOCUMENT */}
      <AnimatePresence>
        {deleteTarget && (
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
                <h3 className="font-bold text-sm text-[var(--ui-text)]">Delete Google Doc?</h3>
                <p className="text-xs text-[var(--ui-muted)] mt-1 leading-relaxed">
                  Are you sure you want to permanently delete <span className="font-semibold text-[var(--ui-text)]">"{deleteTarget.title}"</span> from your Google Drive?
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
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
    </div>
  );
};
