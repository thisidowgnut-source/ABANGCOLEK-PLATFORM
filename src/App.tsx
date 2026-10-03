/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Bot, 
  User, 
  Briefcase, 
  Search, 
  Database,
  Loader2,
  Sparkles,
  CheckCircle2,
  Activity,
  MoreHorizontal,
  FileText,
  Mail,
  CheckSquare,
  FolderOpen,
  Calendar,
  FileSpreadsheet,
  MapPin,
  Video,
  MessageSquare,
  Flame,
  Plus,
  AlertCircle,
  Zap,
  Truck,
  Gauge,
  Sun,
  Moon
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { JevAssessmentCard } from '@/features/jev';
import { cn } from '@/lib/utils';
import { sendMessageToAgentStream, ChatMessage, ToolCall, MOCK_DB, AgentStep, subscribeToolExecution } from '@/services/gemini';
import { appStore, OrderItem } from '@/services/store';
import { AbangColekDiscoveryView } from '@/components/AbangColekDiscoveryView';
import { PluginsView } from '@/components/PluginsView';
import { PluginArtifactCard } from '@/components/PluginArtifactCard';
import { FormsView } from '@/components/FormsView';
import { GmailView } from '@/components/GmailView';
import { TasksView } from '@/components/TasksView';
import { DocsView } from '@/components/DocsView';
import { CalendarView } from '@/components/CalendarView';
import { SheetsView } from '@/components/SheetsView';
import { MapsView } from '@/components/MapsView';
import { MeetView } from '@/components/MeetView';
import { ChatWorkspaceView } from '@/components/ChatWorkspaceView';
import { WorkspaceSidebar as Sidebar, WorkspaceMobileMenu } from '@/components/WorkspaceSidebar';
import { useSupabaseAuth } from '@/services/supabaseAuth';
import '@/components/workspace-sidebar.css';

import { OrdersView } from '@/components/OrdersView';

import { BusFreightView } from '@/components/BusFreightView';
import { AgentPerformanceView } from '@/components/AgentPerformanceView';
import { DashboardView } from '@/features/dashboard/DashboardView';
import { CommandPalette } from '@/components/CommandPalette';
import { useWorkspaceTheme } from '@/features/theme/useWorkspaceTheme';
import '@/features/theme/workspace-theme.css';

// --- Components ---

const AgentStepBlock = ({ step }: { step: AgentStep }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-4 rounded-3xl transition-all",
        step.status === 'streaming' ? "bg-[var(--ui-surface)] shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-[var(--ui-border)]" : "bg-[var(--ui-soft)] border border-[var(--ui-border)]"
      )}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className={cn(
          "w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-[var(--ui-surface)] shadow-sm border border-[var(--ui-border)] text-[var(--ui-muted)]"
        )}>
          {step.type === 'tool' ? <Database size={12} /> : <Bot size={12} />}
        </div>
        <span className="font-semibold text-[13px] text-[var(--ui-text)] truncate">
          {step.type === 'tool' ? `Tool Call: ${step.toolName}` : 'Thinking'}
        </span>
        {step.status === 'streaming' && <Loader2 size={12} className="animate-spin text-[var(--ui-muted)] ml-auto shrink-0" />}
        {step.status === 'completed' && (
          <div className="flex items-center gap-2 ml-auto shrink-0">
            {step.latencyMs !== undefined && (
              <span className="text-[10px] text-[var(--ui-muted)] font-medium">
                {(step.latencyMs / 1000).toFixed(2)}s
              </span>
            )}
            <div className="text-[var(--ui-success-text)]">
              <CheckCircle2 size={14} />
            </div>
          </div>
        )}
      </div>
      
      {step.type === 'tool' && step.toolArgs && (
        <pre className="text-[10px] bg-[var(--ui-surface)] text-[var(--ui-muted)] p-3 rounded-2xl overflow-x-auto mt-3 font-mono whitespace-pre-wrap border border-[var(--ui-border)]">
          {JSON.stringify(step.toolArgs, null, 2)}
        </pre>
      )}
      
      {step.type === 'text' && step.content && (
        <div className="text-[13px] text-[var(--ui-muted)] mt-2 line-clamp-2 leading-relaxed">"{step.content}"</div>
      )}

      {step.result && (
        <div className="mt-4 pt-3 border-t border-[var(--ui-border)] flex flex-col gap-1 text-[11px]">
          <span className="font-semibold text-[var(--ui-muted)] uppercase tracking-wider text-[9px]">Result</span> 
          <span className="text-[var(--ui-text)] truncate font-medium">{step.result.message || 'Success'}</span>
        </div>
      )}
    </motion.div>
  );
};

const ChatInterface = ({ 
  history, 
  onSendMessage, 
  isProcessing,
  currentTool,
  agentSteps,
  streamingText,
  setActiveTab
}: { 
  history: ChatMessage[], 
  onSendMessage: (msg: string) => void,
  isProcessing: boolean,
  currentTool: ToolCall | null,
  agentSteps: AgentStep[],
  streamingText: string,
  setActiveTab: (tab: string) => void
}) => {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const leftScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, isProcessing, currentTool, streamingText]);

  useEffect(() => {
    if (leftScrollRef.current) {
      leftScrollRef.current.scrollTop = leftScrollRef.current.scrollHeight;
    }
  }, [agentSteps]);

  const isGeneratingReport = agentSteps.some(s => s.type === 'tool' && s.toolName === 'generate_yearly_report');
  const isGeneratingDashboard = agentSteps.some(s => s.type === 'tool' && s.toolName === 'create_operations_dashboard');
  const isGeneratingWidget = isGeneratingReport || isGeneratingDashboard;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;
    onSendMessage(input);
    setInput("");
  };

  return (
    <div className="flex flex-col md:flex-row-reverse h-auto md:h-full w-full gap-4 md:gap-6">
      {/* Right side: Process & Agent Steps */}
      <div className="min-h-[300px] flex-1 md:min-h-0 md:flex-initial w-full md:w-[60%] flex flex-col rounded-[32px] bg-[var(--ui-surface)] border border-[var(--ui-border)] shadow-[0_4px_24px_rgba(0,0,0,0.02)] overflow-hidden relative">
        <header className="h-[60px] md:h-[72px] flex items-center px-4 md:px-8 bg-[var(--ui-surface)] shrink-0 border-b border-[var(--ui-border)]">
          <h2 className="font-semibold text-[var(--ui-text)] text-[15px] flex items-center gap-3">
            {isProcessing ? (
              <Loader2 className="text-[var(--ui-muted)] animate-spin" size={16} />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[var(--ui-soft)] flex items-center justify-center border border-[var(--ui-border)]">
                <Activity className="text-[var(--ui-muted)]" size={14} />
              </div>
            )}
            Execution Trace
          </h2>
        </header>
        <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-4 md:pb-8 pt-4 md:pt-6 space-y-4" ref={leftScrollRef}>
          {agentSteps.length === 0 && !isProcessing && (
             <div className="text-[var(--ui-muted)] text-sm font-medium mt-10 text-center">Start a task to see agent steps here.</div>
          )}
          {agentSteps.map((step) => (
            <AgentStepBlock key={step.id} step={step} />
          ))}
        </div>
      </div>

      {/* Left side: Chat */}
      <div className="min-h-[450px] flex-1 md:min-h-0 md:flex-initial w-full md:w-[40%] flex flex-col rounded-[32px] bg-[var(--ui-surface)] border border-[var(--ui-border)] shadow-[0_4px_24px_rgba(0,0,0,0.02)] overflow-hidden relative">
        {/* Header */}
        <header className="h-[60px] md:h-[72px] flex items-center px-4 md:px-8 justify-between shrink-0 border-b border-[var(--ui-border)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--ui-soft)] flex items-center justify-center border border-[var(--ui-border)]">
              <Bot className="text-[var(--ui-muted)]" size={14} />
            </div>
            <h2 className="font-semibold text-[var(--ui-text)] text-[15px]">Virtual Assistant</h2>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 md:py-8 space-y-6" ref={scrollRef}>
          {history.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-[var(--ui-muted)] space-y-6">
              <div className="w-16 h-16 bg-[var(--ui-surface)] shadow-sm border border-[var(--ui-border)] rounded-full flex items-center justify-center">
                <Bot size={32} className="text-[var(--ui-muted)]" />
              </div>
              <p className="font-medium text-[var(--ui-muted)]">Bagaimana saya boleh bantu operasi Abang Colek hari ini?</p>
              <div className="flex flex-wrap justify-center gap-2 w-full max-w-2xl">
                <button onClick={() => onSendMessage("Siasat aduan pembungkusan botol kuah colek bocor (LEAKAGE) dan draf emel gantian di Gmail")} className="px-3.5 py-1.5 bg-[var(--ui-soft)] hover:bg-[var(--ui-soft)] rounded-full transition-all border border-[var(--ui-border)] text-[var(--ui-accent-text)] font-medium text-[12px] flex items-center gap-1.5 shadow-xs">
                  <Mail size={13} className="text-[var(--ui-accent-text)]" />
                  Aduan Botol Bocor (Gmail)
                </button>
                <button onClick={() => onSendMessage("Jadualkan sesi taklimat stokis Terengganu & selatan dalam Google Calendar")} className="px-3.5 py-1.5 bg-[var(--ui-soft)] hover:bg-[var(--ui-soft)] rounded-full transition-all border border-[var(--ui-border)] text-[var(--ui-accent-text)] font-medium text-[12px] flex items-center gap-1.5 shadow-xs">
                  <Calendar size={13} className="text-[var(--ui-accent-text)]" />
                  Jadual Mesyuarat Stokis
                </button>
                <button onClick={() => onSendMessage("Eksport rekod jualan kuah colek dan botol pakej ejen ke Google Sheets")} className="px-3.5 py-1.5 bg-[var(--ui-soft)] hover:bg-[var(--ui-soft)] rounded-full transition-all border border-[var(--ui-border)] text-[var(--ui-success-text)] font-medium text-[12px] flex items-center gap-1.5 shadow-xs">
                  <FileSpreadsheet size={13} className="text-[var(--ui-success-text)]" />
                  Eksport Stokis (Sheets)
                </button>
                <button onClick={() => onSendMessage("Cipta tugasan pemeriksaan QC penutup botol kuah colek pembekal di Google Tasks")} className="px-3.5 py-1.5 bg-[var(--ui-soft)] hover:bg-[var(--ui-soft)] rounded-full transition-all border border-[var(--ui-border)] text-[var(--ui-accent-text)] font-medium text-[12px] flex items-center gap-1.5 shadow-xs">
                  <CheckSquare size={13} className="text-[var(--ui-accent-text)]" />
                  Tugasan QC Botol (Tasks)
                </button>
                <button onClick={() => onSendMessage("Cipta SOP kawalan kualiti kuah colek & pembungkusan di Google Docs")} className="px-3.5 py-1.5 bg-[var(--ui-soft)] hover:bg-[var(--ui-soft)] rounded-full transition-all border border-[var(--ui-border)] text-[var(--ui-accent-text)] font-medium text-[12px] flex items-center gap-1.5 shadow-xs">
                  <FileText size={13} className="text-[var(--ui-accent-text)]" />
                  SOP Kuah Colek (Docs)
                </button>
                <button onClick={() => onSendMessage("Bina borang Google Forms untuk pendaftaran ejen & stokis baharu Abang Colek")} className="px-3.5 py-1.5 bg-[var(--ui-soft)] hover:bg-[var(--ui-soft)] rounded-full transition-all border border-[var(--ui-border)] text-[var(--ui-accent-text)] font-medium text-[12px] flex items-center gap-1.5 shadow-xs">
                  <FolderOpen size={13} className="text-[var(--ui-accent-text)]" />
                  Borang Ejen (Forms)
                </button>
                <button onClick={() => onSendMessage("Buka bilik Google Meet untuk krew festival jualan pop-up Johor Bahru")} className="px-3.5 py-1.5 bg-[var(--ui-soft)] hover:bg-[var(--ui-soft)] rounded-full transition-all border border-[var(--ui-border)] text-[var(--ui-accent-text)] font-medium text-[12px] flex items-center gap-1.5 shadow-xs">
                  <Video size={13} className="text-[var(--ui-accent-text)]" />
                  Bilik Krew Pop-Up (Meet)
                </button>
                <button onClick={() => onSendMessage("Cari tiket penerbangan murah ke Tokyo Jepun minggu depan di Skyscanner")} className="px-3.5 py-1.5 bg-[var(--ui-soft)] hover:bg-[var(--ui-soft)] rounded-full transition-all border border-[var(--ui-border)] text-[var(--ui-accent-text)] font-medium text-[12px] flex items-center gap-1.5 shadow-xs">
                  <Zap size={13} className="text-[var(--ui-accent-text)]" />
                  Tiket Jepun (Skyscanner)
                </button>
                <button onClick={() => onSendMessage("Reka poster promosi gerai pop-up Abang Colek di Canva saiz Instagram 1:1")} className="px-3.5 py-1.5 bg-[var(--ui-soft)] hover:bg-[var(--ui-soft)] rounded-full transition-all border border-[var(--ui-border)] text-[var(--ui-accent-text)] font-medium text-[12px] flex items-center gap-1.5 shadow-xs">
                  <Zap size={13} className="text-[var(--ui-accent-text)]" />
                  Reka Poster (Canva)
                </button>
                <button onClick={() => onSendMessage("Semak Pull Request terbaru di repositori GitHub Abang Colek")} className="px-3.5 py-1.5 bg-[var(--ui-soft)] hover:bg-[var(--ui-soft)] rounded-full transition-all border border-[var(--ui-border)] text-[var(--ui-text)] font-medium text-[12px] flex items-center gap-1.5 shadow-xs">
                  <Zap size={13} className="text-[var(--ui-text)]" />
                  Semak Kod PR (GitHub)
                </button>
                <button onClick={() => onSendMessage("Cari hotel berhampiran Toppen Shopping Centre Johor Bahru untuk krew di Booking.com")} className="px-3.5 py-1.5 bg-[var(--ui-soft)] hover:bg-[var(--ui-soft)] rounded-full transition-all border border-[var(--ui-border)] text-[var(--ui-accent-text)] font-medium text-[12px] flex items-center gap-1.5 shadow-xs">
                  <Zap size={13} className="text-[var(--ui-accent-text)]" />
                  Hotel Krew JB (Booking)
                </button>
                <button onClick={() => onSendMessage("Semak data latihan COROS dan stamina kecergasan krew hari ini")} className="px-3.5 py-1.5 bg-[var(--ui-soft)] hover:bg-[var(--ui-soft)] rounded-full transition-all border border-[var(--ui-border)] text-orange-700 font-medium text-[12px] flex items-center gap-1.5 shadow-xs">
                  <Zap size={13} className="text-orange-600" />
                  Data Latihan (COROS)
                </button>
              </div>
            </div>
          )}

          {history.map((msg, idx) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={idx} 
              className={cn(
                "flex gap-4 max-w-full",
                msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-auto mb-1",
                msg.role === 'user' ? "bg-[var(--ui-inverse)] text-white" : "bg-[var(--ui-surface)] border border-[var(--ui-border)] text-[var(--ui-text)] shadow-sm"
              )}>
                {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
              </div>
              
              <div className={cn(
                "rounded-3xl text-[14px] leading-relaxed max-w-[85%] font-medium",
                msg.role === 'user' 
                  ? "p-5 bg-[var(--ui-inverse)] text-white rounded-br-[8px]" 
                  : (msg.hasReport || msg.hasDashboard || msg.hasForm || msg.hasEmail || msg.hasTask || msg.hasDoc || msg.hasCalendar || msg.hasSheet || msg.hasMeet || msg.hasChat || msg.hasPlugin)
                    ? "p-0" 
                    : "p-5 bg-[var(--ui-surface)] rounded-bl-[8px] text-[var(--ui-text)] border border-[var(--ui-border)] shadow-[0_2px_12px_rgba(0,0,0,0.02)]"
              )}>
                {msg.role === 'model' && msg.jevData?.assessment && <JevAssessmentCard assessment={msg.jevData.assessment} title="Semakan JEV untuk mesej ini" />}
                {msg.role === 'model' && (msg.hasReport || msg.hasDashboard || msg.hasForm || msg.hasEmail || msg.hasTask || msg.hasDoc || msg.hasCalendar || msg.hasSheet || msg.hasMeet || msg.hasChat || msg.hasPlugin) ? (
                  <div className="flex flex-col gap-3 min-w-[220px]">
                    <div className="p-4 bg-[var(--ui-surface)] border border-[var(--ui-border)] rounded-3xl rounded-bl-[8px] shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col gap-2.5">
                      <span className="font-semibold text-[14px] text-[var(--ui-text)] flex items-center gap-2">
                        {msg.hasPlugin ? (
                          <>
                            <Zap size={16} className="text-[var(--ui-accent-text)] fill-amber-500" />
                            Tindakan Plugin 3P Selesai
                          </>
                        ) : msg.hasEmail ? (
                          <>
                            <Mail size={16} className="text-[var(--ui-accent-text)]" />
                            Email Delivered via Gmail
                          </>
                        ) : msg.hasCalendar ? (
                          <>
                            <Calendar size={16} className="text-[var(--ui-accent-text)]" />
                            Event Scheduled in Google Calendar
                          </>
                        ) : msg.hasSheet ? (
                          <>
                            <FileSpreadsheet size={16} className="text-[var(--ui-success-text)]" />
                            Spreadsheet Created in Google Sheets
                          </>
                        ) : msg.hasTask ? (
                          <>
                            <CheckSquare size={16} className="text-[var(--ui-accent-text)]" />
                            Task Added to Google Tasks
                          </>
                        ) : msg.hasDoc ? (
                          <>
                            <FileText size={16} className="text-[var(--ui-accent-text)]" />
                            Document Created in Google Docs
                          </>
                        ) : msg.hasForm ? (
                          <>
                            <FolderOpen size={16} className="text-[var(--ui-accent-text)]" />
                            Google Form Created & Published
                          </>
                        ) : msg.hasMeet ? (
                          <>
                            <Video size={16} className="text-[var(--ui-accent-text)]" />
                            Google Meet Room Created
                          </>
                        ) : msg.hasChat ? (
                          <>
                            <MessageSquare size={16} className="text-[var(--ui-accent-text)]" />
                            Message Sent to Google Chat
                          </>
                        ) : msg.hasReport && msg.hasDashboard ? (
                          'Report & Dashboard ready'
                        ) : msg.hasReport ? (
                          'Report now ready'
                        ) : (
                          'Dashboard now ready'
                        )}
                      </span>
                      {msg.formData?.info?.title && (
                        <p className="text-xs text-[var(--ui-muted)] font-medium">
                          "{msg.formData.info.title}"
                        </p>
                      )}
                      {msg.docData?.title && (
                        <p className="text-xs text-[var(--ui-muted)] font-medium">
                          "{msg.docData.title}"
                        </p>
                      )}
                      {msg.taskData?.title && (
                        <p className="text-xs text-[var(--ui-muted)] font-medium">
                          "{msg.taskData.title}"
                        </p>
                      )}
                      {msg.hasPlugin && msg.pluginData && (
                        <PluginArtifactCard pluginType={msg.pluginType || ''} data={msg.pluginData} onOpenStore={() => setActiveTab('plugins')} />
                      )}
                      {msg.latencyMs && (
                        <div className="text-[var(--ui-success-text)] flex items-center gap-1.5 text-[11px] font-medium">
                          <Activity size={12} className="text-[var(--ui-success-text)]" /> Latency {(msg.latencyMs / 1000).toFixed(2)}s
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {msg.hasEmail && (
                        <button 
                          onClick={() => setActiveTab('gmail')}
                          className="bg-[var(--ui-accent)] text-[var(--ui-accent-ink)] px-5 py-2.5 rounded-full font-semibold w-max hover:brightness-110 transition-colors text-[13px] shadow-sm flex items-center gap-2"
                        >
                          <Mail size={14} />
                          Open in Gmail &rarr;
                        </button>
                      )}
                      {msg.hasCalendar && (
                        <button 
                          onClick={() => setActiveTab('calendar')}
                          className="bg-[var(--ui-accent)] text-[var(--ui-accent-ink)] px-5 py-2.5 rounded-full font-semibold w-max hover:brightness-110 transition-colors text-[13px] shadow-sm flex items-center gap-2"
                        >
                          <Calendar size={14} />
                          Open in Calendar &rarr;
                        </button>
                      )}
                      {msg.hasSheet && (
                        <button 
                          onClick={() => setActiveTab('sheets')}
                          className="bg-emerald-600 text-[var(--ui-primary-ink)] px-5 py-2.5 rounded-full font-semibold w-max hover:bg-emerald-700 transition-colors text-[13px] shadow-sm flex items-center gap-2"
                        >
                          <FileSpreadsheet size={14} />
                          Open in Sheets &rarr;
                        </button>
                      )}
                      {msg.hasTask && (
                        <button 
                          onClick={() => setActiveTab('tasks')}
                          className="bg-[var(--ui-accent)] text-[var(--ui-accent-ink)] px-5 py-2.5 rounded-full font-semibold w-max hover:brightness-110 transition-colors text-[13px] shadow-sm flex items-center gap-2"
                        >
                          <CheckSquare size={14} />
                          View in Google Tasks &rarr;
                        </button>
                      )}
                      {msg.hasDoc && (
                        <button 
                          onClick={() => setActiveTab('docs')}
                          className="bg-indigo-600 text-[var(--ui-primary-ink)] px-5 py-2.5 rounded-full font-semibold w-max hover:bg-indigo-700 transition-colors text-[13px] shadow-sm flex items-center gap-2"
                        >
                          <FileText size={14} />
                          Open in Google Docs &rarr;
                        </button>
                      )}
                      {msg.hasForm && (
                        <button 
                          onClick={() => setActiveTab('forms')}
                          className="bg-[var(--ui-accent)] text-[var(--ui-accent-ink)] px-5 py-2.5 rounded-full font-semibold w-max hover:brightness-110 transition-colors text-[13px] shadow-sm flex items-center gap-2"
                        >
                          <FolderOpen size={14} />
                          View in Google Forms Tab &rarr;
                        </button>
                      )}
                      {msg.hasMeet && (
                        <button 
                          onClick={() => setActiveTab('meet')}
                          className="bg-teal-600 text-[var(--ui-primary-ink)] px-5 py-2.5 rounded-full font-semibold w-max hover:bg-teal-700 transition-colors text-[13px] shadow-sm flex items-center gap-2"
                        >
                          <Video size={14} />
                          Open Google Meet &rarr;
                        </button>
                      )}
                      {msg.hasChat && (
                        <button 
                          onClick={() => setActiveTab('chat_workspace')}
                          className="bg-[var(--ui-accent)] text-[var(--ui-accent-ink)] px-5 py-2.5 rounded-full font-semibold w-max hover:brightness-110 transition-colors text-[13px] shadow-sm flex items-center gap-2"
                        >
                          <MessageSquare size={14} />
                          Open Google Chat &rarr;
                        </button>
                      )}
                      {msg.hasReport && (
                        <button 
                          onClick={() => setActiveTab('reports')}
                          className="bg-[var(--ui-primary)] text-[var(--ui-primary-ink)] px-6 py-3 rounded-full font-medium w-max hover:bg-[var(--ui-primary)] transition-colors text-[13px] shadow-sm flex items-center gap-2"
                        >
                          go to reports &rarr;
                        </button>
                      )}
                      {msg.hasDashboard && (
                        <button 
                          onClick={() => setActiveTab('dashboards')}
                          className="bg-[var(--ui-primary)] text-[var(--ui-primary-ink)] px-6 py-3 rounded-full font-medium w-max hover:bg-[var(--ui-primary)] transition-colors text-[13px] shadow-sm flex items-center gap-2"
                        >
                          go to dashboards &rarr;
                        </button>
                      )}
                      {msg.hasJev && (
                        <button 
                          onClick={() => setActiveTab('discovery')}
                          className="bg-[var(--ui-accent)] text-[var(--ui-accent-ink)] px-5 py-2.5 rounded-full font-semibold w-max hover:brightness-110 transition-colors text-[13px] shadow-sm flex items-center gap-2"
                        >
                          <Flame size={14} />
                          Buka Hab JEV Abang Colek &rarr;
                        </button>
                      )}
                      {msg.hasPlugin && (
                        <button 
                          onClick={() => setActiveTab('plugins')}
                          className="bg-[var(--ui-primary)] text-[var(--ui-primary-ink)] px-5 py-2.5 rounded-full font-semibold w-max hover:bg-[var(--ui-primary)] transition-colors text-[13px] shadow-sm flex items-center gap-2"
                        >
                          <Zap size={14} className="text-[var(--ui-accent-text)]" />
                          Buka Gedung Plugins &rarr;
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={cn("markdown-body", msg.role === 'user' ? "text-white" : "text-[var(--ui-text)]")}>
                      <ReactMarkdown>{msg.parts?.map((p: any) => p.text || "").join("") || ""}</ReactMarkdown>
                    </div>

                    {msg.hasPlugin && msg.pluginData && (
                      <PluginArtifactCard pluginType={msg.pluginType || ''} data={msg.pluginData} onOpenStore={() => setActiveTab('plugins')} />
                    )}

                    {msg.role === 'model' && msg.latencyMs !== undefined && (
                      <div className="mt-4 pt-4 border-t border-[var(--ui-border)] flex items-center justify-end text-[var(--ui-success-text)] text-[11px]">
                        <span className="font-mono bg-emerald-50/50 text-emerald-600 px-2 py-0.5 rounded-md flex items-center gap-1.5">
                          <CheckCircle2 size={12} />
                          {(msg.latencyMs / 1000).toFixed(2)}s
                        </span>
                      </div>
                    )}
                  </>
                )}
                
                {/* Grounding Sources */}
                {msg.groundingMetadata?.groundingChunks && (
                  <div className="mt-4 pt-4 border-t border-[var(--ui-border)]">
                    <p className="text-[10px] font-semibold text-[var(--ui-muted)] mb-2.5 flex items-center gap-1.5 uppercase tracking-wider">
                      <Search size={12} /> Sources
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {msg.groundingMetadata.groundingChunks.map((chunk: any, i: number) => (
                        <a 
                          key={i} 
                          href={chunk.web?.uri} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-[11px] px-3 py-1.5 bg-[var(--ui-soft)] hover:bg-[var(--ui-soft)] rounded-full text-[var(--ui-muted)] border border-[var(--ui-border)] transition-colors"
                        >
                          {chunk.web?.title || new URL(chunk.web?.uri).hostname}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          
          {isProcessing && streamingText && !isGeneratingWidget && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-4 max-w-full"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-auto mb-1 bg-[var(--ui-surface)] border border-[var(--ui-border)] text-[var(--ui-text)] shadow-sm">
                <Bot size={14} />
              </div>
              <div className="p-5 rounded-3xl text-[14px] leading-relaxed max-w-[85%] font-medium bg-[var(--ui-surface)] rounded-bl-[8px] border border-[var(--ui-border)] shadow-[0_2px_12px_rgba(0,0,0,0.02)] text-[var(--ui-text)] opacity-70">
                <div className="markdown-body text-[var(--ui-text)]">
                  <ReactMarkdown>{streamingText}</ReactMarkdown>
                </div>
              </div>
            </motion.div>
          )}

          {isProcessing && !streamingText && !isGeneratingWidget && (
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-[var(--ui-surface)] border border-[var(--ui-border)] text-[var(--ui-text)] shadow-sm flex items-center justify-center mt-auto mb-1">
                <Bot size={14} />
              </div>
              <div className="bg-[var(--ui-surface)] px-5 py-4 rounded-3xl rounded-bl-[8px] shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-[var(--ui-border)] flex items-center gap-2">
                <div className="w-2 h-2 bg-[var(--ui-border)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-[var(--ui-border)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-[var(--ui-border)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          {isProcessing && isGeneratingWidget && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-4 max-w-full"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-auto mb-1 bg-[var(--ui-surface)] border border-[var(--ui-border)] text-[var(--ui-text)] shadow-sm">
                <Bot size={14} />
              </div>
              <div className="flex flex-col gap-3 min-w-[200px]">
                <div className="p-4 bg-[var(--ui-surface)] border border-[var(--ui-border)] rounded-3xl rounded-bl-[8px] shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col gap-3">
                  <span className="font-medium text-[14px] text-[var(--ui-text)]">
                    {isGeneratingReport && isGeneratingDashboard ? 'Finalizing Report & Dashboard...' : isGeneratingReport ? 'Report now ready' : 'Dashboard now ready'}
                  </span>
                  <div className="text-[var(--ui-muted)] flex items-center gap-1.5 text-[11px] font-medium">
                    <Loader2 size={12} className="animate-spin" /> Finalizing...
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {isGeneratingReport && (
                    <button 
                      disabled
                      className="bg-black/50 text-[var(--ui-primary-ink)] px-6 py-3 rounded-full font-medium w-max text-[13px] shadow-sm flex items-center gap-2 cursor-not-allowed"
                    >
                      go to reports &rarr;
                    </button>
                  )}
                  {isGeneratingDashboard && (
                    <button 
                      disabled
                      className="bg-black/50 text-[var(--ui-primary-ink)] px-6 py-3 rounded-full font-medium w-max text-[13px] shadow-sm flex items-center gap-2 cursor-not-allowed"
                    >
                      go to dashboards &rarr;
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 shrink-0 bg-[var(--ui-surface)]">
          {/* Active Plugins Bar */}
          <div className="mb-2.5 px-2 flex items-center justify-between text-[11px] text-[var(--ui-muted)]">
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
              <span className="text-[10px] font-bold text-[var(--ui-muted)] uppercase tracking-wider shrink-0 flex items-center gap-1">
                <Zap size={11} className="text-[var(--ui-accent-text)] fill-amber-500" />
                Plugins Aktif:
              </span>
              {['Skyscanner', 'Booking.com', 'Canva', 'GitHub', 'Vercel', 'Supabase', 'COROS'].map((name, i) => (
                <span key={i} className="px-2 py-0.5 rounded-full bg-[var(--ui-soft)] text-[var(--ui-text)] font-medium shrink-0 text-[10px]">
                  {name}
                </span>
              ))}
            </div>
            <button 
              onClick={() => setActiveTab('plugins')}
              className="text-[11px] font-bold text-black hover:underline shrink-0 ml-2 cursor-pointer flex items-center gap-1"
            >
              <span>+ Gedung Plugin</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="relative flex items-center bg-[var(--ui-soft)] rounded-full border border-[var(--ui-border)] p-2 focus-within:ring-2 focus-within:ring-[var(--ui-border)] focus-within:border-[var(--ui-border)] transition-all">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tanya apa sahaja atau aktifkan plugin (cth: cari tiket ke Tokyo, reka poster di Canva, semak PR di GitHub)..."
              disabled={isProcessing}
              className="flex-1 bg-transparent px-5 py-2 outline-none placeholder:text-[var(--ui-muted)] text-[var(--ui-text)] text-[14px] font-medium"
            />
            <button 
              type="submit"
              disabled={!input.trim() || isProcessing}
              className="w-10 h-10 rounded-full bg-[var(--ui-primary)] text-[var(--ui-primary-ink)] flex items-center justify-center disabled:opacity-50 transition-colors ml-2 hover:bg-[var(--ui-primary)] cursor-pointer"
            >
              {isProcessing ? <Loader2 size={16} className="animate-spin text-[var(--ui-primary-ink)]" /> : <Send size={16} className="text-[var(--ui-primary-ink)] relative right-0.5 top-0.5" strokeWidth={2} />}
            </button>
          </form>

          {history.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mt-4 w-full">
              <button onClick={() => onSendMessage("Siasat aduan penutup botol kuah colek bocor (LEAKAGE) di Terengganu menggunakan JEV System-1.")} className="px-4 py-2 bg-[var(--ui-soft)] hover:bg-[var(--ui-soft)] rounded-full transition-all border border-[var(--ui-border)] text-[var(--ui-accent-text)] font-medium text-[12px] cursor-pointer">
                Siasat Aduan Botol Bocor (JEV)
              </button>
              <button onClick={() => onSendMessage("Cari tiket penerbangan murah ke Tokyo Jepun minggu depan di Skyscanner.")} className="px-4 py-2 bg-[var(--ui-soft)] hover:bg-[var(--ui-soft)] rounded-full transition-all border border-[var(--ui-border)] text-[var(--ui-accent-text)] font-medium text-[12px] cursor-pointer">
                Tiket Tokyo (Skyscanner)
              </button>
              <button onClick={() => onSendMessage("Reka poster promosi kombo kuah colek di Canva saiz Instagram 1:1.")} className="px-4 py-2 bg-[var(--ui-soft)] hover:bg-[var(--ui-soft)] rounded-full transition-all border border-[var(--ui-border)] text-[var(--ui-accent-text)] font-medium text-[12px] cursor-pointer">
                Reka Poster (Canva)
              </button>
              <button onClick={() => onSendMessage("Semak Pull Request dan Issues terkini di GitHub.")} className="px-4 py-2 bg-[var(--ui-soft)] hover:bg-[var(--ui-soft)] rounded-full transition-all border border-[var(--ui-border)] text-[var(--ui-text)] font-medium text-[12px] cursor-pointer">
                Semak PR (GitHub)
              </button>
              <button onClick={() => onSendMessage("Semak data latihan COROS dan stamina kecergasan krew gerai hari ini.")} className="px-4 py-2 bg-[var(--ui-soft)] hover:bg-[var(--ui-soft)] rounded-full transition-all border border-[var(--ui-border)] text-orange-700 font-medium text-[12px] cursor-pointer">
                Stamina Krew (COROS)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ReviewsView = ({ onAction }: { onAction: (msg?: string) => void }) => {
  return (
  <div className="p-4 md:p-8 h-full overflow-y-auto">
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-end mb-8 pl-2">
        <div>
          <h2 className="text-3xl font-bold text-[var(--ui-text)] tracking-tight">Maklum Balas & Ulasan Pelanggan</h2>
          <p className="text-[var(--ui-muted)] mt-1 text-[15px] font-medium">Pantau ulasan kuah colek, aduan kebocoran penutup botol, dan klasifikasi JEV System-1.</p>
        </div>
      </div>

      <div className="grid gap-4">
        {MOCK_DB.reviews?.length === 0 ? (
          <div className="text-center py-20 bg-[var(--ui-surface)] rounded-3xl border border-[var(--ui-border)]">
            <p className="text-[var(--ui-muted)] font-medium">No reviews found.</p>
          </div>
        ) : (
          MOCK_DB.reviews?.map((review, i) => {
            const order = appStore.getOrders().find(o => o.order_id === review.order_id);
            const customerName = order?.customer_id || `Pelanggan #${review.order_id}`;
            const reviewText = review.comment_message;
            const reviewDate = review.creation_date;

            return (
              <div key={review.review_id || i} className="bg-[var(--ui-surface)] p-6 rounded-3xl border border-[var(--ui-border)] shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex justify-between items-start transition-all hover:border-[var(--ui-border)]">
                <div className="flex gap-5 max-w-[80%]">
                  <div className="w-12 h-12 bg-[var(--ui-soft)] rounded-full flex items-center justify-center border border-[var(--ui-border)] shrink-0 mt-1">
                    <User className="text-[var(--ui-muted)]" size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-[17px] text-[var(--ui-text)]">{customerName}</span>
                      <span className="text-[12px] text-[var(--ui-muted)]">•</span>
                      <span className="text-[13px] text-[var(--ui-muted)] font-medium">{new Date(reviewDate).toLocaleDateString()}</span>
                      {review.issue_class && (
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                          review.issue_class === 'PRAISE' ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                        )}>
                          {review.issue_class}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1 mb-3">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Sparkles key={star} size={14} className={star <= review.score ? "text-yellow-400 fill-yellow-400" : "text-zinc-200"} />
                      ))}
                    </div>
                    <p className="text-[var(--ui-text)] text-[15px] leading-relaxed mb-3">"{reviewText}"</p>
                    <div className="flex gap-4 text-[12px] font-medium">
                      <span className="flex items-center gap-1.5 text-[var(--ui-muted)] bg-[var(--ui-soft)] px-3 py-1 rounded-full border border-[var(--ui-border)]">Order: <strong className="text-[var(--ui-text)]">{review.order_id}</strong></span>
                      <span className="flex items-center gap-1.5 text-[var(--ui-muted)] bg-[var(--ui-soft)] px-3 py-1 rounded-full border border-[var(--ui-border)]">Category: <strong className="text-[var(--ui-text)] capitalize">{review.product_category}</strong></span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <button 
                    onClick={() => onAction(`Nilaikan maklum balas pelanggan ini menggunakan JEV System-1: "${reviewText}" dan tentukan tindakan operasi.`)} 
                    className="px-4 py-2 text-[12px] font-semibold rounded-full bg-[var(--ui-accent)] hover:brightness-110 text-[var(--ui-accent-ink)] transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
                  >
                    <Flame size={13} />
                    <span>JEV Triage</span>
                  </button>
                  <button 
                    onClick={() => onAction(`Draf respons pelanggan di Gmail untuk ulasan ${review.review_id} bagi pesanan ${review.order_id}.`)} 
                    className="px-4 py-1.5 text-[11px] font-medium rounded-full bg-[var(--ui-surface)] border border-[var(--ui-border)] text-[var(--ui-muted)] hover:text-black hover:border-[var(--ui-border)] transition-colors"
                  >
                    Draf Emel
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  </div>
  );
};

const ReportsView = ({ onAction }: { onAction: (msg?: string) => void }) => {
  const handleGenerateReport = () => {
    onAction("Jana laporan tahunan terperinci prestasi jualan Kuah Colek Buah Abang Colek bagi tahun 2026.");
  };

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-end mb-8 pl-2">
          <div>
            <h2 className="text-3xl font-bold text-[var(--ui-text)] tracking-tight">Laporan Analisis Perniagaan</h2>
            <p className="text-[var(--ui-muted)] mt-1 text-[15px] font-medium">Laporan eksekutif operasi yang dijana secara automatik.</p>
          </div>
          <button onClick={handleGenerateReport} className="px-5 py-2.5 bg-[var(--ui-primary)] text-[var(--ui-primary-ink)] rounded-full text-[13px] font-medium hover:bg-[var(--ui-primary)] transition-colors cursor-pointer">
            + Jana Laporan AI
          </button>
        </div>

        <div className="grid gap-6">
          {MOCK_DB.reports.length === 0 ? (
            <div className="text-center py-20 bg-[var(--ui-surface)] rounded-3xl border border-[var(--ui-border)]">
              <p className="text-[var(--ui-muted)] font-medium">Belum ada laporan dijana. Minta ejen menjana laporan prestasi.</p>
            </div>
          ) : (
            [...MOCK_DB.reports].reverse().map((report, i) => (
              <div key={i} className="bg-[var(--ui-surface)] rounded-[32px] border border-[var(--ui-border)] shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden hover:border-[var(--ui-border)] transition-all">
                <div className="bg-[var(--ui-soft)]/50 px-10 py-6 border-b border-[var(--ui-border)] flex justify-between items-center">
                  <h3 className="font-semibold text-[20px] text-[var(--ui-text)] tracking-tight">{report.title}</h3>
                  <span className="text-[12px] font-medium bg-[var(--ui-surface)] text-[var(--ui-muted)] px-4 py-1.5 rounded-full border border-[var(--ui-border)]">{report.year}</span>
                </div>
                <div className="p-10">
                  <h4 className="font-semibold text-[var(--ui-text)] mb-3 text-[15px]">Executive Summary</h4>
                  <p className="text-[var(--ui-muted)] leading-relaxed mb-10 font-medium text-[14px]">{report.executive_summary}</p>
                  
                  {report.metrics && report.metrics.length > 0 && (
                    <div className="mb-12">
                      <h4 className="font-semibold text-[var(--ui-text)] mb-5 text-[15px]">Key Performance Metrics</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {report.metrics.filter((m: any) => m.value !== 'N/A' && m.value !== 'n/a').map((m: any, idx: number) => (
                          <div key={idx} className="p-6 bg-[var(--ui-soft)]/50 border border-[var(--ui-border)] rounded-3xl">
                            <span className="text-[11px] text-[var(--ui-muted)] font-medium uppercase tracking-wider block mb-2">{m.label}</span>
                            <div className="flex items-end gap-3">
                              <span className="text-[28px] font-semibold text-[var(--ui-text)] tracking-tight leading-none">
                                {m.label.toLowerCase().includes('revenue') || m.label.toLowerCase().includes('value') || m.label.toLowerCase().includes('price') || m.label.toLowerCase().includes('cost') || m.label.toLowerCase().includes('amount') ? 'RM ' : ''}
                                {m.value?.toLocaleString() || 0}
                              </span>
                              {m.trend && m.trend !== 'N/A' && m.trend !== 'n/a' && (
                                <span className={cn(
                                  "text-[13px] font-semibold mb-1",
                                  m.trend.startsWith('+') ? "text-[var(--ui-success-text)]" : m.trend.startsWith('-') ? "text-[var(--ui-danger-text)]" : "text-[var(--ui-muted)]"
                                )}>
                                  {m.trend}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {report.detailed_analysis && (
                    <div className="mb-12 border-t border-[var(--ui-border)] pt-10">
                      <h4 className="font-semibold text-[var(--ui-text)] mb-5 text-[15px]">Detailed Analysis</h4>
                      <div className="markdown-body text-[var(--ui-muted)] text-[14px] leading-relaxed font-medium">
                        <ReactMarkdown>{report.detailed_analysis}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 border-t border-[var(--ui-border)] pt-10">
                    <div>
                      <h4 className="font-semibold text-[var(--ui-text)] mb-5 text-[15px]">Key Insights</h4>
                      <div className="grid gap-4">
                        {report.key_insights?.map((insight: string, idx: number) => (
                          <div key={idx} className="bg-[var(--ui-soft)]/50 p-5 rounded-[24px] flex items-start gap-4 border border-[var(--ui-border)]">
                            <div className="w-6 h-6 rounded-full bg-[var(--ui-surface)] border border-[var(--ui-border)] flex items-center justify-center shrink-0">
                              <CheckCircle2 size={12} className="text-[var(--ui-muted)]" />
                            </div>
                            <span className="text-[var(--ui-muted)] font-medium leading-relaxed text-[13.5px]">{insight}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {report.recommendations && (
                      <div>
                        <h4 className="font-semibold text-[var(--ui-text)] mb-5 text-[15px]">Strategic Recommendations</h4>
                        <div className="grid gap-4">
                          {report.recommendations?.map((rec: string, idx: number) => (
                            <div key={idx} className="bg-[var(--ui-inverse)] text-white p-5 rounded-[24px] flex items-start gap-4">
                              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                                <Sparkles size={12} className="text-white/80" />
                              </div>
                              <span className="text-zinc-200 font-medium leading-relaxed text-[13.5px]">{rec}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const BottomNav = ({ 
  activeTab, 
  setActiveTab, 
  isToolOrPluginInProgress 
}: { 
  activeTab: string; 
  setActiveTab: (t: string) => void;
  isToolOrPluginInProgress?: boolean;
}) => {
  const menuItems = [
    { id: 'dashboards', label: 'Utama', icon: Activity },
    { id: 'orders', label: 'Pesanan', icon: Database },
    { id: 'discovery', label: 'Kualiti', icon: Flame },
    { id: 'chat', label: 'Pembantu', icon: Bot },
  ];

  return (
    <div className="ws-bottom-nav md:hidden flex items-center justify-around bg-[var(--ui-surface)] border-t border-[var(--ui-border)] px-2 py-2.5 shrink-0 pb-safe overflow-x-auto shadow-md">
      {menuItems.map((item) => {
        const isChat = item.id === 'chat';
        const isExecuting = isChat && isToolOrPluginInProgress;

        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            aria-current={activeTab === item.id ? 'page' : undefined}
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition-all shrink-0",
              activeTab === item.id 
                ? "bg-[var(--ui-primary)] text-[var(--ui-primary-ink)] border border-[var(--ui-border)] shadow-xs font-black" 
                : "text-[var(--ui-muted)] hover:text-[var(--ui-accent-text)]",
              isExecuting && activeTab !== item.id && "text-[var(--ui-accent-text)] font-bold"
            )}
          >
            {isExecuting ? (
              <div className="relative flex items-center justify-center">
                <motion.div
                  animate={{ scale: [1, 1.25, 1], opacity: [0.8, 1, 0.8] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  className="flex items-center justify-center"
                >
                  <item.icon 
                    size={18} 
                    strokeWidth={activeTab === item.id ? 2.5 : 2} 
                    className="text-[var(--ui-primary)]" 
                  />
                </motion.div>
                <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2 pointer-events-none">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--ui-primary)] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--ui-accent)]" />
                </span>
              </div>
            ) : (
              <item.icon 
                size={18} 
                strokeWidth={activeTab === item.id ? 2.5 : 2} 
                className={activeTab === item.id ? "text-[var(--ui-primary)]" : ""}
              />
            )}
            <span className="text-[10px] font-bold">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default function App() {
  const { theme, toggleTheme } = useWorkspaceTheme();
  const [activeTab, setActiveTab] = useState('dashboards');
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTool, setCurrentTool] = useState<ToolCall | null>(null);
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([]);
  const [streamingText, setStreamingText] = useState("");
  const [isToolExecuting, setIsToolExecuting] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const { quickStaffSignIn } = useSupabaseAuth();

  // Global Ctrl+K / Cmd+K keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleQuotaExceeded = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
  }, []);

  useEffect(() => {
    return subscribeToolExecution((executing) => {
      setIsToolExecuting(executing);
    });
  }, []);

  const isToolOrPluginInProgress = Boolean(
    isToolExecuting ||
    (isProcessing && (
      Boolean(currentTool) ||
      agentSteps.some(s => s.type === 'tool' && s.status === 'streaming')
    ))
  );

  const handleSendMessage = async (msg: string) => {
    setIsProcessing(true);
    setStreamingText("");
    setAgentSteps([]);
    setCurrentTool(null);
    try {
      await sendMessageToAgentStream(history, msg, (data) => {
        if (data.isDone) {
          setHistory(data.history);
          setIsProcessing(false);
          setStreamingText("");
          setCurrentTool(null);
          setAgentSteps(data.steps);
        } else {
          setHistory(data.history);
          setAgentSteps(data.steps);
          setStreamingText(data.currentText);
          const activeToolStep = data.steps.find(s => s.type === 'tool' && s.status === 'streaming');
          if (activeToolStep) {
            setCurrentTool({
              id: activeToolStep.id,
              name: activeToolStep.toolName || '',
              args: activeToolStep.toolArgs || {}
            });
          } else {
            setCurrentTool(null);
          }
        }
      });
    } catch (e) {
      console.error(e);
      setIsProcessing(false);
      setCurrentTool(null);
    }
  };

  const handleAction = (msg?: string) => {
    setActiveTab('chat');
    if (msg) {
      handleSendMessage(msg);
    }
  };

  return (
    <div data-theme={theme} data-view={activeTab} className="app-shell flex flex-col h-screen overflow-hidden selection:bg-[#8C7DFF] selection:text-[#171422] relative">
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm shrink-0">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        <Sidebar 
          theme={theme}
          onToggleTheme={toggleTheme}
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          isToolOrPluginInProgress={isToolOrPluginInProgress}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        />
        
        {/* Mobile Header with Official Logo */}
        <div className="ws-mobile-header md:hidden flex items-center justify-between px-5 pt-4 pb-3 shrink-0 bg-[var(--ui-surface)] border-b border-[var(--ui-border)] shadow-xs">
          <button onClick={() => setActiveTab('discovery')} className="flex items-center gap-2.5 text-left">
            <img 
              src="/assets/brand/ABANG-COLEX-LOGO-2.png" 
              alt="Abang Colek" 
              className="h-9 w-auto object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <div className="flex flex-col">
              <span className="text-base font-black text-[var(--ui-text)] tracking-tight">ABANG COLEK OS</span>
              <span className="text-[9px] font-bold text-[var(--ui-accent-text)] uppercase tracking-wider">Liurleleh House Malaysia</span>
            </div>
          </button>
          <div className="flex items-center gap-2">
            <button
              aria-label={theme === 'dark' ? 'Tema cerah workspace' : 'Tema gelap workspace'}
              onClick={toggleTheme}
              className="w-11 h-11 rounded-xl bg-[var(--ui-soft)] text-[var(--ui-text)] border border-[var(--ui-border)]"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="p-1.5 rounded-xl bg-[var(--ui-surface)] border border-[var(--ui-border)] text-[var(--ui-text)] hover:text-black shadow-2xs cursor-pointer"
              title="Cari arahan (Ctrl+K)"
            >
              <Search size={16} className="text-[var(--ui-accent-text)]" />
            </button>
            <WorkspaceMobileMenu activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>
        </div>

        <main className="flex-1 flex flex-col overflow-hidden relative px-4 pb-4 pt-2 md:pt-6 md:pb-6 md:pr-6 md:pl-2">
          <div className="flex-1 min-h-0 overflow-y-auto md:overflow-hidden relative">
            {activeTab === 'discovery' && <AbangColekDiscoveryView onAction={handleAction} />}
            {activeTab === 'chat' && (
              <ChatInterface 
                history={history} 
                onSendMessage={handleSendMessage} 
                isProcessing={isProcessing}
                currentTool={currentTool}
                agentSteps={agentSteps}
                streamingText={streamingText}
                setActiveTab={setActiveTab}
              />
            )}
            {activeTab === 'bus_freight' && <BusFreightView onAction={handleAction} />}
            {activeTab === 'agent_performance' && <AgentPerformanceView onAction={handleAction} />}
            {activeTab === 'plugins' && <PluginsView onAction={handleAction} />}
            {activeTab === 'gmail' && <GmailView onAction={handleAction} />}
            {activeTab === 'calendar' && <CalendarView onAction={handleAction} />}
            {activeTab === 'tasks' && <TasksView onAction={handleAction} />}
            {activeTab === 'docs' && <DocsView onAction={handleAction} />}
            {activeTab === 'sheets' && <SheetsView onAction={handleAction} />}
            {activeTab === 'forms' && <FormsView onAction={handleAction} />}
            {activeTab === 'meet' && <MeetView onAction={handleAction} />}
            {activeTab === 'chat_workspace' && <ChatWorkspaceView onAction={handleAction} />}
            {activeTab === 'maps' && <MapsView onAction={handleAction} />}
            {activeTab === 'orders' && <OrdersView onAction={handleAction} />}
            {activeTab === 'reviews' && <ReviewsView onAction={handleAction} />}
            {activeTab === 'reports' && <ReportsView onAction={handleAction} />}
            {activeTab === 'dashboards' && <DashboardView theme={theme} onToggleTheme={toggleTheme} onAction={handleAction} setActiveTab={setActiveTab} dashboards={MOCK_DB.dashboards} />}
          </div>
          
          {activeTab !== 'dashboards' && <div className="mt-4 px-4 text-[11px] text-[var(--ui-muted)] text-center md:text-right shrink-0">
            Intelligence & Discovery via <a href="https://github.com/thisisabangcolek-web/Abang-Colek.git" target="_blank" className="underline hover:text-[var(--ui-muted)] font-medium">ABANGCOLEK Discovery Engine (v4.2.0)</a>
          </div>}
        </main>
      </div>

      <BottomNav 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isToolOrPluginInProgress={isToolOrPluginInProgress} 
      />

      {/* Global Command Palette (Ctrl+K / Cmd+K) */}
      <CommandPalette 
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          setIsCommandPaletteOpen(false);
        }}
        onTriggerAction={(prompt) => {
          handleAction(prompt);
          setIsCommandPaletteOpen(false);
        }}
        onSwitchStaff={(role) => {
          quickStaffSignIn(role);
          setIsCommandPaletteOpen(false);
        }}
      />
    </div>
  );
}
