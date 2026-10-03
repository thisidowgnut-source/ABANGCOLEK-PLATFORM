/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */


export interface OrderItem {
  order_id: string;
  customer_id: string;
  status: 'Delivered' | 'Processing' | 'Delayed' | 'Refunded' | 'Cancelled';
  amount: number;
  date: string;
  estimated_delivery?: string | null;
  delivered_date?: string | null;
  city: string;
  items: string;
  tracking_number?: string;
  refund_reason?: string;
}

export interface ReviewItem {
  review_id: string;
  order_id: string;
  score: number;
  product_category: string;
  comment_message: string;
  creation_date: string;
  issue_class?: string;
}

export interface BusinessWorkflow {
  id: string;
  title: string;
  question: string;
  status: 'VERIFIED' | 'UNDER_REVIEW' | 'GATED';
  owner_signoff: boolean;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  verifiedDetails: string;
  ownerNotes?: string;
  lastUpdated?: string;
}

// The old key contains bundled demo orders; do not silently import it as business truth.
const ORDERS_KEY = 'abangcolek_legacy_orders_v2';
const WORKFLOWS_KEY = 'abangcolek_workflows';

export const INITIAL_WORKFLOWS: BusinessWorkflow[] = [
  {
    id: "ORDER_FLOW",
    title: "1. Order Intake & Fulfillment Trace",
    question: "Bagaimanakah pesanan daripada WhatsApp, TikTok Shop, dan gerai disahkan & diproses tanpa kehilangan slip transaksi?",
    status: "UNDER_REVIEW",
    owner_signoff: true,
    riskLevel: "HIGH",
    verifiedDetails: "Majoriti pesanan masuk melalui WhatsApp Business & jualan langsung gerai pop-up. Risiko kehilangan resit transaksi fizikal tinggi jika tiada POS digital berpusat."
  },
  {
    id: "STOCK_OWNERSHIP",
    title: "2. Stock Ownership & Multi-Location Inventory",
    question: "Siapa pemilik inventori sah di HQ kilang vs van krew bergerak vs pegangan stok ejen?",
    status: "GATED",
    owner_signoff: false,
    riskLevel: "HIGH",
    verifiedDetails: "Stok gerai pop-up dibawa secara konsainan harian. Ejen membeli secara borong tunai (cash & carry), namun polisi pemulangan botol rosak belum dimaktubkan."
  },
  {
    id: "AGENT_RESTOCK",
    title: "3. Agent Approval & Replenishment Rules",
    question: "Apakah syarat kuantiti minimum (MOQ), margin keuntungan, dan terma penambahan stok ejen negeri?",
    status: "GATED",
    owner_signoff: false,
    riskLevel: "MEDIUM",
    verifiedDetails: "Pakej permulaan 50 botol kuah colek. Stokis Terengganu (@jeruxsliurlelehterengganu) memegang kuota pantai timur tetapi rekod perjanjian rasmi belum disatukan."
  },
  {
    id: "COMPLAINT_TRACE",
    title: "4. Leakage & Bottle Defect Triage (LEAKAGE)",
    question: "Bagaimanakah aduan penutup botol bocor dijejaki semula ke pembekal botol (batch lot) vs kerosakan kurier?",
    status: "UNDER_REVIEW",
    owner_signoff: true,
    riskLevel: "CRITICAL",
    verifiedDetails: "Aduan kerap diterima semasa penghantaran pos luar negeri. Penutup botol plastik mengalami kebocoran jika tekanan udara kurier tinggi. Dikelaskan di JEV sebagai LEAKAGE dengan punca operasi kekal UNDETERMINED sehingga semakan kilang."
  },
  {
    id: "PRODUCTION_TRACE",
    title: "5. Batch Recipe (BOM) & QC Verification",
    question: "Apakah prosedur kawalan kualiti bancuhan kuah colek dan ujian ketat penutup botol sebelum dihantar?",
    status: "GATED",
    owner_signoff: false,
    riskLevel: "HIGH",
    verifiedDetails: "Bancuhan kuah dibuat secara berkala di dapur/kilang Johor Bahru. Memerlukan SOP digital Google Docs untuk piawaian suhu dan seal induction liner."
  },
  {
    id: "TRANSPORT_TRACE",
    title: "6. Inter-State Distribution & Cold/Ambient Chain",
    question: "Bagaimanakah logistik antara HQ Johor Bahru ke hab Shah Alam dan Terengganu diuruskan?",
    status: "UNDER_REVIEW",
    owner_signoff: false,
    riskLevel: "MEDIUM",
    verifiedDetails: "Menggunakan penghantaran kargo darat dan kurier domestik. Kuah colek tahan suhu bilik, namun jeruk buah memerlukan kawalan suhu sejuk."
  },
  {
    id: "EVENT_CREW",
    title: "7. Event Roster & Daily Commission Settlement",
    question: "Bagaimanakah pembahagian giliran krew gerai StyloAirpool dan komisen jualan harian dikira?",
    status: "GATED",
    owner_signoff: false,
    riskLevel: "MEDIUM",
    verifiedDetails: "Krew karnival dibayar elaun harian tambah komisen botol terjual. Rekod jualan tunai perlu diselaraskan setiap malam."
  },
  {
    id: "PAYMENT_CLOSE",
    title: "8. Daily Cash & DuitNow QR Reconciliation",
    question: "Bagaimanakah jualan tunai pop-up, bayaran DuitNow QR, dan pemindahan bank diselaraskan ke penyata syarikat?",
    status: "UNDER_REVIEW",
    owner_signoff: true,
    riskLevel: "HIGH",
    verifiedDetails: "Jualan di Toppen dan Pasar Karat menggunakan DuitNow QR peribadi/syarikat bercampur. Diperlukan penjejak rekod Google Sheets automatik setiap hari."
  }
];

class StoreService {
  private orders: OrderItem[];
  private reviews: ReviewItem[];
  private workflows: BusinessWorkflow[];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.orders = this.loadOrders();
    this.reviews = [];
    this.workflows = this.loadWorkflows();
  }

  private loadOrders(): OrderItem[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      const raw = localStorage.getItem(ORDERS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Could not load orders from localStorage:', e);
    }
    return [];
  }

  private saveOrders() {
    try {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(this.orders));
    } catch (e) {
      console.warn('Could not save orders to localStorage:', e);
    }
    this.notify();
  }

  private loadWorkflows(): BusinessWorkflow[] {
    if (typeof localStorage === 'undefined') return INITIAL_WORKFLOWS;
    try {
      const raw = localStorage.getItem(WORKFLOWS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Could not load workflows from localStorage:', e);
    }
    return INITIAL_WORKFLOWS;
  }

  private saveWorkflows() {
    try {
      localStorage.setItem(WORKFLOWS_KEY, JSON.stringify(this.workflows));
    } catch (e) {
      console.warn('Could not save workflows to localStorage:', e);
    }
    this.notify();
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  // --- Orders API ---
  public getOrders(): OrderItem[] {
    return [...this.orders];
  }

  public addOrder(order: Omit<OrderItem, 'order_id' | 'date'>): OrderItem {
    const newOrder: OrderItem = {
      ...order,
      order_id: `AC-ORD-${1000 + this.orders.length + 1}`,
      date: new Date().toISOString(),
    };
    this.orders = [newOrder, ...this.orders];
    this.saveOrders();
    return newOrder;
  }

  public updateOrderStatus(orderId: string, status: OrderItem['status']): boolean {
    const idx = this.orders.findIndex(o => o.order_id === orderId);
    if (idx !== -1) {
      this.orders[idx] = { ...this.orders[idx], status };
      if (status === 'Delivered') {
        this.orders[idx].delivered_date = new Date().toISOString();
      }
      this.saveOrders();
      return true;
    }
    return false;
  }

  public issueRefund(orderId: string, refundAmount: number, reasonCode: string): boolean {
    const idx = this.orders.findIndex(o => o.order_id === orderId);
    if (idx !== -1) {
      this.orders[idx] = {
        ...this.orders[idx],
        status: 'Refunded',
        refund_reason: `Bayaran balik RM${refundAmount} (${reasonCode}) - Diluluskan pada ${new Date().toLocaleDateString()}`
      };
      this.saveOrders();
      return true;
    }
    return false;
  }

  // --- Reviews API ---
  public getReviews(): ReviewItem[] {
    return [...this.reviews];
  }

  // --- Workflows API ---
  public getWorkflows(): BusinessWorkflow[] {
    return [...this.workflows];
  }

  public updateWorkflowSignoff(workflowId: string, signoff: boolean, notes?: string): BusinessWorkflow | null {
    const idx = this.workflows.findIndex(w => w.id === workflowId);
    if (idx !== -1) {
      this.workflows[idx] = {
        ...this.workflows[idx],
        owner_signoff: signoff,
        status: signoff ? 'VERIFIED' : 'GATED',
        ownerNotes: notes !== undefined ? notes : this.workflows[idx].ownerNotes,
        lastUpdated: new Date().toISOString()
      };
      this.saveWorkflows();
      return this.workflows[idx];
    }
    return null;
  }
}

export const appStore = new StoreService();
