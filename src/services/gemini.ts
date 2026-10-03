/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { Type, Content } from "@google/genai";
import { getGeminiClient } from './geminiClient';
import realData from '../data.json';
import { getAccessToken } from './googleAuth';
import { 
  createGoogleFormWithQuestions, 
  listGoogleForms, 
  getGoogleForm, 
  getGoogleFormResponses 
} from './googleForms';
import { sendGmailMessage, listGmailMessages } from './googleGmail';
import { createGoogleTask, listGoogleTasks } from './googleTasks';
import { createGoogleDoc, listGoogleDocs } from './googleDocs';
import { createCalendarEvent, listCalendarEvents } from './googleCalendar';
import { createGoogleSpreadsheet, listGoogleSheets } from './googleSheets';
import { createGoogleMeetSpace } from './googleMeet';
import { sendChatMessage, listChatSpaces } from './googleChat';
import { evaluateWithJev, JevClassificationResult } from './jevEngine';
import { appStore } from './store';
import {
  executeSkyscannerSearch,
  executeBookingSearch,
  executeCanvaDesign,
  executeAdobeProcess,
  executeGitHubManage,
  executeVercelStatus,
  executeSupabaseQuery,
  executeMixpanelAnalytics,
  executeCorosMetrics,
  executeAppleHealthSummary,
  executeGoogleDriveSearch,
  executeRedBusSchedules,
  executeBusConsignmentDispatch,
  executeBusStatusNotice
} from './pluginExecutors';
import { pluginManager } from './pluginService';
import { supabaseAgentPerformance } from './supabaseAgentPerformance';

// Initialize Gemini Client
// We use the recommended 'gemini-3.8-flash' model

export const MODEL_NAME = "gemini-3.8-flash";

export interface ChatMessage extends Content {
  timestamp: Date;
  latencyMs?: number;
  groundingMetadata?: any;
  hasReport?: boolean;
  hasDashboard?: boolean;
  hasForm?: boolean;
  formData?: any;
  hasEmail?: boolean;
  emailData?: any;
  hasTask?: boolean;
  taskData?: any;
  hasDoc?: boolean;
  docData?: any;
  hasCalendar?: boolean;
  calendarData?: any;
  hasSheet?: boolean;
  sheetData?: any;
  hasMeet?: boolean;
  meetData?: any;
  hasChat?: boolean;
  chatData?: any;
  hasJev?: boolean;
  jevData?: JevClassificationResult;
  hasPlugin?: boolean;
  pluginType?: string;
  pluginData?: any;
}

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, any>;
}

export interface ToolResult {
  id: string;
  name: string;
  result: any;
}

export type ToolExecutionListener = (isExecuting: boolean, toolName?: string) => void;
const toolExecutionListeners = new Set<ToolExecutionListener>();

export function subscribeToolExecution(callback: ToolExecutionListener): () => void {
  toolExecutionListeners.add(callback);
  return () => {
    toolExecutionListeners.delete(callback);
  };
}

export function notifyToolExecution(isExecuting: boolean, toolName?: string): void {
  toolExecutionListeners.forEach(listener => {
    try {
      listener(isExecuting, toolName);
    } catch (e) {
      console.error("Error in toolExecutionListener", e);
    }
  });
}

export const MASTER_SYSTEM_INSTRUCTION = `You are the master AI Operations Agent for ABANGCOLEK-OS (v4.2), the operational intelligence system for Malaysia's premier F&B fruit-dip brand ABANGCOLEK and STYLOAIRPOOL (Liurleleh House Malaysia).
Founder & Brand Head: Megat Shaifulreza (Epull).
Your goal is to autonomously handle retail operations, investigate packaging and shipping issues (especially bottle seal leakage 'LEAKAGE'), manage regional stockists (Terengganu, Shah Alam, Bangi), manage live orders in Malaysian Ringgit (MYR/RM), draft marketing content & 15-slide pitch decks, execute WOCS WhatsApp commands, and orchestrate Google Workspace workflows (Gmail, Tasks, Docs, Sheets, Forms, Meet, Calendar, Maps).

Core Business Knowledge:
- Founder & Entity: Megat Shaifulreza (Epull), Pengasas & Wajah Jenama (Liurleleh House Malaysia). Hands-on founder who sells and talks directly with customers at street booths.
- 3 Contextual Taglines:
  * Formal/Print: "Rasa Padu, Pedas Menggamit"
  * Social/TikTok: "PEDAS MANIS LIKAT MELEKAT 🌶️🥭"
  * Emotional: "Rasa Sekali Jatuh Cinta Selamanya"
- Official Brand Song / Jingle: "Kasi Lagi-Lagi" (Hip-hop/trap anthem, 85-95 BPM, signature chant: "ABANG CHO-LEK! SAMBAL CHO-LEK! PEDAS! PADU!").
- Core Products & Pricing:
  * 250ml: RM 15
  * 500ml: RM 28 (Best seller: Kuah Colek Buah Original 500g)
  * 1 Liter: RM 50
  * Promo: Beli 3 Botol Percuma 1 Botol!
  * Jeruk Mangga & Kedondong: RM 12
  * Pakej Niaga Ejen Permulaan (50 Botol): RM 850
- WOCS (WhatsApp Operating Command System) Syntax:
  * /landing title=... theme=... (Generate landing page)
  * /config key=... value=... (System configuration)
  * /assign agent=... hub=... cargo=... (Dispatch stock to agent)
  * /tiktok hook=... date=... (Schedule viral video)
  * /report type=sales range=weekly (Generate performance report)
- TikTok Strategy (@styloairpool, 75.2K followers, 793.2K likes, 10.5x ER):
  * Posting Cadence: Mon (First Bite Reaction), Wed (Pedas Challenge), Fri (Founder Moment), Sat (Crowd Energy).
  * 5 Golden Rules: Phone camera only, authentic street slang, no over-polishing, no fake paid reactions, always use 'Kasi Lagi-Lagi' sound.
- Official 15-Slide Investor Pitch Deck:
  1. ABANG COLEK (Street Taste. Real Talk.)
  2. What We Are (Rasa Ekstrem + Karakter Manusia)
  3. Founder (Megat Shaifulreza Turun Padang)
  4. Market Problem (Street food banyak, karakter tiada)
  5. Our Answer (Jual pengalaman, cabaran rasa, cerita)
  6. Product Truth (Reaksi pelanggan adalah iklan terbaik)
  7. Brand DNA (Pedas • Berani • Kelakar • Street)
  8. Content Engine (TikTok tanpa skrip, tiada lakonan)
  9. Audience (Gen Z & Millennial urban street culture)
  10. Traction (Booth penuh, repeat customer tinggi)
  11. Competitive Edge (Rasa boleh ditiru, karakter tidak)
  12. Expansion (Event tour -> Merch -> Lagu jenama -> Ejen hab)
  13. Vision 2026 (Cultural footprint street food Nusantara)
  14. Closing (Bukan semua orang tahan)
  15. Contact (@styloairpool | Liurleleh House)
- Real Malaysian Hubs: Johor Bahru (HQ & Toppen booth, Pasar Karat), Shah Alam Central Hub, Bangi Pop-up Hub, Kuala Terengganu Stokis (@jeruxsliurlelehterengganu), Kota Bharu, Melaka, and Penang.
- Express Bus Freight & 1-Hour SOP: Deliveries routed through Terminal Bersepadu Selatan (TBS), MBKT Kuala Terengganu, Lembah Sireh Kota Bharu, Larkin JB with automated WhatsApp ETA and 1-hour outstation alerts.
- Currency: ALWAYS use Malaysian Ringgit (RM) for all amounts.
- TypeSafe JEV System-1: Use 'jev_classify_issue' whenever evaluating a customer complaint or message across 7 dimensions (Brand, BusinessFunction, SalesChannel, CustomerIntent, IssueClass, ProcessStage, RootCauseStatus).
- Strict Root Cause Invariant: For bottle leakage/seal issues, issueClass is 'LEAKAGE' or 'SEAL_FAILURE', but Root Cause MUST remain 'UNDETERMINED' until factory lot or shipping defect proof is verified.
- 8 Foundational Business Questions: Use 'update_business_workflow' to manage owner sign-off and risk status for ORDER_FLOW, STOCK_OWNERSHIP, AGENT_RESTOCK, COMPLAINT_TRACE, PRODUCTION_TRACE, TRANSPORT_TRACE, EVENT_CREW, PAYMENT_CLOSE.
- Live Orders: Use 'create_order' to record new sales or 'issue_refund' to approve refunds with persistent tracking.
- Google Workspace: Fully utilize 'send_gmail_email', 'create_google_task', 'create_google_doc', 'schedule_calendar_event', 'create_google_sheet', 'create_google_form', 'create_meet_space', and 'send_chat_message'.
- 3P Plugins Ecosystem: You are empowered with active 3P Plugins to execute real actions and retrieve live external account data:
  * Skyscanner ('skyscanner_search_flights'): Search flight tickets, airlines, airfares (MYR), and direct booking links.
  * Booking.com ('booking_search_hotels'): Search hotels, homestays for stall crews, room rates (MYR), and amenities.
  * Canva ('canva_generate_design'): Generate marketing graphic designs, promotional posters (1:1, 9:16, 16:9), and direct Canva editing links.
  * Adobe ('adobe_process_asset'): Process high-res images, remove backgrounds, and export print-ready CMYK assets.
  * GitHub ('github_manage_repo'): Inspect PRs, issues, commits, and create bug issues on 'thisisabangcolek-web/Abang-Colek'.
  * Vercel ('vercel_deploy_status'): Check production deployment status, preview URLs, build times, and Edge regions.
  * Supabase ('supabase_query_db'): Query PostgreSQL tables (evidence_snapshots, orders, entities) with RLS security.
  * Mixpanel ('mixpanel_track_analytics'): Analyze conversion funnels (TikTok -> WhatsApp -> pop-up stalls) and retention.
  * COROS ('coros_health_metrics'): Monitor athlete/crew fitness stamina, daily steps, heart rate zones, and recovery hours.
  * Apple Health ('apple_health_summary'): Check daily steps, calories burned, sleep metrics, and resting heart rate.
  * Google Drive ('google_drive_search_files'): Search PDF pricing catalogs, SOP documents, and spreadsheets in Drive.
When a user asks to search flights, find hotels, design posters, check GitHub, query database, or check health data, immediately call the corresponding plugin tool.
- Installed Internal Engineering & JEV Skills Library (in /skills/ - 172 skills across 11 domains):
  You have native access to 172 specialized engineering & JEV skills:
  * superpowers (obra/superpowers): brainstorming, executing-plans, subagent-driven-development, systematic-debugging, test-driven-development, verification-before-completion, finishing-a-development-branch, requesting-code-review.
  * jev-core (madewithjev.com & Charlie Hills Top 20):
    - Context & Memory: fast-jev-compaction, winnow, neo4jev, semdecide.
    - Agents that Act: jev-ultrafast (<50ms web tasks), agent-desktop, jev-drone, blink (codebase navigation).
    - Build & Judge: json-render, canny (verification gate), jev-curate, killmyidea (startup risk scoring).
    - Dev Workflow: typesafe-mcp, jev-mcp (deliberation tool), jev-codex-router, jev-review.
    - Markets & Play: jev-trader, prism, typesafe-mario, onevonejev.
    - Agentic Levels (YouTube: _U-O5lYhJ7Q & 2nc_QMuNp18): 10 Levels of Jev for Agentic Engineers & 7 Production Use Cases (Fast Compaction, Jev as Judge, Dynamic Skill Picker, Guardrail Enforcement).
  * 9 Architecture & DevOps Domains: architecture-design (15), codegen-scaffolding (15), data-analytics (15), devops-infra (20), documentation-knowledge (15), maintenance-optimization (15), meta (11), security-compliance (15), testing-quality (15).
  Consult and apply these skill procedures whenever engineering, architectural, or DevOps operations are requested.
- Nous Hermes Agent & DeepSeek-R1 Operational Paradigms:
  * DeepSeek-R1 Dual-Phase Inference: You may internally deliberate using '<think> ... </think>' tags for complex logistical calculations, fraud risk detection, and packaging leak post-mortems. Keep the internal reasoning trace rigorous and objective; then provide a polite, concise, culturally grounded response outside the tags.
  * Nous Hermes Closed Learning Loop: Maintain long-lived operational memory across turns. When encountering novel operational scenarios, synthesize new reusable procedural knowledge adhering to JEV invariants.
  * Strict Schema Adherence: Validate all tool arguments strictly against closed algebraic types (JevChoice, JevScore, JevNoul) before invoking workspace or plugin tools.

Behavior:
- Be proactive, efficient, and direct in Malay or English as requested by the user.
- Strictly ground all metrics in the live database without hallucinating foreign data.
- When creating dashboards, use aggregated data from tool results (like 'monthly_breakdown', 'top_cities_revenue', 'order_status_breakdown').
- When generating reports with 'generate_yearly_report', include detailed analysis, specific metric objects with trends, and strategic recommendations.
- When you call generate_yearly_report or create_operations_dashboard, do not output any conversational text afterwards.`;

// Live Persistent Database for the agent to interact with (Abang Colek & Workspace data)
export const MOCK_DB = {
  get orders() { return appStore.getOrders(); },
  dashboards: [] as any[],
  reports: [] as any[],
  agents: [] as any[],
  get reviews() { return appStore.getReviews(); },
  customer_responses: [] as any[],
  forms: [] as any[],
  form_responses: [] as any[],
  emails: [] as any[],
  tasks: [] as any[],
  docs: [] as any[],
  events: [] as any[],
  sheets: [] as any[],
  meet_spaces: [] as any[],
  chat_messages: [] as any[],
};

// Tool Definitions
export const tools = [
  {
    functionDeclarations: [
      {
        name: "analyze_sales_performance",
        description: "Fetches revenue (MYR) and order volume data for Abang Colek by date range, category, or Malaysian city.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            date_range: { type: Type.STRING, description: "e.g., '2026-Q3' or 'last 30 days'" },
            group_by: { type: Type.STRING, description: "e.g., 'product_category', 'city'" },
            city: { type: Type.STRING, description: "Optional Malaysian city to filter sales data by (e.g., 'johor bahru', 'shah alam', 'kuala terengganu', 'bangi')" }
          },
          required: ["date_range"],
        },
      },
      {
        name: "investigate_shipping_delays",
        description: "Cross-references delivery dates to find bottlenecks in courier shipments across Malaysia.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            region: { type: Type.STRING, description: "e.g., 'kuala terengganu', 'melaka', 'shah alam'" },
          },
          required: [],
        },
      },
      {
        name: "analyze_customer_sentiment",
        description: "Pulls review scores and text for Abang Colek Kuah Colek Buah, rojak, jeruk, or packaging issues.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            product_category: { type: Type.STRING, description: "Category of product (e.g. 'kuah colek', 'jeruk', 'buah potong')" },
            score_filter: { type: Type.NUMBER, description: "Review score to filter by (1 to 5)" }
          },
          required: [],
        },
      },
      {
        name: "jev_classify_issue",
        description: "Runs the TypeSafe JEV System-1 engine on a customer inquiry, complaint, or operational message across 7 dimensions (Brand, BusinessFunction, SalesChannel, CustomerIntent, IssueClass, ProcessStage, RootCauseStatus) and returns confidence scores and recommended SOPs.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            message: { type: Type.STRING, description: "Customer complaint, inquiry, or operational text to evaluate" }
          },
          required: ["message"]
        }
      },
      {
        name: "update_business_workflow",
        description: "Updates owner sign-off and operational status for one of the 8 Foundational Business Questions (e.g., 'ORDER_FLOW', 'COMPLAINT_TRACE', 'AGENT_RESTOCK', etc.)",
        parameters: {
          type: Type.OBJECT,
          properties: {
            workflow_id: { type: Type.STRING, description: "One of the 8 IDs: ORDER_FLOW, STOCK_OWNERSHIP, AGENT_RESTOCK, COMPLAINT_TRACE, PRODUCTION_TRACE, TRANSPORT_TRACE, EVENT_CREW, PAYMENT_CLOSE" },
            signoff: { type: Type.BOOLEAN, description: "True to verify and sign off, false to gate" },
            notes: { type: Type.STRING, description: "Operational notes or SOP policy decided" }
          },
          required: ["workflow_id", "signoff"]
        }
      },
      {
        name: "create_order",
        description: "Creates and records a real customer or agent order in the Abang Colek database.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            customer_id: { type: Type.STRING, description: "Customer name or phone/ID" },
            city: { type: Type.STRING, description: "Delivery city (e.g., 'johor bahru', 'shah alam', 'kuala terengganu', 'bangi')" },
            items: { type: Type.STRING, description: "List of items ordered (e.g., '5x Kuah Colek Buah Original (500g)')" },
            amount: { type: Type.NUMBER, description: "Total order amount in MYR (RM)" },
            status: { type: Type.STRING, description: "Order status: 'Processing' | 'Delivered' | 'Delayed'" }
          },
          required: ["customer_id", "city", "items", "amount"]
        }
      },
      {
        name: "issue_refund",
        description: "Updates the status of an order in the database and records a refund in MYR (RM).",
        parameters: {
          type: Type.OBJECT,
          properties: {
            order_id: { type: Type.STRING, description: "The ID of the order to refund" },
            refund_amount: { type: Type.NUMBER, description: "The amount in MYR (RM) to refund" },
            reason_code: { type: Type.STRING, description: "Reason for the refund (e.g., 'LEAKAGE - Botol bocor')" }
          },
          required: ["order_id", "refund_amount"],
        },
      },
      {
        name: "draft_customer_response",
        description: "Generates and saves a draft response to a specific customer review.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            customer_id: { type: Type.STRING },
            review_id: { type: Type.STRING },
            proposed_solution: { type: Type.STRING, description: "What to offer the customer (e.g., 20% discount)" }
          },
          required: ["customer_id", "review_id", "proposed_solution"],
        },
      },
      {
        name: "start_ai_agent",
        description: "Start a sub-agent to complete a complex analysis or data gathering task autonomously.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            agent_name: { type: Type.STRING, description: "Name of the sub-agent" },
            task_description: { type: Type.STRING, description: "Detailed description of the complex task for the sub-agent to complete" },
          },
          required: ["agent_name", "task_description"],
        },
      },
      {
        name: "generate_yearly_report",
        description: "Generate a detailed text-based business report. Do NOT use this tool if the user asks for a dashboard.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            year: { type: Type.NUMBER },
            executive_summary: { type: Type.STRING, description: "High-level summary of the findings" },
            detailed_analysis: { type: Type.STRING, description: "In-depth plain-text analysis and business narrative. Do NOT use markdown." },
            key_insights: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of key insights" },
            metrics: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  value: { type: Type.NUMBER },
                  trend: { type: Type.STRING, description: "e.g. '+15%', '-5%'" }
                }
              },
              description: "Key financial and operational metrics to visualize"
            },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Strategic recommendations based on data" },
          },
          required: ["title", "year", "executive_summary", "detailed_analysis", "key_insights", "metrics", "recommendations"],
        },
      },
      {
        name: "create_operations_dashboard",
        description: "Create a rich data visualization dashboard. You MUST use this tool (and not the report tool) when the user asks for a dashboard.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            kpis: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  value: { type: Type.STRING },
                  trend: { type: Type.STRING, description: "e.g., '+12%', '-5%'" }
                }
              },
              description: "Top-level summary metrics"
            },
            main_chart: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                type: { type: Type.STRING, description: "Type of chart (e.g., 'bar', 'line')" },
                data: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      label: { type: Type.STRING },
                      value: { type: Type.NUMBER }
                    }
                  }
                }
              }
            },
            secondary_chart: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                type: { type: Type.STRING, description: "Type of chart (e.g., 'pie', 'bar')" },
                data: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      label: { type: Type.STRING },
                      value: { type: Type.NUMBER }
                    }
                  }
                }
              },
              description: "An additional chart to show secondary insights (like category breakdowns)"
            },
            recent_activity: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING }
                }
              },
              description: "List of 3-5 recent data points or quick insight bullets related to the dashboard"
            }
          },
          required: ["title", "kpis", "main_chart", "secondary_chart", "recent_activity"],
        },
      },
      {
        name: "create_google_form",
        description: "Creates a new Google Form with custom questions in Google Drive (e.g. for customer satisfaction, post-delivery feedback, return requests).",
        parameters: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Title of the Google Form" },
            description: { type: Type.STRING, description: "Introductory description or instructions for respondents" },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "Question prompt text" },
                  type: { type: Type.STRING, description: "Question type: 'choice', 'text', or 'scale'" },
                  choiceType: { type: Type.STRING, description: "Optional: 'RADIO', 'CHECKBOX', or 'DROP_DOWN' for choice questions" },
                  options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Options for multiple-choice questions" },
                  required: { type: Type.BOOLEAN, description: "Whether this question is required" }
                },
                required: ["title", "type"]
              },
              description: "Questions to create in the Google Form"
            }
          },
          required: ["title", "questions"]
        }
      },
      {
        name: "list_google_forms",
        description: "Retrieves all Google Forms created or available in Google Drive.",
        parameters: {
          type: Type.OBJECT,
          properties: {},
          required: []
        }
      },
      {
        name: "analyze_form_responses",
        description: "Fetches and analyzes responses from a Google Form to extract satisfaction trends, feedback summary, and action items.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            form_id: { type: Type.STRING, description: "The Google Form ID to analyze" }
          },
          required: ["form_id"]
        }
      },
      {
        name: "send_gmail_email",
        description: "Sends an email to a customer, partner, or colleague using Gmail.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            to: { type: Type.STRING, description: "Recipient email address" },
            subject: { type: Type.STRING, description: "Subject of the email" },
            body: { type: Type.STRING, description: "Body text of the email message" }
          },
          required: ["to", "subject", "body"]
        }
      },
      {
        name: "create_google_task",
        description: "Creates a new operational action item in Google Tasks.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Title of the task" },
            notes: { type: Type.STRING, description: "Optional notes or details" },
            due: { type: Type.STRING, description: "Optional ISO date or deadline" }
          },
          required: ["title"]
        }
      },
      {
        name: "create_google_doc",
        description: "Creates a formal Google Doc report or Standard Operating Procedure in Google Drive.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Document title" },
            content: { type: Type.STRING, description: "Body text or outline content of the document" }
          },
          required: ["title"]
        }
      },
      {
        name: "list_gmail_messages",
        description: "Searches and lists recent emails from Gmail inbox.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            query: { type: Type.STRING, description: "Optional search query" }
          },
          required: []
        }
      },
      {
        name: "list_google_tasks",
        description: "Lists current pending and completed tasks from Google Tasks.",
        parameters: {
          type: Type.OBJECT,
          properties: {},
          required: []
        }
      },
      {
        name: "schedule_calendar_event",
        description: "Schedules a business meeting, operational review, or reminder event in Google Calendar.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: "Title of the calendar event" },
            start_time: { type: Type.STRING, description: "ISO 8601 start date-time string (e.g. 2026-10-01T10:00:00Z)" },
            end_time: { type: Type.STRING, description: "ISO 8601 end date-time string (e.g. 2026-10-01T11:00:00Z)" },
            description: { type: Type.STRING, description: "Meeting description or agenda" },
            location: { type: Type.STRING, description: "Meeting location or conference link" }
          },
          required: ["summary", "start_time", "end_time"]
        }
      },
      {
        name: "list_calendar_events",
        description: "Retrieves upcoming events from the user's primary Google Calendar.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            max_results: { type: Type.NUMBER, description: "Maximum number of events to return" }
          },
          required: []
        }
      },
      {
        name: "create_google_sheet",
        description: "Creates and exports tabular data (sales reports, orders list, metrics) into a live Google Spreadsheet.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Title of the spreadsheet" },
            headers: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Column header names" },
            rows: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING } 
              }, 
              description: "2D array of rows values" 
            }
          },
          required: ["title", "headers", "rows"]
        }
      },
      {
        name: "create_meet_space",
        description: "Creates a Google Meet video conference space for rapid collaboration or client meetings.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Optional topic or purpose of the meeting" }
          },
          required: []
        }
      },
      {
        name: "send_chat_message",
        description: "Sends a direct message or channel update to a Google Chat space.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            space_name: { type: Type.STRING, description: "Google Chat space identifier (e.g., 'spaces/AAAAAAAAAAA')" },
            message_text: { type: Type.STRING, description: "The content text of the message to send" }
          },
          required: ["space_name", "message_text"]
        }
      },
      // --- 3P Plugins Ecosystem ---
      {
        name: "skyscanner_search_flights",
        description: "PLUGIN (Skyscanner): Search cheap flights, airfares, airlines (Malaysia Airlines, AirAsia, ANA, etc.), schedules and ticket prices (MYR).",
        parameters: {
          type: Type.OBJECT,
          properties: {
            origin: { type: Type.STRING, description: "Origin city or airport code (e.g., 'KUL', 'JHB', 'Kuala Lumpur')" },
            destination: { type: Type.STRING, description: "Destination city or airport code (e.g., 'Tokyo', 'Terengganu', 'Kota Kinabalu', 'London')" },
            depart_date: { type: Type.STRING, description: "Optional departure date (e.g., 'next week', '2026-10-15')" },
            passengers: { type: Type.NUMBER, description: "Number of passengers" }
          },
          required: ["destination"]
        }
      },
      {
        name: "booking_search_hotels",
        description: "PLUGIN (Booking.com): Search and book hotels, homestays, room rates (MYR), review scores, and amenities across cities.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            destination: { type: Type.STRING, description: "Destination city or landmark (e.g., 'Johor Bahru', 'Toppen Shopping Centre', 'Tokyo', 'Terengganu')" },
            nights: { type: Type.NUMBER, description: "Number of nights stay" },
            guests: { type: Type.NUMBER, description: "Number of guests" }
          },
          required: ["destination"]
        }
      },
      {
        name: "canva_generate_design",
        description: "PLUGIN (Canva): Generate promotional posters, social media banners (Instagram 1:1, Story 9:16, Banner 16:9), and marketing graphics via Canva.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Headline or title of the marketing banner/poster" },
            type: { type: Type.STRING, description: "Design type: 'poster' | 'instagram_post' | 'story' | 'banner'" },
            theme: { type: Type.STRING, description: "Design visual theme or colors (e.g. 'red spicy', 'festival pop-up')" },
            promoText: { type: Type.STRING, description: "Special offer or description copy" }
          },
          required: ["title"]
        }
      },
      {
        name: "adobe_process_asset",
        description: "PLUGIN (Adobe Creative Cloud): Process high-resolution graphics, remove backgrounds, convert to print-ready CMYK, and upscale assets.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            asset_name: { type: Type.STRING, description: "Name of asset or image (e.g., 'botol_kuah_colek.png')" },
            operation: { type: Type.STRING, description: "One of: 'remove_background', 'upscale_resolution', 'cmyk_color_profile'" }
          },
          required: ["asset_name", "operation"]
        }
      },
      {
        name: "github_manage_repo",
        description: "PLUGIN (GitHub): Manage Pull Requests (PR), inspect code diffs, track issues, and list commits on repository 'thisisabangcolek-web/Abang-Colek'.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            action: { type: Type.STRING, description: "Action: 'list_prs' | 'list_issues' | 'create_issue' | 'list_commits'" },
            title: { type: Type.STRING, description: "Title if creating an issue" },
            body: { type: Type.STRING, description: "Details of issue or PR" }
          },
          required: ["action"]
        }
      },
      {
        name: "vercel_deploy_status",
        description: "PLUGIN (Vercel): Deploy project to Vercel production (vprod), check deployment health, verify auto-deployment from GitHub thisisabangcolek-web/Abang-Colek, and verify domain abangcolek-os.vercel.app.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            action: { type: Type.STRING, description: "Action: 'status' to inspect health, or 'deploy' to trigger production deployment" }
          },
          required: []
        }
      },
      {
        name: "supabase_query_db",
        description: "PLUGIN (Supabase): Run safe SQL queries, check RLS security policies, and inspect orders, inventory, and JEV audit logs in live PostgreSQL on project bktksvhcgszaoqkdyhil.supabase.co.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            table: { type: Type.STRING, description: "Table name (e.g. 'orders', 'inventory', 'jev_audit_logs')" },
            query: { type: Type.STRING, description: "SQL query statement" }
          },
          required: []
        }
      },
      {
        name: "mixpanel_track_analytics",
        description: "PLUGIN (Mixpanel): Analyze product conversion funnels (TikTok to WhatsApp to stalls), retention cohorts, and user event tracking.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            metric: { type: Type.STRING, description: "Metric type: 'funnel' | 'retention' | 'events'" }
          },
          required: []
        }
      },
      {
        name: "coros_health_metrics",
        description: "PLUGIN (COROS): Track athlete and crew fitness stamina, training load, heart rate zones, and physical recovery hours.",
        parameters: {
          type: Type.OBJECT,
          properties: {},
          required: []
        }
      },
      {
        name: "apple_health_summary",
        description: "PLUGIN (Apple Health): Track daily steps, active calories burned, sleep quality hours, and resting heart rate.",
        parameters: {
          type: Type.OBJECT,
          properties: {},
          required: []
        }
      },
      {
        name: "google_drive_search_files",
        description: "PLUGIN (Google Drive): Search documents, PDFs, pricing catalogs, and spreadsheets stored in Google Drive.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            query: { type: Type.STRING, description: "Keyword or file name to search" }
          },
          required: []
        }
      },
      {
        name: "redbus_bus_freight_schedule",
        description: "PLUGIN (redBus Malaysia): Dapatkan jadual bas ekspres masa nyata dari TBS (Terminal Bersepadu Selatan) atau terminal lain ke seluruh Semenanjung (Kuala Terengganu, Kota Bharu, Penang, Johor, Kuantan, Melaka, Ipoh) lengkap dengan masa berlepas, tiba, platform, kadar kargo (RM30-50), dan pautan rasmi redBus.my.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            originCity: { type: Type.STRING, description: "Bandar atau terminal asal (contoh: 'Kuala Lumpur', 'TBS', 'Johor Bahru')" },
            destinationCity: { type: Type.STRING, description: "Bandar destinasi ejen (contoh: 'Kuala Terengganu', 'Kota Bharu', 'Penang', 'Kuantan', 'Ipoh')" }
          },
          required: []
        }
      },
      {
        name: "bus_freight_dispatch_create",
        description: "PLUGIN (Bus Freight): Daftar konsinan penghantaran kargo bas ABANGCOLEK di terminal (contoh: TBS), rekod bayaran DuitNow QR pemandu bas, no plat bas, masa berlepas & sampai, butiran ejen & driver, serta jana notis WhatsApp rasmi ke ejen.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            companyName: { type: Type.STRING, description: "Nama syarikat bas (contoh: Sani Express, Adik Beradik, Perdana Express, KKKL)" },
            busPlateNo: { type: Type.STRING, description: "Nombor pendaftaran / plat bas (contoh: VDF 8821, DDA 5439)" },
            driverName: { type: Type.STRING, description: "Nama driver bas" },
            driverPhone: { type: Type.STRING, description: "Nombor telefon / WhatsApp driver bas" },
            originTerminal: { type: Type.STRING, description: "Terminal asal serahan stok (contoh: 'Terminal Bersepadu Selatan (TBS), KL')" },
            destinationTerminal: { type: Type.STRING, description: "Terminal destinasi ambilan ejen" },
            departureTime: { type: Type.STRING, description: "Masa berlepas (contoh: '09:30 AM')" },
            estimatedArrivalTime: { type: Type.STRING, description: "Anggaran masa tiba (ETA) (contoh: '03:45 PM')" },
            agentName: { type: Type.STRING, description: "Nama ejen penerima (contoh: 'Kak Mas (@jeruxsliurlelehterengganu)')" },
            agentPhone: { type: Type.STRING, description: "Nombor telefon ejen penerima" },
            agentHub: { type: Type.STRING, description: "Bandar / hub ejen (contoh: 'Kuala Terengganu')" },
            destinationAddress: { type: Type.STRING, description: "Lokasi platform / kaunter ambilan" },
            cargoFeeMyr: { type: Type.NUMBER, description: "Upah kargo pemandu dibayar melalui DuitNow QR (contoh: 40)" },
            packageDescription: { type: Type.STRING, description: "Penerangan bungkusan (contoh: '2 Kotak Tebal 100 Botol Kuah Colek')" },
            boxCount: { type: Type.NUMBER, description: "Bilangan kotak" },
            bottleCount: { type: Type.NUMBER, description: "Jumlah botol kuah colek" },
            notes: { type: Type.STRING, description: "Nota serahan kargo" }
          },
          required: ["companyName", "busPlateNo", "driverName", "driverPhone", "agentName", "agentPhone"]
        }
      },
      {
        name: "bus_freight_update_arrival_notice",
        description: "PLUGIN (Bus Freight): Kemas kini status SOP 1 jam sebelum sampai (driver hubungi ejen), sahkan tuntutan stok di terminal, atau semak hak ejen berhubung terus dengan pemandu bas.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            consignmentId: { type: Type.STRING, description: "ID konsinan (contoh: 'BFG-2026-081')" },
            action: { type: Type.STRING, description: "'one_hour_alert' (driver call ejen 1 jam sebelum tiba) | 'agent_contact_driver' (hak komunikasi terus ejen) | 'confirm_collected' (selesai tuntut)" },
            notes: { type: Type.STRING, description: "Catatan kemas kini lokasi atau status" }
          },
          required: ["action"]
        }
      }
    ],
  },
];

export interface AgentStep {
  id: string;
  type: 'text' | 'tool';
  content?: string;
  toolName?: string;
  toolArgs?: any;
  result?: any;
  status: 'pending' | 'streaming' | 'completed' | 'error';
  latencyMs?: number;
}

export async function sendMessageToAgentStream(
  history: ChatMessage[],
  newMessage: string,
  onUpdate: (data: { history: ChatMessage[], steps: AgentStep[], isDone: boolean, currentText: string }) => void
): Promise<void> {
  const sdkHistory = history
    .filter(h => h.role !== 'system')
    .map(h => {
      const { timestamp, latencyMs, groundingMetadata, ...content } = h;
      return content;
    });

  const contents: Content[] = [
    ...sdkHistory,
    { role: "user", parts: [{ text: newMessage }] }
  ];
  
  const config = {
    tools: tools,
    systemInstruction: MASTER_SYSTEM_INSTRUCTION,
  };

  let currentHistory = [...history];
  const userMsg: ChatMessage = { role: "user", parts: [{ text: newMessage }], timestamp: new Date() };
  currentHistory.push(userMsg);
  
  let steps: AgentStep[] = [];
  let keepGoing = true;
  let maxSteps = 5;
  let stepCount = 0;
  let finalFullText = "";
  const totalStartTime = performance.now();

  const notify = (isDone: boolean = false, text: string = "") => {
    onUpdate({
      history: currentHistory,
      steps: [...steps],
      isDone,
      currentText: text
    });
  };

  try {
    let lastAggregatedParts: any[] = [];
    while (keepGoing && stepCount < maxSteps) {
      stepCount++;
      
      let responseStream = await getGeminiClient().models.generateContentStream({
        model: MODEL_NAME,
        contents: contents,
        config: config
      });

      let turnText = "";
      let functionCalls: any[] = [];
      let aggregatedParts: any[] = [];
      let lastChunkResponse: any = null;

      // Create a text step for this stream turn if it's the final or if it produces text
      const textStepId = Math.random().toString();
      let hasAddedTextStep = false;
      const turnStartTime = performance.now();

      for await (const chunk of responseStream) {
        lastChunkResponse = chunk;
        if (chunk.candidates?.[0]?.content?.parts) {
            aggregatedParts.push(...chunk.candidates[0].content.parts);
        }
        if (chunk.text) {
          if (!hasAddedTextStep) {
            steps.push({ id: textStepId, type: 'text', content: "", status: 'streaming' });
            hasAddedTextStep = true;
          }
          turnText += chunk.text;
          const stepIndex = steps.findIndex(s => s.id === textStepId);
          if (stepIndex > -1) {
            steps[stepIndex].content = turnText;
          }
          finalFullText += chunk.text;
          notify(false, finalFullText);
        }
        if (chunk.functionCalls) {
          functionCalls.push(...chunk.functionCalls);
        }
      }

      lastAggregatedParts = aggregatedParts;

      const turnEndTime = performance.now();

      if (hasAddedTextStep) {
        const stepIndex = steps.findIndex(s => s.id === textStepId);
        if (stepIndex > -1) {
          steps[stepIndex].status = 'completed';
          steps[stepIndex].latencyMs = turnEndTime - turnStartTime;
        }
        notify(false, finalFullText);
      }

      // Reconstruct full response candidate for history appending
      if (aggregatedParts.length > 0 && functionCalls.length > 0) {
          // If we had function calls, append them back to contents
          // The SDK requires passing back what the model outputted
          contents.push({
              role: "model",
              parts: aggregatedParts
          });

          const toolResults = [];

          for (const call of functionCalls) {
            const stepId = call.id || Math.random().toString();
            steps.push({
              id: stepId,
              type: 'tool',
              toolName: call.name,
              toolArgs: call.args,
              status: 'streaming'
            });
            notifyToolExecution(true, call.name);
            notify(false, finalFullText);

            const toolStartTime = performance.now();
            let output: any = { success: true };
            
            if (call.name === "analyze_sales_performance") {
              const yearMatch = call.args.date_range ? String(call.args.date_range).match(/\d{4}/) : null;
              const year = yearMatch ? yearMatch[0] : "";
              const relevantOrders = MOCK_DB.orders.filter(o => {
                const matchesYear = !year || (o.date && o.date.startsWith(year));
                const matchesCity = !call.args.city || (o.city && o.city.toLowerCase() === String(call.args.city).toLowerCase());
                return matchesYear && matchesCity;
              });
              const totalRevenue = relevantOrders.reduce((sum, order) => sum + (order.amount || 0), 0);
              const totalOrders = relevantOrders.length;
              
              const monthlyBreakdown = relevantOrders.reduce((acc: any, order) => {
                const date = new Date(order.date);
                const month = date.toLocaleString('default', { month: 'short' }) + ' ' + date.getFullYear();
                if (!acc[month]) acc[month] = { revenue: 0, orders: 0 };
                acc[month].revenue += order.amount || 0;
                acc[month].orders += 1;
                return acc;
              }, {});

              const formattedMonthly = Object.entries(monthlyBreakdown).map(([month, stats]: any) => ({
                month,
                revenue: Math.round(stats.revenue * 100) / 100,
                orders: stats.orders
              }));

              const cityBreakdown = relevantOrders.reduce((acc: any, order) => {
                const city = order.city || 'unknown';
                if (!acc[city]) acc[city] = { revenue: 0, orders: 0 };
                acc[city].revenue += order.amount || 0;
                acc[city].orders += 1;
                return acc;
              }, {});

              const topCities = Object.entries(cityBreakdown)
                .map(([city, stats]: any) => ({ city, revenue: Math.round(stats.revenue * 100) / 100, orders: stats.orders }))
                .sort((a: any, b: any) => b.revenue - a.revenue)
                .slice(0, 10);
                
              const statusBreakdown = relevantOrders.reduce((acc: any, order) => {
                const status = order.status || 'unknown';
                acc[status] = (acc[status] || 0) + 1;
                return acc;
              }, {});

              const data = { 
                revenue: Math.round(totalRevenue * 100) / 100, 
                orders: totalOrders,
                monthly_breakdown: formattedMonthly,
                top_cities_revenue: topCities,
                order_status_breakdown: statusBreakdown
              };
              output = { success: true, message: `Sales data fetched for ${call.args.date_range}`, data };
              await new Promise(r => setTimeout(r, 800));
            } else if (call.name === "investigate_shipping_delays") {
              const delayedOrders = MOCK_DB.orders.filter(o => o.status === "Delayed" && (!call.args.region || o.city === call.args.region));
              
              const cityBreakdown = delayedOrders.reduce((acc: any, order) => {
                acc[order.city] = (acc[order.city] || 0) + 1;
                return acc;
              }, {});

              const topDelayedCities = Object.entries(cityBreakdown)
                .map(([city, count]) => ({ city, count }))
                .sort((a: any, b: any) => b.count - a.count)
                .slice(0, 5);

              output = { 
                success: true, 
                message: `Found ${delayedOrders.length} delayed orders.`, 
                total_delayed: delayedOrders.length,
                breakdown_by_city: topDelayedCities,
                data: delayedOrders.slice(0, 10)
              };
              await new Promise(r => setTimeout(r, 800));
            } else if (call.name === "analyze_customer_sentiment") {
              let relevantReviews = MOCK_DB.reviews;
              if (call.args.product_category) {
                relevantReviews = relevantReviews.filter(r => r.product_category === call.args.product_category);
              }
              if (call.args.score_filter) {
                relevantReviews = relevantReviews.filter(r => r.score === call.args.score_filter);
              }
              
              const scoreDistribution = relevantReviews.reduce((acc: any, rev) => {
                acc[`${rev.score}_star`] = (acc[`${rev.score}_star`] || 0) + 1;
                return acc;
              }, {});

              output = { 
                success: true, 
                message: `Fetched ${relevantReviews.length} reviews.`, 
                score_distribution: scoreDistribution,
                data: relevantReviews.slice(0, 10).map(r => {
                  const order = MOCK_DB.orders.find(o => o.order_id === r.order_id);
                  return { ...r, order_amount: order ? order.amount : undefined };
                })
              };
              await new Promise(r => setTimeout(r, 800));
            } else if (call.name === "issue_refund") {
              const success = appStore.issueRefund(call.args.order_id, call.args.refund_amount, call.args.reason_code || 'Aduan kualiti');
              if (success) {
                output = { success: true, message: `Bayaran balik sebanyak RM${call.args.refund_amount} telah berjaya diluluskan dan direkodkan untuk pesanan ${call.args.order_id}.` };
              } else {
                output = { success: false, message: `Pesanan ${call.args.order_id} tidak ditemui dalam pangkalan data.` };
              }
              await new Promise(r => setTimeout(r, 400));
            } else if (call.name === "jev_classify_issue") {
              try {
                const jevRes = await evaluateWithJev(call.args.message);
                output = {
                  success: true,
                  message: `JEV System-1 mengelaskan isu sebagai [${jevRes.dimensions.issueClass.value}] (${(jevRes.dimensions.issueClass.confidence * 100).toFixed(0)}% keyakinan). Urgensi: ${jevRes.primitives.urgencyScore.score}/5.0. Tindakan disyorkan: ${jevRes.recommendedAction}`,
                  data: jevRes
                };
              } catch (err: any) {
                output = { success: false, error: err.message };
              }
            } else if (call.name === "update_business_workflow") {
              const updated = appStore.updateWorkflowSignoff(call.args.workflow_id, call.args.signoff, call.args.notes);
              output = {
                success: Boolean(updated),
                message: updated ? `Aliran kerja ${call.args.workflow_id} berjaya dikemas kini status kepada ${updated.status}.` : `Aliran kerja tidak dijumpai.`,
                data: updated
              };
            } else if (call.name === "create_order") {
              const newOrder = appStore.addOrder({
                customer_id: call.args.customer_id,
                city: call.args.city,
                items: call.args.items,
                amount: Number(call.args.amount) || 0,
                status: (call.args.status as any) || 'Processing'
              });
              output = {
                success: true,
                message: `Pesanan baharu ${newOrder.order_id} telah berjaya direkodkan bagi ${newOrder.customer_id} (RM${newOrder.amount}) di ${newOrder.city}.`,
                data: newOrder
              };
            } else if (call.name === "draft_customer_response") {
              MOCK_DB.customer_responses.push(call.args);
              output = { success: true, message: `Draft response saved for customer ${call.args.customer_id}.` };
              await new Promise(r => setTimeout(r, 800));
            } else if (call.name === "generate_yearly_report") {
              MOCK_DB.reports.push(call.args);
              output = { success: true, message: "Report generated", reportId: MOCK_DB.reports.length };
              await new Promise(r => setTimeout(r, 800));
            } else if (call.name === "create_operations_dashboard") {
              MOCK_DB.dashboards.push(call.args);
              output = { success: true, message: "Dashboard created", dashboardId: MOCK_DB.dashboards.length };
              await new Promise(r => setTimeout(r, 800));
            } else if (call.name === "start_ai_agent") {
              try {
                const startAiTask = performance.now();
                const subAgentResponse = await getGeminiClient().models.generateContent({
                  model: MODEL_NAME,
                  contents: [
                    { role: "user", parts: [{ text: `You are an autonomous sub-agent named ${call.args.agent_name}. Your task is: ${call.args.task_description}. Return your final result or report.` }] }
                  ]
                });
                const resultText = subAgentResponse.text;
                const endAiTask = performance.now();
                const latency = endAiTask - startAiTask;
                MOCK_DB.agents.push({ name: call.args.agent_name, task: call.args.task_description, result: resultText, latencyMs: latency });
                output = { success: true, message: "Agent completed task", result: resultText, latencyMs: latency };
              } catch (err: any) {
                output = { success: false, error: err.message };
              }
            } else if (call.name === "create_google_form") {
              try {
                const token = await getAccessToken();
                let formRecord: any;
                if (token) {
                  formRecord = await createGoogleFormWithQuestions(
                    call.args.title,
                    call.args.description,
                    call.args.questions
                  );
                  MOCK_DB.forms.unshift(formRecord);
                  output = {
                    success: true,
                    message: `Successfully created Google Form "${call.args.title}" directly in your Google account!`,
                    formId: formRecord.formId,
                    responderUri: formRecord.responderUri || `https://docs.google.com/forms/d/${formRecord.formId}/viewform`,
                    editUri: `https://docs.google.com/forms/d/${formRecord.formId}/edit`,
                    questionsCount: call.args.questions?.length || 0,
                    data: formRecord
                  };
                } else {
                  const mockId = 'form_' + Math.random().toString(36).substring(2, 9);
                  formRecord = {
                    formId: mockId,
                    info: {
                      title: call.args.title,
                      description: call.args.description || "Created with AI Operations Agent"
                    },
                    responderUri: `https://docs.google.com/forms/d/${mockId}/viewform`,
                    items: (call.args.questions || []).map((q: any, i: number) => ({
                      itemId: 'q_' + i,
                      title: q.title,
                      questionItem: { question: { required: q.required ?? true } }
                    })),
                    isDraft: true
                  };
                  MOCK_DB.forms.unshift(formRecord);
                  output = {
                    success: true,
                    message: `Google Form drafted: "${call.args.title}". (Tip: Sign in with Google in the Forms tab to deploy directly to your live Google Drive).`,
                    formId: mockId,
                    questionsCount: call.args.questions?.length || 0,
                    data: formRecord
                  };
                }
              } catch (err: any) {
                output = { success: false, error: err.message };
              }
            } else if (call.name === "list_google_forms") {
              try {
                const token = await getAccessToken();
                let driveFiles: any[] = [];
                if (token) {
                  driveFiles = await listGoogleForms();
                }
                const combined = [
                  ...driveFiles.map(f => ({ id: f.id, name: f.name, modifiedTime: f.modifiedTime, link: f.webViewLink })),
                  ...MOCK_DB.forms.map(f => ({ id: f.formId, name: f.info?.title || 'Untitled Form', modifiedTime: new Date().toISOString(), link: f.responderUri }))
                ];
                output = {
                  success: true,
                  message: `Found ${combined.length} Google Forms.`,
                  forms: combined
                };
              } catch (err: any) {
                output = { success: false, error: err.message, forms: MOCK_DB.forms };
              }
            } else if (call.name === "analyze_form_responses") {
              try {
                const token = await getAccessToken();
                let responses: any[] = [];
                if (token) {
                  responses = await getGoogleFormResponses(call.args.form_id);
                }
                output = {
                  success: true,
                  formId: call.args.form_id,
                  total_responses: responses.length,
                  message: `Fetched ${responses.length} responses for form ${call.args.form_id}.`,
                  responses: responses.slice(0, 15)
                };
              } catch (err: any) {
                output = { success: false, error: err.message };
              }
            } else if (call.name === "send_gmail_email") {
              try {
                const token = await getAccessToken();
                const args = (call.args || {}) as any;
                if (token) {
                  const res = await sendGmailMessage(args.to, args.subject, args.body);
                  output = {
                    success: true,
                    message: `Email sent to ${args.to} via Gmail!`,
                    data: { to: args.to, subject: args.subject, body: args.body, id: res.id }
                  };
                } else {
                  MOCK_DB.emails.unshift(args);
                  output = {
                    success: true,
                    message: `Email prepared for ${args.to} in workspace. (Sign in with Google to deliver via live Gmail).`,
                    data: args
                  };
                }
              } catch (err: any) {
                output = { success: false, error: err.message };
              }
            } else if (call.name === "create_google_task") {
              try {
                const token = await getAccessToken();
                const args = (call.args || {}) as any;
                if (token) {
                  const task = await createGoogleTask('@default', args.title, args.notes, args.due);
                  output = {
                    success: true,
                    message: `Created task "${args.title}" in Google Tasks!`,
                    data: task
                  };
                } else {
                  const task = { id: 'task_' + Date.now(), title: args.title, notes: args.notes, due: args.due, status: 'needsAction' };
                  MOCK_DB.tasks.unshift(task);
                  output = {
                    success: true,
                    message: `Task "${args.title}" added to workspace.`,
                    data: task
                  };
                }
              } catch (err: any) {
                output = { success: false, error: err.message };
              }
            } else if (call.name === "create_google_doc") {
              try {
                const token = await getAccessToken();
                const args = (call.args || {}) as any;
                if (token) {
                  const doc = await createGoogleDoc(args.title, args.content);
                  output = {
                    success: true,
                    message: `Created Google Document "${args.title}" in Google Drive!`,
                    documentId: doc.documentId,
                    url: `https://docs.google.com/document/d/${doc.documentId}/edit`,
                    data: doc
                  };
                } else {
                  const doc = { id: 'doc_' + Date.now(), name: args.title, content: args.content };
                  MOCK_DB.docs.unshift(doc);
                  output = {
                    success: true,
                    message: `Google Document drafted: "${args.title}".`,
                    data: doc
                  };
                }
              } catch (err: any) {
                output = { success: false, error: err.message };
              }
            } else if (call.name === "list_gmail_messages") {
              try {
                const token = await getAccessToken();
                const args = (call.args || {}) as any;
                let list: any[] = [];
                if (token) {
                  list = await listGmailMessages(args.query);
                }
                output = { success: true, messages: list };
              } catch (err: any) {
                output = { success: false, error: err.message };
              }
            } else if (call.name === "list_google_tasks") {
              try {
                const token = await getAccessToken();
                let tasksList: any[] = [];
                if (token) {
                  tasksList = await listGoogleTasks();
                }
                output = { success: true, tasks: tasksList };
              } catch (err: any) {
                output = { success: false, error: err.message };
              }
            } else if (call.name === "schedule_calendar_event") {
              try {
                const token = await getAccessToken();
                const args = (call.args || {}) as any;
                if (token) {
                  const event = await createCalendarEvent(
                    args.summary,
                    args.start_time,
                    args.end_time,
                    args.description,
                    args.location
                  );
                  MOCK_DB.events.unshift(event);
                  output = {
                    success: true,
                    message: `Scheduled calendar event: "${args.summary}" in Google Calendar!`,
                    data: event
                  };
                } else {
                  const localEvent = {
                    id: 'cal_' + Date.now(),
                    summary: args.summary,
                    start: { dateTime: args.start_time },
                    end: { dateTime: args.end_time },
                    description: args.description,
                    location: args.location
                  };
                  MOCK_DB.events.unshift(localEvent);
                  output = {
                    success: true,
                    message: `Calendar event prepared: "${args.summary}".`,
                    data: localEvent
                  };
                }
              } catch (err: any) {
                output = { success: false, error: err.message };
              }
            } else if (call.name === "list_calendar_events") {
              try {
                const token = await getAccessToken();
                const args = (call.args || {}) as any;
                let eventsList: any[] = [];
                if (token) {
                  eventsList = await listCalendarEvents(args.max_results || 10);
                }
                output = { success: true, events: eventsList };
              } catch (err: any) {
                output = { success: false, error: err.message };
              }
            } else if (call.name === "create_google_sheet") {
              try {
                const token = await getAccessToken();
                const args = (call.args || {}) as any;
                if (token) {
                  const sheetRes = await createGoogleSpreadsheet(
                    args.title,
                    args.headers || [],
                    args.rows || []
                  );
                  MOCK_DB.sheets.unshift({ id: sheetRes.spreadsheetId, name: args.title, webViewLink: sheetRes.spreadsheetUrl });
                  output = {
                    success: true,
                    message: `Created spreadsheet "${args.title}" in Google Drive!`,
                    spreadsheetId: sheetRes.spreadsheetId,
                    url: sheetRes.spreadsheetUrl,
                    data: sheetRes
                  };
                } else {
                  const localSheet = {
                    id: 'sheet_' + Date.now(),
                    name: args.title,
                    headers: args.headers,
                    rows: args.rows
                  };
                  MOCK_DB.sheets.unshift(localSheet);
                  output = {
                    success: true,
                    message: `Google Spreadsheet drafted: "${args.title}".`,
                    data: localSheet
                  };
                }
              } catch (err: any) {
                output = { success: false, error: err.message };
              }
            } else if (call.name === "create_meet_space") {
              try {
                const token = await getAccessToken();
                const args = (call.args || {}) as any;
                if (token) {
                  const space = await createGoogleMeetSpace();
                  MOCK_DB.meet_spaces.unshift(space);
                  output = {
                    success: true,
                    message: `Google Meet space created: ${space.meetingUri || space.name}`,
                    meetingUri: space.meetingUri,
                    name: space.name,
                    data: space
                  };
                } else {
                  const mockCode = `${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`;
                  const localSpace = {
                    name: `spaces/${mockCode}`,
                    meetingUri: `https://meet.google.com/${mockCode}`,
                    meetingCode: mockCode,
                  };
                  MOCK_DB.meet_spaces.unshift(localSpace);
                  output = {
                    success: true,
                    message: `Google Meet room generated: ${localSpace.meetingUri}`,
                    meetingUri: localSpace.meetingUri,
                    data: localSpace
                  };
                }
              } catch (err: any) {
                output = { success: false, error: err.message };
              }
            } else if (call.name === "send_chat_message") {
              try {
                const token = await getAccessToken();
                const args = (call.args || {}) as any;
                if (token) {
                  const chatRes = await sendChatMessage(args.space_name, args.message_text);
                  output = {
                    success: true,
                    message: `Message posted to Google Chat space!`,
                    data: chatRes
                  };
                } else {
                  const localChat = {
                    name: `spaces/local/messages/${Date.now()}`,
                    text: args.message_text,
                    space: args.space_name,
                    createTime: new Date().toISOString()
                  };
                  MOCK_DB.chat_messages.unshift(localChat);
                  output = {
                    success: true,
                    message: `Message sent to workspace chat.`,
                    data: localChat
                  };
                }
              } catch (err: any) {
                output = { success: false, error: err.message };
              }
            } else if (call.name === "skyscanner_search_flights") {
              output = await executeSkyscannerSearch(call.args as any);
            } else if (call.name === "booking_search_hotels") {
              output = await executeBookingSearch(call.args as any);
            } else if (call.name === "canva_generate_design") {
              output = await executeCanvaDesign(call.args as any);
            } else if (call.name === "adobe_process_asset") {
              output = await executeAdobeProcess(call.args as any);
            } else if (call.name === "github_manage_repo") {
              output = await executeGitHubManage(call.args as any);
            } else if (call.name === "vercel_deploy_status") {
              output = await executeVercelStatus(call.args as any);
            } else if (call.name === "supabase_query_db") {
              output = await executeSupabaseQuery(call.args as any);
            } else if (call.name === "mixpanel_track_analytics") {
              output = await executeMixpanelAnalytics();
            } else if (call.name === "coros_health_metrics") {
              output = await executeCorosMetrics();
            } else if (call.name === "apple_health_summary") {
              output = await executeAppleHealthSummary();
            } else if (call.name === "google_drive_search_files") {
              output = await executeGoogleDriveSearch(call.args as any);
            } else if (call.name === "redbus_bus_freight_schedule") {
              output = await executeRedBusSchedules(call.args as any);
            } else if (call.name === "bus_freight_dispatch_create") {
              output = await executeBusConsignmentDispatch(call.args as any);
            } else if (call.name === "bus_freight_update_arrival_notice") {
              output = await executeBusStatusNotice(call.args as any);
            }

            const toolEndTime = performance.now();
            const measuredLatency = Math.round(toolEndTime - toolStartTime);

            // Log tool execution telemetry to Supabase Agent Performance
            try {
              const category = call.name.includes('bus') ? 'Logistik & Bas' :
                               call.name.startsWith('create_google') || call.name.startsWith('send_') || call.name.startsWith('schedule_') || call.name.includes('drive') ? 'Google Workspace' :
                               call.name.includes('yearly') || call.name.includes('dashboard') || call.name.includes('jev') ? 'Analisis & Laporan' : 'Gedung Plugins';
              
              supabaseAgentPerformance.recordTaskExecution({
                task_id: stepId,
                tool_name: call.name,
                tool_category: category,
                latency_ms: measuredLatency,
                status: output?.success !== false ? 'SUCCESS' : 'ERROR',
                tokens_used: 350,
                user_query: finalFullText?.slice(0, 80) || `Pelaksanaan alat ${call.name}`,
                model: MODEL_NAME,
                error_message: output?.error
              }).catch(() => {});
            } catch {
              // Non-blocking telemetry
            }

            const stepIndex = steps.findIndex(s => s.id === stepId);
            if (stepIndex > -1) {
              steps[stepIndex].status = 'completed';
              steps[stepIndex].result = output;
              steps[stepIndex].latencyMs = measuredLatency;
            }
            notifyToolExecution(false);
            notify(false, finalFullText);

            toolResults.push({
              name: call.name,
              result: output
            });
          }

          if (toolResults.length > 0) {
              const functionResponseParts = toolResults.map(tr => ({
                  functionResponse: {
                      name: tr.name,
                      response: tr.result
                  }
              }));
              
              contents.push({
                  role: "user",
                  parts: functionResponseParts
              });
          } else {
              keepGoing = false;
          }
      } else {
        keepGoing = false;
      }
    }

    const generatedReport = steps.some(s => s.type === 'tool' && s.toolName === "generate_yearly_report");
    const generatedDashboard = steps.some(s => s.type === 'tool' && s.toolName === "create_operations_dashboard");
    const generatedFormStep = steps.find(s => s.type === 'tool' && s.toolName === "create_google_form");
    const generatedEmailStep = steps.find(s => s.type === 'tool' && s.toolName === "send_gmail_email");
    const generatedTaskStep = steps.find(s => s.type === 'tool' && s.toolName === "create_google_task");
    const generatedDocStep = steps.find(s => s.type === 'tool' && s.toolName === "create_google_doc");
    const generatedCalendarStep = steps.find(s => s.type === 'tool' && s.toolName === "schedule_calendar_event");
    const generatedSheetStep = steps.find(s => s.type === 'tool' && s.toolName === "create_google_sheet");
    const generatedMeetStep = steps.find(s => s.type === 'tool' && s.toolName === "create_meet_space");
    const generatedChatStep = steps.find(s => s.type === 'tool' && s.toolName === "send_chat_message");
    const generatedJevStep = steps.find(s => s.type === 'tool' && s.toolName === "jev_classify_issue");
    const generatedPluginStep = steps.find(s => s.type === 'tool' && (
      s.toolName === "skyscanner_search_flights" ||
      s.toolName === "booking_search_hotels" ||
      s.toolName === "canva_generate_design" ||
      s.toolName === "adobe_process_asset" ||
      s.toolName === "github_manage_repo" ||
      s.toolName === "vercel_deploy_status" ||
      s.toolName === "supabase_query_db" ||
      s.toolName === "mixpanel_track_analytics" ||
      s.toolName === "coros_health_metrics" ||
      s.toolName === "apple_health_summary" ||
      s.toolName === "google_drive_search_files" ||
      s.toolName === "redbus_bus_freight_schedule" ||
      s.toolName === "bus_freight_dispatch_create" ||
      s.toolName === "bus_freight_update_arrival_notice"
    ));

    const modelMsg: ChatMessage = {
      role: "model",
      parts: lastAggregatedParts.length > 0 ? lastAggregatedParts : [{ text: finalFullText || "" }],
      timestamp: new Date(),
      latencyMs: performance.now() - totalStartTime,
      hasReport: generatedReport,
      hasDashboard: generatedDashboard,
      hasForm: Boolean(generatedFormStep),
      formData: generatedFormStep?.result?.data,
      hasEmail: Boolean(generatedEmailStep),
      emailData: generatedEmailStep?.result?.data,
      hasTask: Boolean(generatedTaskStep),
      taskData: generatedTaskStep?.result?.data,
      hasDoc: Boolean(generatedDocStep),
      docData: generatedDocStep?.result?.data,
      hasCalendar: Boolean(generatedCalendarStep),
      calendarData: generatedCalendarStep?.result?.data,
      hasSheet: Boolean(generatedSheetStep),
      sheetData: generatedSheetStep?.result?.data,
      hasMeet: Boolean(generatedMeetStep),
      meetData: generatedMeetStep?.result?.data,
      hasChat: Boolean(generatedChatStep),
      chatData: generatedChatStep?.result?.data,
      hasJev: Boolean(generatedJevStep),
      jevData: generatedJevStep?.result?.data,
      hasPlugin: Boolean(generatedPluginStep),
      pluginType: generatedPluginStep?.toolName,
      pluginData: generatedPluginStep?.result?.data,
    };
    currentHistory.push(modelMsg);
    
    notify(true, "");
    notifyToolExecution(false);

  } catch (error: any) {
    notifyToolExecution(false);
    console.error("Agent Error:", error);
    const errorMsg: ChatMessage = {
      role: "model",
      parts: [{ text: `I encountered an error while processing your request: ${error?.message || error}. Please try again.` }],
      timestamp: new Date(),
      latencyMs: performance.now() - totalStartTime,
    };
    currentHistory.push(errorMsg);
    notify(true, "");
  }
}

export async function sendMessageToAgent(
  history: ChatMessage[],
  newMessage: string,
  onToolCall?: (toolCall: ToolCall) => void
): Promise<ChatMessage[]> {
  // Convert our internal history format to Gemini's format
  // We need to handle tool responses carefully in a real app, 
  // but for this demo we'll simplify by just sending the text conversation 
  // and letting the model "think" it executed tools via the current turn.
  
  // Actually, to properly demonstrate multi-step, we should use the chat session.
  // However, since we are stateless between calls in this simple function, 
  // we'll instantiate a new chat each time with history.
  
    // We need to map our history to the SDK's Content format
    const sdkHistory = history
      .filter(h => h.role !== 'system') // Filter out system messages if any
      .map(h => {
        const { timestamp, latencyMs, groundingMetadata, ...content } = h;
        return content;
      });
console.log(MODEL_NAME)
    const contents: Content[] = [
      ...sdkHistory,
      { role: "user", parts: [{ text: newMessage }] }
    ];
    
    const config = {
      tools: tools,
      systemInstruction: MASTER_SYSTEM_INSTRUCTION,
    };

  
  let currentHistory = [...history];
  const totalStartTime = performance.now();
  
  // Add user message to history for the UI
  const userMsg: ChatMessage = { role: "user", parts: [{ text: newMessage }], timestamp: new Date() };
  currentHistory.push(userMsg);

  // Send message
  try {
    // Start the turn
    let result = await getGeminiClient().models.generateContent({
      model: MODEL_NAME,
      contents: contents,
      config: config
    });

    // Loop for tool calls
    // The SDK might handle some, but often we need to check `functionCalls`
    
    let keepGoing = true;
    let maxSteps = 5;
    let step = 0;
    const allToolCallRecords: ToolCall[] = [];
    const allToolOutputs: { name: string; result: any }[] = [];

    while (keepGoing && step < maxSteps) {
      step++;
      const response = result; // result IS the response
      
      // Check for function calls
      const functionCalls = response.functionCalls;
      
      if (functionCalls && functionCalls.length > 0) {
        // We have tool calls
        
        // Append the model's function calls to contents so the model has the context
        if (response.candidates && response.candidates[0].content) {
            contents.push(response.candidates[0].content);
        }

        const toolResults = [];
        const toolCallRecords: ToolCall[] = [];

        for (const call of functionCalls) {
          console.log("Tool Call:", call.name, call.args);
          
          // Notify UI
          const toolCallRecord: ToolCall = {
            id: call.id || Math.random().toString(), // SDK might not always give ID in all versions
            name: call.name,
            args: call.args as any,
          };
          toolCallRecords.push(toolCallRecord);
          allToolCallRecords.push(toolCallRecord);
          if (onToolCall) onToolCall(toolCallRecord);

          // Execute Tool
          let output: any = { success: true };
          
          if (call.name === "analyze_sales_performance") {
            const yearMatch = call.args.date_range ? String(call.args.date_range).match(/\d{4}/) : null;
            const year = yearMatch ? yearMatch[0] : "";
            const relevantOrders = MOCK_DB.orders.filter(o => {
              const matchesYear = !year || (o.date && o.date.startsWith(year));
              const matchesCity = !call.args.city || (o.city && o.city.toLowerCase() === String(call.args.city).toLowerCase());
              return matchesYear && matchesCity;
            });
            const totalRevenue = relevantOrders.reduce((sum, order) => sum + (order.amount || 0), 0);
            const totalOrders = relevantOrders.length;
            
            const monthlyBreakdown = relevantOrders.reduce((acc: any, order) => {
              const date = new Date(order.date);
              const month = date.toLocaleString('default', { month: 'short' }) + ' ' + date.getFullYear();
              if (!acc[month]) acc[month] = { revenue: 0, orders: 0 };
              acc[month].revenue += order.amount || 0;
              acc[month].orders += 1;
              return acc;
            }, {});

            const formattedMonthly = Object.entries(monthlyBreakdown).map(([month, stats]: any) => ({
              month,
              revenue: Math.round(stats.revenue * 100) / 100,
              orders: stats.orders
            }));

            const cityBreakdown = relevantOrders.reduce((acc: any, order) => {
              const city = order.city || 'unknown';
              if (!acc[city]) acc[city] = { revenue: 0, orders: 0 };
              acc[city].revenue += order.amount || 0;
              acc[city].orders += 1;
              return acc;
            }, {});

            const topCities = Object.entries(cityBreakdown)
              .map(([city, stats]: any) => ({ city, revenue: Math.round(stats.revenue * 100) / 100, orders: stats.orders }))
              .sort((a: any, b: any) => b.revenue - a.revenue)
              .slice(0, 10);
              
            const statusBreakdown = relevantOrders.reduce((acc: any, order) => {
              const status = order.status || 'unknown';
              acc[status] = (acc[status] || 0) + 1;
              return acc;
            }, {});

            const data = { 
              revenue: Math.round(totalRevenue * 100) / 100, 
              orders: totalOrders,
              monthly_breakdown: formattedMonthly,
              top_cities_revenue: topCities,
              order_status_breakdown: statusBreakdown
            };
            output = { success: true, message: `Sales data fetched for ${call.args.date_range}`, data };
          } else if (call.name === "investigate_shipping_delays") {
            const delayedOrders = MOCK_DB.orders.filter(o => o.status === "Delayed" && (!call.args.region || o.city === call.args.region));
            
            const cityBreakdown = delayedOrders.reduce((acc: any, order) => {
              acc[order.city] = (acc[order.city] || 0) + 1;
              return acc;
            }, {});

            const topDelayedCities = Object.entries(cityBreakdown)
              .map(([city, count]) => ({ city, count }))
              .sort((a: any, b: any) => b.count - a.count)
              .slice(0, 5);

            output = { 
              success: true, 
              message: `Found ${delayedOrders.length} delayed orders.`, 
              total_delayed: delayedOrders.length,
              breakdown_by_city: topDelayedCities,
              data: delayedOrders.slice(0, 10)
            };
          } else if (call.name === "analyze_customer_sentiment") {
            let relevantReviews = MOCK_DB.reviews;
            if (call.args.product_category) {
              relevantReviews = relevantReviews.filter(r => r.product_category === call.args.product_category);
            }
            if (call.args.score_filter) {
              relevantReviews = relevantReviews.filter(r => r.score === call.args.score_filter);
            }
            
            const scoreDistribution = relevantReviews.reduce((acc: any, rev) => {
              acc[`${rev.score}_star`] = (acc[`${rev.score}_star`] || 0) + 1;
              return acc;
            }, {});

            output = { 
              success: true, 
              message: `Fetched ${relevantReviews.length} reviews.`, 
              score_distribution: scoreDistribution,
              data: relevantReviews.slice(0, 10) 
            };
          } else if (call.name === "issue_refund") {
            const args = (call.args || {}) as any;
            const success = appStore.issueRefund(String(args.order_id), Number(args.refund_amount) || 0, String(args.reason_code || 'Aduan kualiti'));
            if (success) {
              output = { success: true, message: `Bayaran balik sebanyak RM${args.refund_amount} telah berjaya diluluskan dan direkodkan untuk pesanan ${args.order_id}.` };
            } else {
              output = { success: false, message: `Pesanan ${args.order_id} tidak ditemui dalam pangkalan data.` };
            }
          } else if (call.name === "jev_classify_issue") {
            try {
              const args = (call.args || {}) as any;
              const jevRes = await evaluateWithJev(String(args.message || ''));
              output = {
                success: true,
                message: `JEV System-1 mengelaskan isu sebagai [${jevRes.dimensions.issueClass.value}] (${(jevRes.dimensions.issueClass.confidence * 100).toFixed(0)}% keyakinan). Urgensi: ${jevRes.primitives.urgencyScore.score}/5.0. Tindakan disyorkan: ${jevRes.recommendedAction}`,
                data: jevRes
              };
            } catch (err: any) {
              output = { success: false, error: err.message };
            }
          } else if (call.name === "update_business_workflow") {
            const args = (call.args || {}) as any;
            const updated = appStore.updateWorkflowSignoff(String(args.workflow_id), Boolean(args.signoff), args.notes ? String(args.notes) : undefined);
            output = {
              success: Boolean(updated),
              message: updated ? `Aliran kerja ${args.workflow_id} berjaya dikemas kini status kepada ${updated.status}.` : `Aliran kerja tidak dijumpai.`,
              data: updated
            };
          } else if (call.name === "create_order") {
            const args = (call.args || {}) as any;
            const newOrder = appStore.addOrder({
              customer_id: String(args.customer_id || ''),
              city: String(args.city || 'johor bahru'),
              items: String(args.items || ''),
              amount: Number(args.amount) || 0,
              status: (args.status as any) || 'Processing'
            });
            output = {
              success: true,
              message: `Pesanan baharu ${newOrder.order_id} telah berjaya direkodkan bagi ${newOrder.customer_id} (RM${newOrder.amount}) di ${newOrder.city}.`,
              data: newOrder
            };
          } else if (call.name === "draft_customer_response") {
            MOCK_DB.customer_responses.push(call.args);
            output = { success: true, message: `Draft response saved for customer ${call.args.customer_id}.` };
          } else if (call.name === "generate_yearly_report") {
            MOCK_DB.reports.push(call.args);
            output = { success: true, message: "Report generated", reportId: MOCK_DB.reports.length };
          } else if (call.name === "create_operations_dashboard") {
            MOCK_DB.dashboards.push(call.args);
            output = { success: true, message: "Dashboard created", dashboardId: MOCK_DB.dashboards.length };
          } else if (call.name === "create_google_form") {
            try {
              const token = await getAccessToken();
              const formArgs = (call.args || {}) as any;
              let formRecord: any;
              if (token) {
                formRecord = await createGoogleFormWithQuestions(
                  formArgs.title,
                  formArgs.description,
                  formArgs.questions
                );
                MOCK_DB.forms.unshift(formRecord);
                output = {
                  success: true,
                  message: `Successfully created Google Form "${formArgs.title}" directly in your Google account!`,
                  formId: formRecord.formId,
                  responderUri: formRecord.responderUri || `https://docs.google.com/forms/d/${formRecord.formId}/viewform`,
                  data: formRecord
                };
              } else {
                const mockId = 'form_' + Math.random().toString(36).substring(2, 9);
                formRecord = {
                  formId: mockId,
                  info: {
                    title: formArgs.title,
                    description: formArgs.description || "Created with AI Operations Agent"
                  },
                  responderUri: `https://docs.google.com/forms/d/${mockId}/viewform`,
                  items: (formArgs.questions || []).map((q: any, i: number) => ({
                    itemId: 'q_' + i,
                    title: q.title,
                    questionItem: { question: { required: q.required ?? true } }
                  })),
                  isDraft: true
                };
                MOCK_DB.forms.unshift(formRecord);
                output = {
                  success: true,
                  message: `Google Form drafted: "${formArgs.title}".`,
                  formId: mockId,
                  data: formRecord
                };
              }
            } catch (err: any) {
              output = { success: false, error: err.message };
            }
          } else if (call.name === "list_google_forms") {
            try {
              const token = await getAccessToken();
              let driveFiles: any[] = [];
              if (token) {
                driveFiles = await listGoogleForms();
              }
              const combined = [
                ...driveFiles.map(f => ({ id: f.id, name: f.name, modifiedTime: f.modifiedTime, link: f.webViewLink })),
                ...MOCK_DB.forms.map(f => ({ id: f.formId, name: f.info?.title || 'Untitled Form', modifiedTime: new Date().toISOString(), link: f.responderUri }))
              ];
              output = { success: true, forms: combined };
            } catch (err: any) {
              output = { success: false, error: err.message, forms: MOCK_DB.forms };
            }
          } else if (call.name === "analyze_form_responses") {
            try {
              const token = await getAccessToken();
              const formArgs = (call.args || {}) as any;
              let responses: any[] = [];
              if (token) {
                responses = await getGoogleFormResponses(formArgs.form_id);
              }
              output = {
                success: true,
                formId: formArgs.form_id,
                total_responses: responses.length,
                responses: responses.slice(0, 15)
              };
            } catch (err: any) {
              output = { success: false, error: err.message };
            }
          } else if (call.name === "send_gmail_email") {
            try {
              const token = await getAccessToken();
              const args = (call.args || {}) as any;
              if (token) {
                const res = await sendGmailMessage(args.to, args.subject, args.body);
                output = { success: true, message: `Email sent to ${args.to} via Gmail!`, data: { to: args.to, subject: args.subject, body: args.body, id: res.id } };
              } else {
                MOCK_DB.emails.unshift(args);
                output = { success: true, message: `Email prepared for ${args.to} in workspace.`, data: args };
              }
            } catch (err: any) {
              output = { success: false, error: err.message };
            }
          } else if (call.name === "create_google_task") {
            try {
              const token = await getAccessToken();
              const args = (call.args || {}) as any;
              if (token) {
                const task = await createGoogleTask('@default', args.title, args.notes, args.due);
                output = { success: true, message: `Created task "${args.title}" in Google Tasks!`, data: task };
              } else {
                const task = { id: 'task_' + Date.now(), title: args.title, notes: args.notes, due: args.due, status: 'needsAction' };
                MOCK_DB.tasks.unshift(task);
                output = { success: true, message: `Task "${args.title}" added to workspace.`, data: task };
              }
            } catch (err: any) {
              output = { success: false, error: err.message };
            }
          } else if (call.name === "create_google_doc") {
            try {
              const token = await getAccessToken();
              const args = (call.args || {}) as any;
              if (token) {
                const doc = await createGoogleDoc(args.title, args.content);
                output = { success: true, message: `Created Google Document "${args.title}"!`, documentId: doc.documentId, data: doc };
              } else {
                const doc = { id: 'doc_' + Date.now(), name: args.title, content: args.content };
                MOCK_DB.docs.unshift(doc);
                output = { success: true, message: `Google Document drafted: "${args.title}".`, data: doc };
              }
            } catch (err: any) {
              output = { success: false, error: err.message };
            }
          } else if (call.name === "schedule_calendar_event") {
            try {
              const token = await getAccessToken();
              const args = (call.args || {}) as any;
              if (token) {
                const event = await createCalendarEvent(args.summary, args.start_time, args.end_time, args.description, args.location);
                MOCK_DB.events.unshift(event);
                output = { success: true, message: `Scheduled calendar event: "${args.summary}"`, data: event };
              } else {
                const localEvent = { id: 'cal_' + Date.now(), summary: args.summary, start: { dateTime: args.start_time }, end: { dateTime: args.end_time } };
                MOCK_DB.events.unshift(localEvent);
                output = { success: true, message: `Calendar event prepared: "${args.summary}"`, data: localEvent };
              }
            } catch (err: any) {
              output = { success: false, error: err.message };
            }
          } else if (call.name === "create_google_sheet") {
            try {
              const token = await getAccessToken();
              const args = (call.args || {}) as any;
              if (token) {
                const sheetRes = await createGoogleSpreadsheet(args.title, args.headers || [], args.rows || []);
                MOCK_DB.sheets.unshift({ id: sheetRes.spreadsheetId, name: args.title, webViewLink: sheetRes.spreadsheetUrl });
                output = { success: true, message: `Spreadsheet "${args.title}" created!`, data: sheetRes };
              } else {
                const localSheet = { id: 'sheet_' + Date.now(), name: args.title, headers: args.headers, rows: args.rows };
                MOCK_DB.sheets.unshift(localSheet);
                output = { success: true, message: `Spreadsheet drafted: "${args.title}"`, data: localSheet };
              }
            } catch (err: any) {
              output = { success: false, error: err.message };
            }
          } else if (call.name === "create_meet_space") {
            try {
              const token = await getAccessToken();
              if (token) {
                const space = await createGoogleMeetSpace();
                MOCK_DB.meet_spaces.unshift(space);
                output = { success: true, message: `Google Meet space created: ${space.meetingUri || space.name}`, data: space };
              } else {
                const mockCode = `${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`;
                const localSpace = { name: `spaces/${mockCode}`, meetingUri: `https://meet.google.com/${mockCode}` };
                MOCK_DB.meet_spaces.unshift(localSpace);
                output = { success: true, message: `Meet room created: ${localSpace.meetingUri}`, data: localSpace };
              }
            } catch (err: any) {
              output = { success: false, error: err.message };
            }
          } else if (call.name === "send_chat_message") {
            try {
              const token = await getAccessToken();
              const args = (call.args || {}) as any;
              if (token) {
                const chatRes = await sendChatMessage(args.space_name, args.message_text);
                output = { success: true, message: `Message sent to Chat`, data: chatRes };
              } else {
                const localChat = { name: `spaces/local/messages/${Date.now()}`, text: args.message_text, space: args.space_name };
                MOCK_DB.chat_messages.unshift(localChat);
                output = { success: true, message: `Message sent`, data: localChat };
              }
            } catch (err: any) {
              output = { success: false, error: err.message };
            }
          } else if (call.name === "start_ai_agent") {
            try {
              // Create an autonomous sub-agent call
              const startAiTask = performance.now();
              const subAgentResponse = await getGeminiClient().models.generateContent({
                model: MODEL_NAME,
                contents: [
                  { role: "user", parts: [{ text: `You are an autonomous sub-agent named ${call.args.agent_name}. Your task is: ${call.args.task_description}. Return your final result or report.` }] }
                ]
              });
              const resultText = subAgentResponse.text;
              const latency = performance.now() - startAiTask;
              MOCK_DB.agents.push({ name: call.args.agent_name, task: call.args.task_description, result: resultText, latencyMs: latency });
              output = { success: true, message: "Agent completed task", result: resultText, latencyMs: latency };
            } catch (err: any) {
              output = { success: false, error: err.message };
            }
          } else if (call.name === "skyscanner_search_flights") {
            output = await executeSkyscannerSearch(call.args as any);
          } else if (call.name === "booking_search_hotels") {
            output = await executeBookingSearch(call.args as any);
          } else if (call.name === "canva_generate_design") {
            output = await executeCanvaDesign(call.args as any);
          } else if (call.name === "adobe_process_asset") {
            output = await executeAdobeProcess(call.args as any);
          } else if (call.name === "github_manage_repo") {
            output = await executeGitHubManage(call.args as any);
          } else if (call.name === "vercel_deploy_status") {
            output = await executeVercelStatus();
          } else if (call.name === "supabase_query_db") {
            output = await executeSupabaseQuery(call.args as any);
          } else if (call.name === "mixpanel_track_analytics") {
            output = await executeMixpanelAnalytics();
          } else if (call.name === "coros_health_metrics") {
            output = await executeCorosMetrics();
          } else if (call.name === "apple_health_summary") {
            output = await executeAppleHealthSummary();
          } else if (call.name === "google_drive_search_files") {
            output = await executeGoogleDriveSearch(call.args as any);
          }

          
          const record = {
            id: call.id, // Must match the call ID
            name: call.name,
            result: output
          };
          toolResults.push(record);
          allToolOutputs.push(record);
        }

        // Send results back to model
        // If we have function calls, we MUST send the response back
        if (toolResults.length > 0) {
            // Construct the tool response parts
            const functionResponseParts = toolResults.map(tr => ({
                functionResponse: {
                    name: tr.name,
                    response: tr.result
                }
            }));
            
            contents.push({
                role: "user",
                parts: functionResponseParts
            });
            
            result = await getGeminiClient().models.generateContent({
              model: MODEL_NAME,
              contents: contents,
              config: config
            });
        } else {
            keepGoing = false;
        }

      } else {
        // No function calls, just text
        keepGoing = false;
      }
    }

    // Check if report or dashboard was generated during this turn
    const generatedReport = allToolCallRecords.some(t => t.name === "generate_yearly_report");
    const generatedDashboard = allToolCallRecords.some(t => t.name === "create_operations_dashboard");
    const generatedForm = allToolCallRecords.find(t => t.name === "create_google_form");
    const generatedEmail = allToolCallRecords.find(t => t.name === "send_gmail_email");
    const generatedTask = allToolCallRecords.find(t => t.name === "create_google_task");
    const generatedDoc = allToolCallRecords.find(t => t.name === "create_google_doc");
    const generatedCalendar = allToolCallRecords.find(t => t.name === "schedule_calendar_event");
    const generatedSheet = allToolCallRecords.find(t => t.name === "create_google_sheet");
    const generatedMeet = allToolCallRecords.find(t => t.name === "create_meet_space");
    const generatedChat = allToolCallRecords.find(t => t.name === "send_chat_message");
    const generatedJev = allToolCallRecords.find(t => t.name === "jev_classify_issue");
    const jevResultRecord = allToolOutputs.find(t => t.name === "jev_classify_issue");
    const generatedPlugin = allToolCallRecords.find(t => (
      t.name === "skyscanner_search_flights" ||
      t.name === "booking_search_hotels" ||
      t.name === "canva_generate_design" ||
      t.name === "adobe_process_asset" ||
      t.name === "github_manage_repo" ||
      t.name === "vercel_deploy_status" ||
      t.name === "supabase_query_db" ||
      t.name === "mixpanel_track_analytics" ||
      t.name === "coros_health_metrics" ||
      t.name === "apple_health_summary" ||
      t.name === "google_drive_search_files"
    ));
    const pluginResultRecord = allToolOutputs.find(t => t.name === generatedPlugin?.name);

    // Final response from model
    const modelMsg: ChatMessage = {
      role: "model",
      parts: [{ text: result.text || "" }],
      timestamp: new Date(),
      groundingMetadata: result.candidates?.[0]?.groundingMetadata,
      latencyMs: performance.now() - totalStartTime,
      hasReport: generatedReport,
      hasDashboard: generatedDashboard,
      hasForm: Boolean(generatedForm),
      hasEmail: Boolean(generatedEmail),
      hasTask: Boolean(generatedTask),
      hasDoc: Boolean(generatedDoc),
      hasCalendar: Boolean(generatedCalendar),
      hasSheet: Boolean(generatedSheet),
      hasMeet: Boolean(generatedMeet),
      hasChat: Boolean(generatedChat),
      hasJev: Boolean(generatedJev),
      jevData: jevResultRecord?.result?.data,
      hasPlugin: Boolean(generatedPlugin),
      pluginType: generatedPlugin?.name,
      pluginData: pluginResultRecord?.result?.data,
    };
    currentHistory.push(modelMsg);
    
    return currentHistory;

  } catch (error) {
    console.error("Agent Error:", error);
    const errorMsg: ChatMessage = {
      role: "model",
      parts: [{ text: "I encountered an error while processing your request. Please try again." }],
      timestamp: new Date(),
      latencyMs: performance.now() - totalStartTime,
    };
    currentHistory.push(errorMsg);
    return currentHistory;
  }
}
