/**
 * Malaysian Intercity Express Bus Freight & RedBus Schedule Service
 * ABANGCOLEK-OS Logistics Module
 * 
 * Handles intercity bus freight logistics (TBS, Larkin, MBKT, KB, Penang, etc.),
 * driver DuitNow QR payments, 1-hour arrival notice protocol, and direct agent-driver communication.
 */

export interface BusSchedule {
  id: string;
  operator: string;
  busType: string;
  originTerminal: string;
  destinationTerminal: string;
  originCity: string;
  destinationCity: string;
  departureTime: string;
  arrivalTime: string;
  durationHours: string;
  cargoFriendly: boolean;
  estimatedFreightRateMyr: number;
  redBusUrl: string;
  availableDays: string;
  platformNo?: string;
}

export interface BusConsignment {
  id: string; // e.g. BFG-2026-041
  orderIdRef?: string;
  companyName: string;
  busPlateNo: string;
  driverName: string;
  driverPhone: string;
  driverQrRef?: string;
  cargoFeeMyr: number;
  paymentStatus: 'PAID_DUITNOW' | 'PENDING_TRANSFER';
  paymentTimestamp?: string;
  
  // Route & Timings
  originTerminal: string;
  destinationTerminal: string;
  departureTime: string; // e.g. "2026-09-30 09:30 AM"
  estimatedArrivalTime: string; // e.g. "2026-09-30 03:30 PM"
  
  // Agent Details
  agentName: string;
  agentPhone: string;
  agentHub: string;
  destinationAddress: string;

  // Cargo details
  packageDescription: string;
  boxCount: number;
  bottleCount: number;

  // Status & Protocols
  status: 'TBS_HANDOVER' | 'IN_TRANSIT' | 'ONE_HOUR_ALERT' | 'ARRIVED_TERMINAL' | 'COLLECTED';
  driverContactedAgentOneHourBefore: boolean;
  agentDirectCallAllowed: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Pre-configured live routes based on popular redBus / TBS corridors
export const MALAYSIAN_BUS_SCHEDULES: BusSchedule[] = [
  // TBS -> Kuala Terengganu (MBKT)
  {
    id: 'SCH-TBS-KT-01',
    operator: 'Sani Express',
    busType: 'Double Decker 2+1 Executive',
    originTerminal: 'Terminal Bersepadu Selatan (TBS), KL',
    destinationTerminal: 'Terminal MBKT Kuala Terengganu',
    originCity: 'Kuala Lumpur',
    destinationCity: 'Kuala Terengganu',
    departureTime: '09:30 AM',
    arrivalTime: '03:45 PM',
    durationHours: '6j 15m',
    cargoFriendly: true,
    estimatedFreightRateMyr: 35,
    redBusUrl: 'https://www.redbus.my/bus-tickets/tbs-to-kuala-terengganu',
    availableDays: 'Harian (Setiap Hari)',
    platformNo: 'Gate 5, Platform 12'
  },
  {
    id: 'SCH-TBS-KT-02',
    operator: 'Adik Beradik Express',
    busType: 'Single High-Deck 30 Seater',
    originTerminal: 'Terminal Bersepadu Selatan (TBS), KL',
    destinationTerminal: 'Terminal MBKT Kuala Terengganu',
    originCity: 'Kuala Lumpur',
    destinationCity: 'Kuala Terengganu',
    departureTime: '10:00 PM',
    arrivalTime: '04:30 AM',
    durationHours: '6j 30m',
    cargoFriendly: true,
    estimatedFreightRateMyr: 40,
    redBusUrl: 'https://www.redbus.my/bus-tickets/tbs-to-kuala-terengganu',
    availableDays: 'Harian (Malam)',
    platformNo: 'Gate 2, Platform 8'
  },
  {
    id: 'SCH-TBS-KT-03',
    operator: 'Perdana Express',
    busType: 'Executive 2+1 VIP',
    originTerminal: 'Terminal Bersepadu Selatan (TBS), KL',
    destinationTerminal: 'Terminal MBKT Kuala Terengganu',
    originCity: 'Kuala Lumpur',
    destinationCity: 'Kuala Terengganu',
    departureTime: '02:30 PM',
    arrivalTime: '08:45 PM',
    durationHours: '6j 15m',
    cargoFriendly: true,
    estimatedFreightRateMyr: 35,
    redBusUrl: 'https://www.redbus.my/bus-tickets/tbs-to-kuala-terengganu',
    availableDays: 'Harian (Petang)',
    platformNo: 'Gate 4, Platform 10'
  },

  // TBS -> Kota Bharu (Terminal Lembah Sireh)
  {
    id: 'SCH-TBS-KB-01',
    operator: 'E-Mutiara',
    busType: 'Scania 2+1 Comfort Plus',
    originTerminal: 'Terminal Bersepadu Selatan (TBS), KL',
    destinationTerminal: 'Terminal Bas Lembah Sireh, Kota Bharu',
    originCity: 'Kuala Lumpur',
    destinationCity: 'Kota Bharu',
    departureTime: '09:00 AM',
    arrivalTime: '05:30 PM',
    durationHours: '8j 30m',
    cargoFriendly: true,
    estimatedFreightRateMyr: 45,
    redBusUrl: 'https://www.redbus.my/bus-tickets/tbs-to-kota-bharu',
    availableDays: 'Harian',
    platformNo: 'Gate 1, Platform 4'
  },
  {
    id: 'SCH-TBS-KB-02',
    operator: 'Perdana Express',
    busType: 'Double Decker VIP',
    originTerminal: 'Terminal Bersepadu Selatan (TBS), KL',
    destinationTerminal: 'Terminal Bas Lembah Sireh, Kota Bharu',
    originCity: 'Kuala Lumpur',
    destinationCity: 'Kota Bharu',
    departureTime: '09:45 PM',
    arrivalTime: '06:00 AM',
    durationHours: '8j 15m',
    cargoFriendly: true,
    estimatedFreightRateMyr: 50,
    redBusUrl: 'https://www.redbus.my/bus-tickets/tbs-to-kota-bharu',
    availableDays: 'Harian (Malam)',
    platformNo: 'Gate 3, Platform 9'
  },

  // Larkin Sentral (JB) -> TBS (Kuala Lumpur)
  {
    id: 'SCH-JB-TBS-01',
    operator: 'KKKL Express',
    busType: 'Super VIP 2+1',
    originTerminal: 'Larkin Sentral, Johor Bahru',
    destinationTerminal: 'Terminal Bersepadu Selatan (TBS), KL',
    originCity: 'Johor Bahru',
    destinationCity: 'Kuala Lumpur',
    departureTime: '08:30 AM',
    arrivalTime: '12:45 PM',
    durationHours: '4j 15m',
    cargoFriendly: true,
    estimatedFreightRateMyr: 30,
    redBusUrl: 'https://www.redbus.my/bus-tickets/johor-bahru-to-kuala-lumpur',
    availableDays: 'Setiap 1 Jam',
    platformNo: 'Bay 15'
  },
  {
    id: 'SCH-JB-TBS-02',
    operator: 'Mayang Sari Express',
    busType: 'Standard Executive',
    originTerminal: 'Larkin Sentral, Johor Bahru',
    destinationTerminal: 'Terminal Bersepadu Selatan (TBS), KL',
    originCity: 'Johor Bahru',
    destinationCity: 'Kuala Lumpur',
    departureTime: '02:00 PM',
    arrivalTime: '06:15 PM',
    durationHours: '4j 15m',
    cargoFriendly: true,
    estimatedFreightRateMyr: 30,
    redBusUrl: 'https://www.redbus.my/bus-tickets/johor-bahru-to-kuala-lumpur',
    availableDays: 'Setiap 1 Jam',
    platformNo: 'Bay 11'
  },

  // TBS -> Penang Sentral (Butterworth)
  {
    id: 'SCH-TBS-PEN-01',
    operator: 'Transnasional',
    busType: 'Express 2+2 Aircond',
    originTerminal: 'Terminal Bersepadu Selatan (TBS), KL',
    destinationTerminal: 'Penang Sentral (Butterworth)',
    originCity: 'Kuala Lumpur',
    destinationCity: 'Penang',
    departureTime: '10:15 AM',
    arrivalTime: '03:15 PM',
    durationHours: '5j 00m',
    cargoFriendly: true,
    estimatedFreightRateMyr: 35,
    redBusUrl: 'https://www.redbus.my/bus-tickets/kuala-lumpur-to-penang',
    availableDays: 'Harian',
    platformNo: 'Gate 6, Platform 14'
  },

  // TBS -> Kuantan Sentral
  {
    id: 'SCH-TBS-KUA-01',
    operator: 'Utama Express',
    busType: 'Executive 30-Seater',
    originTerminal: 'Terminal Bersepadu Selatan (TBS), KL',
    destinationTerminal: 'Terminal Sentral Kuantan (TSK)',
    originCity: 'Kuala Lumpur',
    destinationCity: 'Kuantan',
    departureTime: '11:00 AM',
    arrivalTime: '02:45 PM',
    durationHours: '3j 45m',
    cargoFriendly: true,
    estimatedFreightRateMyr: 30,
    redBusUrl: 'https://www.redbus.my/bus-tickets/kuala-lumpur-to-kuantan',
    availableDays: 'Harian (Setiap 2 Jam)',
    platformNo: 'Gate 3, Platform 7'
  },

  // TBS -> Melaka Sentral
  {
    id: 'SCH-TBS-MEL-01',
    operator: 'Delima Express',
    busType: 'Standard Aircond',
    originTerminal: 'Terminal Bersepadu Selatan (TBS), KL',
    destinationTerminal: 'Melaka Sentral, Melaka',
    originCity: 'Kuala Lumpur',
    destinationCity: 'Melaka',
    departureTime: '01:30 PM',
    arrivalTime: '03:45 PM',
    durationHours: '2j 15m',
    cargoFriendly: true,
    estimatedFreightRateMyr: 25,
    redBusUrl: 'https://www.redbus.my/bus-tickets/kuala-lumpur-to-malacca',
    availableDays: 'Setiap 1 Jam',
    platformNo: 'Gate 1, Platform 2'
  },

  // TBS -> Terminal Amanjaya (Ipoh)
  {
    id: 'SCH-TBS-IPH-01',
    operator: 'Sri Maju Express',
    busType: 'VIP 2+1 Comfort',
    originTerminal: 'Terminal Bersepadu Selatan (TBS), KL',
    destinationTerminal: 'Terminal Amanjaya, Ipoh',
    originCity: 'Kuala Lumpur',
    destinationCity: 'Ipoh',
    departureTime: '10:30 AM',
    arrivalTime: '01:30 PM',
    durationHours: '3j 00m',
    cargoFriendly: true,
    estimatedFreightRateMyr: 30,
    redBusUrl: 'https://www.redbus.my/bus-tickets/kuala-lumpur-to-ipoh',
    availableDays: 'Harian',
    platformNo: 'Gate 4, Platform 11'
  }
];

export interface RegisteredAgent {
  id: string;
  name: string;
  phone: string;
  handle?: string;
  hub: string;
  terminalDestination: string;
  pickupAddress: string;
}

export const REGISTERED_AGENTS: RegisteredAgent[] = [
  {
    id: 'AGT-TRG-01',
    name: 'Kak Mas (Stokis Utama Terengganu)',
    phone: '019-9481234',
    handle: '@jeruxsliurlelehterengganu',
    hub: 'Kuala Terengganu',
    terminalDestination: 'Terminal MBKT Kuala Terengganu',
    pickupAddress: 'Platform 4, Terminal Bas MBKT, Kuala Terengganu'
  },
  {
    id: 'AGT-KEL-02',
    name: 'Wan Ejen Kelantan (Lembah Sireh)',
    phone: '011-23456789',
    handle: '@abangkolek_kelantan',
    hub: 'Kota Bharu',
    terminalDestination: 'Terminal Bas Lembah Sireh, Kota Bharu',
    pickupAddress: 'Kaunter 6, Terminal Bas Lembah Sireh'
  },
  {
    id: 'AGT-SEL-03',
    name: 'Pn. Siti (Shah Alam / Lembah Klang Hub)',
    phone: '018-9998877',
    handle: '@colek_shahalam',
    hub: 'Shah Alam / TBS',
    terminalDestination: 'Terminal Bersepadu Selatan (TBS), KL',
    pickupAddress: 'TBS Arrival Bay 3, Bandar Tasik Selatan'
  },
  {
    id: 'AGT-PEN-04',
    name: 'Cikgu Din (Penang & Seberang Perai)',
    phone: '012-4455667',
    handle: '@penang_colek_lovers',
    hub: 'Penang',
    terminalDestination: 'Penang Sentral (Butterworth)',
    pickupAddress: 'Aras 2 Bay Bas Ekspres, Penang Sentral'
  },
  {
    id: 'AGT-PAH-05',
    name: 'Fauzi (Kuantan East Coast Hub)',
    phone: '013-3322114',
    handle: '@colek_kuantan_padu',
    hub: 'Kuantan',
    terminalDestination: 'Terminal Sentral Kuantan (TSK)',
    pickupAddress: 'TSK Platform 2 & Kaunter B'
  },
  {
    id: 'AGT-JOH-06',
    name: 'Hafiz (Larkin & JB Central Hub)',
    phone: '016-7890123',
    handle: '@jb_colek_kiosk',
    hub: 'Johor Bahru',
    terminalDestination: 'Larkin Sentral, Johor Bahru',
    pickupAddress: 'Larkin Sentral Bay 15, Johor Bahru'
  }
];

export const MALAYSIAN_TERMINALS = [
  { code: 'TBS', name: 'Terminal Bersepadu Selatan (TBS), KL', city: 'Kuala Lumpur' },
  { code: 'MBKT', name: 'Terminal MBKT Kuala Terengganu', city: 'Kuala Terengganu' },
  { code: 'KBR', name: 'Terminal Bas Lembah Sireh, Kota Bharu', city: 'Kota Bharu' },
  { code: 'LAR', name: 'Larkin Sentral, Johor Bahru', city: 'Johor Bahru' },
  { code: 'PEN', name: 'Penang Sentral (Butterworth)', city: 'Penang' },
  { code: 'TSK', name: 'Terminal Sentral Kuantan (TSK)', city: 'Kuantan' },
  { code: 'MEL', name: 'Melaka Sentral, Melaka', city: 'Melaka' },
  { code: 'IPH', name: 'Terminal Amanjaya, Ipoh', city: 'Ipoh' }
];

// Active bus consignments in store
const INITIAL_CONSIGNMENTS: BusConsignment[] = [
  {
    id: 'BFG-2026-081',
    orderIdRef: 'ORD-2026-004',
    companyName: 'Sani Express',
    busPlateNo: 'VDF 8821',
    driverName: 'Abang Zul (Driver Sani)',
    driverPhone: '017-9824112',
    driverQrRef: 'DNG-QR-SANI-8821',
    cargoFeeMyr: 40.00,
    paymentStatus: 'PAID_DUITNOW',
    paymentTimestamp: '2026-09-30 09:15 AM',
    originTerminal: 'Terminal Bersepadu Selatan (TBS), KL',
    destinationTerminal: 'Terminal MBKT Kuala Terengganu',
    departureTime: '09:30 AM',
    estimatedArrivalTime: '03:45 PM',
    agentName: 'Kak Mas (@jeruxsliurlelehterengganu)',
    agentPhone: '019-9481234',
    agentHub: 'Kuala Terengganu',
    destinationAddress: 'Platform 4, Terminal Bas MBKT, Kuala Terengganu',
    packageDescription: '2 Kotak Tebal (100 Botol Kuah Colek Buah Original 500g)',
    boxCount: 2,
    bottleCount: 100,
    status: 'ONE_HOUR_ALERT', // 1 hour notice phase!
    driverContactedAgentOneHourBefore: true,
    agentDirectCallAllowed: true,
    notes: 'Bas melepasi Tol Ajil. Driver telah hubungi Kak Mas jam 2:45 PM. Ejen bertolak ke MBKT sekarang.',
    createdAt: '2026-09-30T09:15:00.000Z',
    updatedAt: '2026-09-30T14:48:00.000Z'
  },
  {
    id: 'BFG-2026-079',
    orderIdRef: 'ORD-2026-007',
    companyName: 'Perdana Express',
    busPlateNo: 'DDA 5439',
    driverName: 'Pak Tam (Perdana)',
    driverPhone: '013-9118765',
    driverQrRef: 'DNG-QR-PERDANA-5439',
    cargoFeeMyr: 45.00,
    paymentStatus: 'PAID_DUITNOW',
    paymentTimestamp: '2026-09-30 08:45 AM',
    originTerminal: 'Terminal Bersepadu Selatan (TBS), KL',
    destinationTerminal: 'Terminal Bas Lembah Sireh, Kota Bharu',
    departureTime: '09:00 AM',
    estimatedArrivalTime: '05:30 PM',
    agentName: 'Wan Ejen Kelantan',
    agentPhone: '011-23456789',
    agentHub: 'Kota Bharu',
    destinationAddress: 'Terminal Lembah Sireh, Kaunter 6',
    packageDescription: '1 Kotak Kargo (50 Botol Kuah Colek + 20 Jeruk Mangga)',
    boxCount: 1,
    bottleCount: 50,
    status: 'IN_TRANSIT',
    driverContactedAgentOneHourBefore: false,
    agentDirectCallAllowed: true,
    notes: 'Bas dalam perjalanan melepasi Gua Musang. Anggaran driver akan call jam 4:30 PM.',
    createdAt: '2026-09-30T08:50:00.000Z',
    updatedAt: '2026-09-30T11:20:00.000Z'
  },
  {
    id: 'BFG-2026-072',
    orderIdRef: 'ORD-2026-002',
    companyName: 'KKKL Express',
    busPlateNo: 'JRY 4210',
    driverName: 'Encik Rosli',
    driverPhone: '012-7654321',
    driverQrRef: 'DNG-QR-KKKL-4210',
    cargoFeeMyr: 30.00,
    paymentStatus: 'PAID_DUITNOW',
    paymentTimestamp: '2026-09-29 08:15 AM',
    originTerminal: 'Larkin Sentral, Johor Bahru',
    destinationTerminal: 'Terminal Bersepadu Selatan (TBS), KL',
    departureTime: '08:30 AM',
    estimatedArrivalTime: '12:45 PM',
    agentName: 'Pn. Siti (Shah Alam Hub)',
    agentPhone: '018-9998877',
    agentHub: 'Shah Alam / TBS',
    destinationAddress: 'TBS Arrival Bay 3',
    packageDescription: '3 Kotak (150 Botol Kuah Colek Padu)',
    boxCount: 3,
    bottleCount: 150,
    status: 'COLLECTED',
    driverContactedAgentOneHourBefore: true,
    agentDirectCallAllowed: true,
    notes: 'Stok telah dituntut oleh Pn Siti di TBS dalam keadaan sempurna tanpa sebarang botol bocor.',
    createdAt: '2026-09-29T08:15:00.000Z',
    updatedAt: '2026-09-29T13:05:00.000Z'
  }
];

class BusFreightManager {
  private consignments: BusConsignment[] = [];
  private listeners: (() => void)[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem('abangcolek_bus_consignments');
      if (stored) {
        this.consignments = JSON.parse(stored);
      } else {
        this.consignments = [...INITIAL_CONSIGNMENTS];
        this.saveToStorage();
      }
    } catch {
      this.consignments = [...INITIAL_CONSIGNMENTS];
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem('abangcolek_bus_consignments', JSON.stringify(this.consignments));
    } catch {
      // ignore
    }
    this.notify();
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  private notify() {
    this.listeners.forEach(cb => cb());
  }

  public getConsignments(): BusConsignment[] {
    return [...this.consignments];
  }

  public getConsignmentById(id: string): BusConsignment | undefined {
    return this.consignments.find(c => c.id === id);
  }

  public addConsignment(data: Omit<BusConsignment, 'id' | 'createdAt' | 'updatedAt'>): BusConsignment {
    const nextNum = Math.floor(100 + Math.random() * 900);
    const newId = `BFG-2026-${nextNum}`;
    const newRecord: BusConsignment = {
      ...data,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.consignments.unshift(newRecord);
    this.saveToStorage();
    return newRecord;
  }

  public updateStatus(
    id: string, 
    newStatus: BusConsignment['status'], 
    driverCalledAgent: boolean = false,
    notes?: string
  ): boolean {
    const item = this.consignments.find(c => c.id === id);
    if (!item) return false;

    item.status = newStatus;
    if (driverCalledAgent) {
      item.driverContactedAgentOneHourBefore = true;
    }
    if (notes) {
      item.notes = notes;
    }
    item.updatedAt = new Date().toISOString();
    this.saveToStorage();
    return true;
  }

  public searchSchedules(originCity?: string, destCity?: string): BusSchedule[] {
    return MALAYSIAN_BUS_SCHEDULES.filter(s => {
      const matchOrigin = !originCity || originCity === 'all' || s.originCity.toLowerCase().includes(originCity.toLowerCase());
      const matchDest = !destCity || destCity === 'all' || s.destinationCity.toLowerCase().includes(destCity.toLowerCase());
      return matchOrigin && matchDest;
    });
  }

  /**
   * Generate official WhatsApp message for Agent with Bus & Driver details
   */
  public generateAgentWhatsAppMessage(c: BusConsignment): string {
    return `📢 *NOTIS PENGHANTARAN STOK ABANG COLEK (KONSINAN BAS)* 📢

Salam ${c.agentName},
Stok kuah colek anda telah selamat diserahkan kepada driver bas ekspres di terminal. Berikut butiran bas untuk rujukan anda:

🚌 *Syarikat Bas:* ${c.companyName}
🔢 *No Pendaftaran Bas:* ${c.busPlateNo}
👤 *Driver Bas:* ${c.driverName}
📞 *No Telefon Driver:* ${c.driverPhone}
🏬 *Terminal Asal:* ${c.originTerminal}
📍 *Terminal Ambilan:* ${c.destinationTerminal}

⏰ *Masa Berlepas:* ${c.departureTime}
⏳ *Anggaran Tiba (ETA):* ${c.estimatedArrivalTime}
📦 *Pakej:* ${c.packageDescription}
💳 *Status Bayaran Kargo:* ${c.paymentStatus === 'PAID_DUITNOW' ? 'SUDAH DIBAYAR OLEH HQ (DuitNow QR)' : 'PENDING'}

⚠️ *SOP 1 JAM SEBELUM TIBA:*
Driver bas akan menghubungi anda 1 jam sebelum sampai ke terminal destinasi. Anda juga *BERHAK MENGHUBUNGI DRIVER BAS* secara terus bila-bila masa melalui no di atas untuk semak lokasi bas.

Terima kasih atas sokongan ejen Abang Colek! 🔥`;
  }

  /**
   * Generate official WhatsApp message for Bus Driver with cargo instructions
   */
  public generateDriverWhatsAppMessage(c: BusConsignment): string {
    return `Salam Abang ${c.driverName} (${c.companyName} - ${c.busPlateNo}),
Saya dari HQ Abang Colek. Terima kasih bawa kotak stok kargo kami dari ${c.originTerminal} ke ${c.destinationTerminal}.

Bayaran upah kargo *RM ${c.cargoFeeMyr.toFixed(2)}* telah selesai dipindahkan ke akaun / DuitNow QR abang (${c.driverQrRef || 'DuitNow QR'}).

*BUTIRAN PENERIMA (EJEN ABANG COLEK):*
👤 Penerima: ${c.agentName}
📞 No Tel Ejen: ${c.agentPhone}
📍 Lokasi Ambilan: ${c.destinationAddress}
📦 Kargo: ${c.packageDescription}

*PERINGATAN SOP:*
Mohon jasa baik abang untuk *call/WhatsApp penerima 1 jam sebelum bas sampai* ke terminal supaya ejen kami sempat bersiap tunggu di platform. Terima kasih banyak abang driver! 🙏`;
  }

  /**
   * Generate message when Agent contacts Bus Driver directly
   */
  public generateAgentToDriverMessage(c: BusConsignment): string {
    return `Salam Abang ${c.driverName} (${c.companyName} - ${c.busPlateNo}),
Saya ${c.agentName} (Ejen Abang Colek di ${c.agentHub}).
HQ Abang Colek dah update butiran konsinan bas:
📍 Lokasi Ambilan: ${c.destinationTerminal}
⏰ Anggaran Tiba: ${c.estimatedArrivalTime}
📦 Pakej: ${c.packageDescription}

Saya cuma nak semak anggaran kedudukan bas sekarang supaya saya boleh bersiap ke terminal awal. Terima kasih abang!`;
  }

  /**
   * Complete DuitNow QR Payment to driver / agent
   */
  public markDuitNowPaid(id: string, qrRef?: string): boolean {
    const item = this.consignments.find(c => c.id === id);
    if (!item) return false;
    item.paymentStatus = 'PAID_DUITNOW';
    item.paymentTimestamp = new Date().toLocaleString('ms-MY', { hour12: true });
    if (qrRef) item.driverQrRef = qrRef;
    item.updatedAt = new Date().toISOString();
    this.saveToStorage();
    return true;
  }

  /**
   * Trigger 1-Hour Arrival Notice (Driver calls Agent)
   */
  public triggerOneHourNotice(id: string, notes?: string): boolean {
    const item = this.consignments.find(c => c.id === id);
    if (!item) return false;
    item.status = 'ONE_HOUR_ALERT';
    item.driverContactedAgentOneHourBefore = true;
    if (notes) {
      item.notes = notes;
    } else {
      item.notes = `Driver telah hubungi ejen ${item.agentName} 1 jam sebelum sampai pada ${new Date().toLocaleTimeString('ms-MY')}. Ejen bersiap ke ${item.destinationTerminal}.`;
    }
    item.updatedAt = new Date().toISOString();
    this.saveToStorage();
    return true;
  }
}

export function formatWhatsAppUrl(phoneNumber: string, message: string): string {
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
  const malaysianPhone = cleanPhone.startsWith('60') 
    ? cleanPhone 
    : cleanPhone.startsWith('0') 
      ? `60${cleanPhone.slice(1)}` 
      : `60${cleanPhone}`;
  return `https://wa.me/${malaysianPhone}?text=${encodeURIComponent(message)}`;
}

export const busFreightManager = new BusFreightManager();
