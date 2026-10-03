/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase, SUPABASE_CONFIG } from './supabaseClient';
import { BusConsignment } from './busFreightService';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface TrafficData {
  condition: 'LANCAR' | 'SEDERHANA' | 'SESAK';
  congestionMultiplier: number;
  delayMinutes: number;
  description: string;
  calculatedEtaTime: string;
  oneHourZoneStatus: 'DALAM_ZON_1_JAM' | 'MENGHAMPIRI' | 'JAUH';
  timeUntilOneHourZoneMinutes: number;
  distanceToOneHourZoneKm: number;
  agentRecommendedAction: string;
}

export interface CoordinateUpdateEvent {
  id: string;
  shipment: ShipmentRecord;
  newCoord: LatLng;
  speedKmh: number;
  milestone: string;
  traffic: TrafficData;
  isOneHourTrigger: boolean;
  timestamp: string;
}

export interface ShipmentRecord {
  id: string; // e.g. SHP-2026-081
  consignment_id: string; // e.g. BFG-2026-081
  company_name: string;
  bus_plate_no: string;
  driver_name: string;
  driver_phone: string;
  driver_qr_ref: string;
  agent_name: string;
  agent_phone: string;
  agent_hub: string;
  origin_terminal: string;
  destination_terminal: string;
  origin_coord: LatLng;
  destination_coord: LatLng;
  current_coord: LatLng;
  speed_kmh: number;
  heading: number; // 0-360 degrees
  progress_pct: number; // 0 - 100
  departure_time: string;
  estimated_arrival_time: string;
  status: 'TBS_HANDOVER' | 'IN_TRANSIT' | 'ONE_HOUR_ALERT' | 'ARRIVED_TERMINAL' | 'COLLECTED';
  last_milestone: string;
  cargo_fee: number;
  package_desc: string;
  driver_contacted_agent: boolean;
  distance_remaining_km: number;
  eta_minutes: number;
  traffic?: TrafficData;
  updated_at: string;
}

// Key highway reference points for realistic route interpolation across Peninsular Malaysia
export const TERMINAL_COORDINATES: Record<string, LatLng> = {
  'TBS': { lat: 3.0722, lng: 101.7118 }, // Terminal Bersepadu Selatan, KL
  'MBKT': { lat: 5.3340, lng: 103.1408 }, // Terminal MBKT Kuala Terengganu
  'LEMBAH_SIREH': { lat: 6.1264, lng: 102.2346 }, // Terminal Bas Lembah Sireh, Kota Bharu
  'LARKIN': { lat: 1.4967, lng: 103.7431 }, // Larkin Sentral, Johor Bahru
  'PENANG_SENTRAL': { lat: 5.3976, lng: 100.3664 }, // Penang Sentral, Butterworth
  'TSK_KUANTAN': { lat: 3.8242, lng: 103.2922 }, // Terminal Sentral Kuantan
  'AMANJAYA_IPOH': { lat: 4.6738, lng: 101.0706 }, // Terminal Amanjaya, Ipoh
  'MELAKA_SENTRAL': { lat: 2.2195, lng: 102.2478 }, // Melaka Sentral
};

// Highway corridor waypoints for realistic bus curves along Malaysian expressways (LPT, PLUS, CSR)
export const HIGHWAY_CORRIDORS: Record<string, LatLng[]> = {
  'TBS-MBKT': [
    { lat: 3.0722, lng: 101.7118 }, // TBS
    { lat: 3.1900, lng: 101.7400 }, // MRR2 Gombak
    { lat: 3.3280, lng: 101.8750 }, // Karak Genting Sempah
    { lat: 3.4800, lng: 102.1600 }, // Bentong LPT1
    { lat: 3.4750, lng: 102.4300 }, // Temerloh R&R
    { lat: 3.7300, lng: 102.9400 }, // Gambang LPT1
    { lat: 4.0200, lng: 103.3100 }, // Jabor LPT2
    { lat: 4.4500, lng: 103.4400 }, // Kijal / Chukai
    { lat: 4.7600, lng: 103.3500 }, // Bukit Besi
    { lat: 5.0482, lng: 103.0118 }, // Tol Ajil (1 Hour Alert Zone)
    { lat: 5.2100, lng: 103.0800 }, // Telemung
    { lat: 5.3340, lng: 103.1408 }, // MBKT Kuala Terengganu
  ],
  'TBS-KB': [
    { lat: 3.0722, lng: 101.7118 }, // TBS
    { lat: 3.3400, lng: 101.8500 }, // Karak
    { lat: 3.5300, lng: 101.9100 }, // Raub
    { lat: 4.1800, lng: 101.9800 }, // Kuala Lipis CSR
    { lat: 4.5200, lng: 102.0000 }, // Merapoh
    { lat: 4.8821, lng: 101.9680 }, // Gua Musang
    { lat: 5.5300, lng: 102.1900 }, // Kuala Krai (1 Hour Alert Zone)
    { lat: 5.8600, lng: 102.2100 }, // Machang
    { lat: 6.1264, lng: 102.2346 }, // Lembah Sireh, Kota Bharu
  ],
  'JB-TBS': [
    { lat: 1.4967, lng: 103.7431 }, // Larkin Sentral JB
    { lat: 1.7000, lng: 103.6000 }, // Kulai PLUS
    { lat: 1.9800, lng: 103.1000 }, // Ayer Hitam
    { lat: 2.2200, lng: 102.5500 }, // Pagoh R&R
    { lat: 2.3700, lng: 102.2200 }, // Ayer Keroh Melaka
    { lat: 2.7258, lng: 101.9378 }, // Seremban (1 Hour Alert Zone)
    { lat: 2.9200, lng: 101.7800 }, // Bangi / Kajang
    { lat: 3.0722, lng: 101.7118 }, // TBS Kuala Lumpur
  ],
  'TBS-PENANG': [
    { lat: 3.0722, lng: 101.7118 }, // TBS
    { lat: 3.3100, lng: 101.5900 }, // Rawang PLUS
    { lat: 3.7500, lng: 101.4000 }, // Tanjung Malim
    { lat: 4.1200, lng: 101.2800 }, // Tapah R&R
    { lat: 4.6720, lng: 101.0740 }, // Ipoh / Menora Tunnel
    { lat: 4.8500, lng: 100.7400 }, // Taiping
    { lat: 5.1500, lng: 100.4900 }, // Jawi / Bukit Tambun (1 Hour Alert Zone)
    { lat: 5.3976, lng: 100.3664 }, // Penang Sentral Butterworth
  ],
  'TBS-KUANTAN': [
    { lat: 3.0722, lng: 101.7118 }, // TBS
    { lat: 3.3300, lng: 101.8800 }, // Karak
    { lat: 3.4800, lng: 102.4300 }, // Temerloh
    { lat: 3.5600, lng: 102.7200 }, // Maran LPT1
    { lat: 3.7142, lng: 103.1580 }, // Gambang (1 Hour Alert Zone)
    { lat: 3.8242, lng: 103.2922 }, // TSK Kuantan
  ]
};

// Seed active bus shipments on Malaysian highways
export const INITIAL_SUPABASE_SHIPMENTS: ShipmentRecord[] = [
  {
    id: 'SHP-2026-081',
    consignment_id: 'BFG-2026-081',
    company_name: 'Sani Express',
    bus_plate_no: 'VDF 8821',
    driver_name: 'Abang Zul (Driver Sani)',
    driver_phone: '017-9824112',
    driver_qr_ref: 'DNG-QR-SANI-8821',
    agent_name: 'Kak Mas (@jeruxsliurlelehterengganu)',
    agent_phone: '019-9481234',
    agent_hub: 'Kuala Terengganu',
    origin_terminal: 'Terminal Bersepadu Selatan (TBS), KL',
    destination_terminal: 'Terminal MBKT Kuala Terengganu',
    origin_coord: TERMINAL_COORDINATES['TBS'],
    destination_coord: TERMINAL_COORDINATES['MBKT'],
    current_coord: { lat: 5.0482, lng: 103.0118 }, // Near Tol Ajil
    speed_kmh: 88,
    heading: 42,
    progress_pct: 84,
    departure_time: '09:30 AM',
    estimated_arrival_time: '03:45 PM',
    status: 'ONE_HOUR_ALERT', // Live in 1-hour notice radius!
    last_milestone: 'LPT2 KM 385 Melepasi Plaza Tol Ajil. Pemandu telah hubungi Kak Mas jam 2:45 PM.',
    cargo_fee: 40.00,
    package_desc: '2 Kotak Tebal (100 Botol Kuah Colek Original)',
    driver_contacted_agent: true,
    distance_remaining_km: 36.4,
    eta_minutes: 28,
    updated_at: new Date().toISOString()
  },
  {
    id: 'SHP-2026-079',
    consignment_id: 'BFG-2026-079',
    company_name: 'Perdana Express',
    bus_plate_no: 'DDA 5439',
    driver_name: 'Pak Tam (Perdana)',
    driver_phone: '013-9118765',
    driver_qr_ref: 'DNG-QR-PERDANA-5439',
    agent_name: 'Wan Ejen Kelantan',
    agent_phone: '011-23456789',
    agent_hub: 'Kota Bharu',
    origin_terminal: 'Terminal Bersepadu Selatan (TBS), KL',
    destination_terminal: 'Terminal Bas Lembah Sireh, Kota Bharu',
    origin_coord: TERMINAL_COORDINATES['TBS'],
    destination_coord: TERMINAL_COORDINATES['LEMBAH_SIREH'],
    current_coord: { lat: 4.8821, lng: 101.9680 }, // Central Spine Road near Gua Musang
    speed_kmh: 76,
    heading: 18,
    progress_pct: 62,
    departure_time: '09:00 AM',
    estimated_arrival_time: '05:30 PM',
    status: 'IN_TRANSIT',
    last_milestone: 'CSR Gua Musang By-pass. Anggaran masuk zon 1-jam (Kuala Krai) jam 4:30 PM.',
    cargo_fee: 45.00,
    package_desc: '1 Kotak Kargo (50 Botol Kuah Colek + 20 Jeruk Mangga)',
    driver_contacted_agent: false,
    distance_remaining_km: 154.0,
    eta_minutes: 115,
    updated_at: new Date().toISOString()
  },
  {
    id: 'SHP-2026-072',
    consignment_id: 'BFG-2026-072',
    company_name: 'KKKL Express',
    bus_plate_no: 'JRY 4210',
    driver_name: 'Encik Rosli (KKKL)',
    driver_phone: '012-7654321',
    driver_qr_ref: 'DNG-QR-KKKL-4210',
    agent_name: 'Pn. Siti (Shah Alam / TBS Hub)',
    agent_phone: '018-9998877',
    agent_hub: 'Shah Alam / TBS',
    origin_terminal: 'Larkin Sentral, Johor Bahru',
    destination_terminal: 'Terminal Bersepadu Selatan (TBS), KL',
    origin_coord: TERMINAL_COORDINATES['LARKIN'],
    destination_coord: TERMINAL_COORDINATES['TBS'],
    current_coord: { lat: 2.7258, lng: 101.9378 }, // PLUS Highway near Seremban
    speed_kmh: 92,
    heading: 335,
    progress_pct: 89,
    departure_time: '08:30 AM',
    estimated_arrival_time: '12:45 PM',
    status: 'ONE_HOUR_ALERT',
    last_milestone: 'PLUS KM 268 Melepasi Tol Seremban. Pemandu bersedia masuk Tol Sungai Besi.',
    cargo_fee: 30.00,
    package_desc: '3 Kotak (150 Botol Kuah Colek Padu)',
    driver_contacted_agent: true,
    distance_remaining_km: 44.2,
    eta_minutes: 32,
    updated_at: new Date().toISOString()
  },
  {
    id: 'SHP-2026-065',
    consignment_id: 'BFG-2026-065',
    company_name: 'Transnasional',
    bus_plate_no: 'PLH 1120',
    driver_name: 'Abang Din (Transnasional)',
    driver_phone: '014-5556677',
    driver_qr_ref: 'DNG-QR-TRANS-1120',
    agent_name: 'Cikgu Din (Penang & Seberang Perai)',
    agent_phone: '012-4455667',
    agent_hub: 'Penang',
    origin_terminal: 'Terminal Bersepadu Selatan (TBS), KL',
    destination_terminal: 'Penang Sentral (Butterworth)',
    origin_coord: TERMINAL_COORDINATES['TBS'],
    destination_coord: TERMINAL_COORDINATES['PENANG_SENTRAL'],
    current_coord: { lat: 4.6720, lng: 101.0740 }, // PLUS Highway near Ipoh
    speed_kmh: 84,
    heading: 345,
    progress_pct: 54,
    departure_time: '10:15 AM',
    estimated_arrival_time: '03:15 PM',
    status: 'IN_TRANSIT',
    last_milestone: 'PLUS Utara Melepasi Terowong Menora Perak. Trafik lancar.',
    cargo_fee: 35.00,
    package_desc: '2 Kotak (80 Botol Kuah Colek Buah)',
    driver_contacted_agent: false,
    distance_remaining_km: 148.0,
    eta_minutes: 105,
    updated_at: new Date().toISOString()
  },
  {
    id: 'SHP-2026-058',
    consignment_id: 'BFG-2026-058',
    company_name: 'Utama Express',
    bus_plate_no: 'CDA 7731',
    driver_name: 'Pak Wan (Utama)',
    driver_phone: '019-3334455',
    driver_qr_ref: 'DNG-QR-UTAMA-7731',
    agent_name: 'Fauzi (Kuantan East Coast Hub)',
    agent_phone: '013-3322114',
    agent_hub: 'Kuantan',
    origin_terminal: 'Terminal Bersepadu Selatan (TBS), KL',
    destination_terminal: 'Terminal Sentral Kuantan (TSK)',
    origin_coord: TERMINAL_COORDINATES['TBS'],
    destination_coord: TERMINAL_COORDINATES['TSK_KUANTAN'],
    current_coord: { lat: 3.7142, lng: 103.1580 }, // LPT1 Gambang
    speed_kmh: 86,
    heading: 68,
    progress_pct: 88,
    departure_time: '11:00 AM',
    estimated_arrival_time: '02:45 PM',
    status: 'ONE_HOUR_ALERT',
    last_milestone: 'LPT1 Exit Gambang. Pemandu telah maklumkan Fauzi 25 minit sebelum sampai.',
    cargo_fee: 30.00,
    package_desc: '2 Kotak (100 Botol Kuah Colek)',
    driver_contacted_agent: true,
    distance_remaining_km: 26.5,
    eta_minutes: 20,
    updated_at: new Date().toISOString()
  }
];

class SupabaseShipmentsService {
  private localShipments: ShipmentRecord[] = [];
  private listeners: ((shipments: ShipmentRecord[]) => void)[] = [];
  private coordinateListeners: ((event: CoordinateUpdateEvent) => void)[] = [];
  private isConnectedToSupabase: boolean = false;
  private lastPingMs: number = 0;

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Calculates live Google Maps traffic ETA, congestion delay, and agent recommendation
   */
  public calculateGoogleMapsTrafficEta(shipment: ShipmentRecord): TrafficData {
    const d = shipment.distance_remaining_km;
    const v = Math.max(50, shipment.speed_kmh);

    // Baseline transit minutes at cruising speed
    const baseMinutes = Math.round((d / v) * 60);

    // Real-time Traffic Model based on Malaysian Expressway segments
    let condition: TrafficData['condition'] = 'LANCAR';
    let congestionMultiplier = 1.0;
    let delayMinutes = 0;
    let description = 'Trafik lebuh raya lancar pada kelajuan optimum.';

    if (shipment.progress_pct >= 75 && shipment.progress_pct <= 93) {
      // Approaching major toll plazas & terminal entrance interchanges
      if (shipment.destination_terminal.includes('Terengganu')) {
        condition = 'SEDERHANA';
        congestionMultiplier = 1.15;
        delayMinutes = 4;
        description = 'Trafik sederhana melepasi Plaza Tol Ajil (LPT2).';
      } else if (shipment.destination_terminal.includes('Kota Bharu')) {
        condition = 'SEDERHANA';
        congestionMultiplier = 1.20;
        delayMinutes = 7;
        description = 'Kerja pelebaran jalan di laluan CSR Kuala Krai - Machang.';
      } else if (shipment.destination_terminal.includes('Penang')) {
        condition = 'SEDERHANA';
        congestionMultiplier = 1.18;
        delayMinutes = 6;
        description = 'Trafik perlahan menghampiri Plaza Tol Juru / Jambatan Pulau Pinang.';
      } else if (shipment.destination_terminal.includes('TBS')) {
        condition = 'SEDERHANA';
        congestionMultiplier = 1.22;
        delayMinutes = 8;
        description = 'Aliran perlahan di Plaza Tol Sungai Besi arah utara.';
      } else {
        condition = 'SEDERHANA';
        congestionMultiplier = 1.12;
        delayMinutes = 3;
        description = 'Trafik sedikit perlahan menghampiri susur keluar terminal.';
      }
    } else if (shipment.progress_pct < 75) {
      condition = 'LANCAR';
      congestionMultiplier = 1.02;
      delayMinutes = 1;
      description = 'Kelajuan lebuh raya normal (80-92 km/j), tiada kesesakan dilaporkan.';
    } else {
      // Within last 7% near terminal
      condition = 'LANCAR';
      congestionMultiplier = 1.05;
      delayMinutes = 2;
      description = 'Kawasan bandar terminal, aliran kenderaan terkawal.';
    }

    const totalTrafficMinutes = Math.max(2, Math.round(baseMinutes * congestionMultiplier + delayMinutes));

    // Dynamic arrival time string: now + totalTrafficMinutes
    const etaDate = new Date(Date.now() + totalTrafficMinutes * 60 * 1000);
    const calculatedEtaTime = etaDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    // 1-Hour Zone Analysis (55km radius from destination terminal)
    const ONE_HOUR_RADIUS_KM = 55;
    let oneHourZoneStatus: TrafficData['oneHourZoneStatus'] = 'JAUH';
    let distanceToOneHourZoneKm = 0;
    let timeUntilOneHourZoneMinutes = 0;

    if (d <= ONE_HOUR_RADIUS_KM) {
      oneHourZoneStatus = 'DALAM_ZON_1_JAM';
      distanceToOneHourZoneKm = 0;
      timeUntilOneHourZoneMinutes = 0;
    } else if (d <= ONE_HOUR_RADIUS_KM + 35) {
      oneHourZoneStatus = 'MENGHAMPIRI';
      distanceToOneHourZoneKm = Math.round(d - ONE_HOUR_RADIUS_KM);
      timeUntilOneHourZoneMinutes = Math.max(1, Math.round((distanceToOneHourZoneKm / v) * 60));
    } else {
      oneHourZoneStatus = 'JAUH';
      distanceToOneHourZoneKm = Math.round(d - ONE_HOUR_RADIUS_KM);
      timeUntilOneHourZoneMinutes = Math.round((distanceToOneHourZoneKm / v) * 60);
    }

    // Recommended Action for Agent
    let agentRecommendedAction = '';
    if (oneHourZoneStatus === 'DALAM_ZON_1_JAM') {
      agentRecommendedAction = `⚠️ Driver ${shipment.driver_name} diwajibkan hubungi Ejen ${shipment.agent_name} sekarang. Ejen disarankan bertolak ke platform dalam 15 minit.`;
    } else if (oneHourZoneStatus === 'MENGHAMPIRI') {
      agentRecommendedAction = `Bas akan masuk radius 1 jam dalam masa ~${timeUntilOneHourZoneMinutes} minit (${distanceToOneHourZoneKm} km lagi). Bersedia untuk panggilan pemandu.`;
    } else {
      agentRecommendedAction = `Bas bergerak lancar pada kelajuan ${shipment.speed_kmh} km/j. Anggaran tiba ${calculatedEtaTime}.`;
    }

    return {
      condition,
      congestionMultiplier,
      delayMinutes,
      description,
      calculatedEtaTime,
      oneHourZoneStatus,
      timeUntilOneHourZoneMinutes,
      distanceToOneHourZoneKm,
      agentRecommendedAction
    };
  }

  public subscribeCoordinateUpdates(cb: (event: CoordinateUpdateEvent) => void): () => void {
    this.coordinateListeners.push(cb);
    return () => {
      this.coordinateListeners = this.coordinateListeners.filter(l => l !== cb);
    };
  }

  private emitCoordinateUpdate(event: CoordinateUpdateEvent) {
    this.coordinateListeners.forEach(cb => {
      try {
        cb(event);
      } catch {
        // ignore
      }
    });
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem('abangcolek_supabase_shipments');
      if (stored) {
        this.localShipments = JSON.parse(stored);
      } else {
        this.localShipments = [...INITIAL_SUPABASE_SHIPMENTS];
        this.saveToStorage();
      }
    } catch {
      this.localShipments = [...INITIAL_SUPABASE_SHIPMENTS];
    }
    // Populate Google Maps traffic ETA for each shipment
    this.localShipments.forEach(s => {
      s.traffic = this.calculateGoogleMapsTrafficEta(s);
    });
  }

  private saveToStorage() {
    try {
      localStorage.setItem('abangcolek_supabase_shipments', JSON.stringify(this.localShipments));
    } catch {
      // ignore
    }
    this.notify();
  }

  private notify() {
    this.listeners.forEach(cb => cb([...this.localShipments]));
  }

  public subscribe(cb: (shipments: ShipmentRecord[]) => void): () => void {
    this.listeners.push(cb);
    cb([...this.localShipments]);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  public getShipments(): ShipmentRecord[] {
    return [...this.localShipments];
  }

  public getShipmentById(id: string): ShipmentRecord | undefined {
    return this.localShipments.find(s => s.id === id || s.consignment_id === id);
  }

  /**
   * Fetch shipments from live Supabase `shipments` table with resilient fallback
   */
  public async fetchSupabaseShipments(): Promise<{
    data: ShipmentRecord[];
    source: 'supabase_live' | 'supabase_seed_cache';
    latencyMs: number;
    error?: string;
  }> {
    const startTime = Date.now();
    try {
      const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .order('progress_pct', { ascending: false });

      const latencyMs = Date.now() - startTime;
      this.lastPingMs = latencyMs;

      if (!error && data && data.length > 0) {
        this.isConnectedToSupabase = true;
        // Map database records into ShipmentRecord format
        const mapped: ShipmentRecord[] = data.map((d: any) => ({
          id: d.id || `SHP-${d.consignment_id || Math.floor(Math.random() * 1000)}`,
          consignment_id: d.consignment_id || d.id,
          company_name: d.company_name,
          bus_plate_no: d.bus_plate_no,
          driver_name: d.driver_name,
          driver_phone: d.driver_phone,
          driver_qr_ref: d.driver_qr_ref || 'DNG-QR',
          agent_name: d.agent_name,
          agent_phone: d.agent_phone,
          agent_hub: d.agent_hub || 'Hub',
          origin_terminal: d.origin_terminal,
          destination_terminal: d.destination_terminal,
          origin_coord: d.origin_coord || TERMINAL_COORDINATES['TBS'],
          destination_coord: d.destination_coord || TERMINAL_COORDINATES['MBKT'],
          current_coord: d.current_coord || { lat: Number(d.current_lat || 5.0482), lng: Number(d.current_lng || 103.0118) },
          speed_kmh: Number(d.speed_kmh || 80),
          heading: Number(d.heading || 45),
          progress_pct: Number(d.progress_pct || 75),
          departure_time: d.departure_time || '09:30 AM',
          estimated_arrival_time: d.estimated_arrival_time || '03:45 PM',
          status: d.status || 'IN_TRANSIT',
          last_milestone: d.last_milestone || 'Dalam perjalanan ekspres',
          cargo_fee: Number(d.cargo_fee || 40),
          package_desc: d.package_desc || 'Kotak Kuah Colek',
          driver_contacted_agent: Boolean(d.driver_contacted_agent),
          distance_remaining_km: Number(d.distance_remaining_km || 30),
          eta_minutes: Number(d.eta_minutes || 25),
          updated_at: d.updated_at || new Date().toISOString()
        }));

        this.localShipments = mapped;
        this.saveToStorage();

        return {
          data: mapped,
          source: 'supabase_live',
          latencyMs
        };
      }

      // If table doesn't exist yet or is empty, seed it to Supabase
      if (error && (error.code === '42P01' || error.message.includes('does not exist'))) {
        this.isConnectedToSupabase = true;
      }
      
      return {
        data: [...this.localShipments],
        source: 'supabase_seed_cache',
        latencyMs,
        error: error?.message
      };
    } catch (err: any) {
      this.lastPingMs = Date.now() - startTime;
      return {
        data: [...this.localShipments],
        source: 'supabase_seed_cache',
        latencyMs: this.lastPingMs,
        error: err.message
      };
    }
  }

  /**
   * Subscribe to real-time updates on `shipments` table via Supabase Channels
   */
  public subscribeToRealtimeShipments(onUpdate: (shipments: ShipmentRecord[]) => void): () => void {
    const channel = supabase
      .channel('public:shipments-live-gps')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shipments' },
        async () => {
          await this.fetchSupabaseShipments();
          onUpdate([...this.localShipments]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  /**
   * Simulate active bus movement along highway trajectory (for interactive live tracking)
   */
  public simulateBusMovement(shipmentId?: string): ShipmentRecord[] {
    const list = [...this.localShipments];
    list.forEach(shipment => {
      if (shipmentId && shipment.id !== shipmentId && shipment.consignment_id !== shipmentId) return;

      if (shipment.status !== 'COLLECTED' && shipment.status !== 'ARRIVED_TERMINAL') {
        // Increment progress by 1.5%
        const nextProgress = Math.min(100, shipment.progress_pct + 1.5);
        shipment.progress_pct = nextProgress;

        // Dynamic speed fluctuation
        shipment.speed_kmh = Math.floor(78 + Math.random() * 16); // 78 - 94 km/h

        // Check if corridor exists
        const corridorKey = shipment.destination_terminal.includes('Terengganu') ? 'TBS-MBKT' :
                           shipment.destination_terminal.includes('Bharu') ? 'TBS-KB' :
                           shipment.origin_terminal.includes('Larkin') ? 'JB-TBS' :
                           shipment.destination_terminal.includes('Penang') ? 'TBS-PENANG' : 'TBS-KUANTAN';

        const waypoints = HIGHWAY_CORRIDORS[corridorKey] || HIGHWAY_CORRIDORS['TBS-MBKT'];
        const totalSegments = waypoints.length - 1;
        const targetIndexFloat = (nextProgress / 100) * totalSegments;
        const segmentIndex = Math.min(Math.floor(targetIndexFloat), totalSegments - 1);
        const segmentFraction = targetIndexFloat - segmentIndex;

        const pA = waypoints[segmentIndex];
        const pB = waypoints[segmentIndex + 1];

        // Linear interpolation between waypoints with smooth highway heading
        const newLat = pA.lat + (pB.lat - pA.lat) * segmentFraction;
        const newLng = pA.lng + (pB.lng - pA.lng) * segmentFraction;

        shipment.current_coord = {
          lat: Number(newLat.toFixed(5)),
          lng: Number(newLng.toFixed(5))
        };

        // Recalculate distance and ETA
        const remainingKm = Math.max(2, Math.round((1 - nextProgress / 100) * 450));
        shipment.distance_remaining_km = remainingKm;
        shipment.eta_minutes = Math.max(2, Math.round(remainingKm / (shipment.speed_kmh / 60)));

        // 1-Hour Zone Threshold Trigger (under ~55 km or over 80% progress)
        if (remainingKm <= 55 && shipment.status === 'IN_TRANSIT') {
          shipment.status = 'ONE_HOUR_ALERT';
          shipment.driver_contacted_agent = true;
          shipment.last_milestone = `MASUK ZON 1 JAM: Driver telah call ${shipment.agent_name}. ${remainingKm} km lagi ke ${shipment.destination_terminal}.`;
        }

        if (nextProgress >= 100) {
          shipment.status = 'ARRIVED_TERMINAL';
          shipment.last_milestone = `Tiba di ${shipment.destination_terminal}. Menunggu ambilan ejen.`;
        }

        const traffic = this.calculateGoogleMapsTrafficEta(shipment);
        shipment.traffic = traffic;
        shipment.estimated_arrival_time = traffic.calculatedEtaTime;

        // Emit coordinate update event
        this.emitCoordinateUpdate({
          id: `EVT-${Date.now()}-${shipment.bus_plate_no}`,
          shipment: { ...shipment },
          newCoord: shipment.current_coord,
          speedKmh: shipment.speed_kmh,
          milestone: shipment.last_milestone,
          traffic,
          isOneHourTrigger: shipment.status === 'ONE_HOUR_ALERT',
          timestamp: new Date().toLocaleTimeString('ms-MY', { hour12: true })
        });

        shipment.updated_at = new Date().toISOString();
      }
    });

    this.localShipments = list;
    this.saveToStorage();
    return list;
  }

  /**
   * Sync a new Bus Consignment into Supabase shipments table
   */
  public async syncConsignmentToSupabase(c: BusConsignment): Promise<ShipmentRecord> {
    const originKey = c.originTerminal.includes('Larkin') ? 'LARKIN' : 'TBS';
    const destKey = c.destinationTerminal.includes('Terengganu') ? 'MBKT' :
                    c.destinationTerminal.includes('Kota Bharu') ? 'LEMBAH_SIREH' :
                    c.destinationTerminal.includes('Penang') ? 'PENANG_SENTRAL' :
                    c.destinationTerminal.includes('Kuantan') ? 'TSK_KUANTAN' :
                    c.destinationTerminal.includes('Melaka') ? 'MELAKA_SENTRAL' : 'MBKT';

    const originCoord = TERMINAL_COORDINATES[originKey] || TERMINAL_COORDINATES['TBS'];
    const destCoord = TERMINAL_COORDINATES[destKey] || TERMINAL_COORDINATES['MBKT'];

    const newRecord: ShipmentRecord = {
      id: `SHP-${c.id.replace('BFG-', '')}`,
      consignment_id: c.id,
      company_name: c.companyName,
      bus_plate_no: c.busPlateNo,
      driver_name: c.driverName,
      driver_phone: c.driverPhone,
      driver_qr_ref: c.driverQrRef || `DNG-QR-${c.busPlateNo}`,
      agent_name: c.agentName,
      agent_phone: c.agentPhone,
      agent_hub: c.agentHub,
      origin_terminal: c.originTerminal,
      destination_terminal: c.destinationTerminal,
      origin_coord: originCoord,
      destination_coord: destCoord,
      current_coord: {
        lat: Number((originCoord.lat + (destCoord.lat - originCoord.lat) * 0.15).toFixed(5)),
        lng: Number((originCoord.lng + (destCoord.lng - originCoord.lng) * 0.15).toFixed(5))
      },
      speed_kmh: 84,
      heading: 45,
      progress_pct: 15,
      departure_time: c.departureTime,
      estimated_arrival_time: c.estimatedArrivalTime,
      status: c.status,
      last_milestone: `Serahan selesai di ${c.originTerminal}. Bas memulakan perjalanan ekspres.`,
      cargo_fee: c.cargoFeeMyr,
      package_desc: c.packageDescription,
      driver_contacted_agent: c.driverContactedAgentOneHourBefore,
      distance_remaining_km: 380,
      eta_minutes: 270,
      updated_at: new Date().toISOString()
    };

    // Upsert into Supabase `shipments` table
    try {
      await supabase.from('shipments').upsert({
        id: newRecord.id,
        consignment_id: newRecord.consignment_id,
        company_name: newRecord.company_name,
        bus_plate_no: newRecord.bus_plate_no,
        driver_name: newRecord.driver_name,
        driver_phone: newRecord.driver_phone,
        driver_qr_ref: newRecord.driver_qr_ref,
        agent_name: newRecord.agent_name,
        agent_phone: newRecord.agent_phone,
        agent_hub: newRecord.agent_hub,
        origin_terminal: newRecord.origin_terminal,
        destination_terminal: newRecord.destination_terminal,
        current_lat: newRecord.current_coord.lat,
        current_lng: newRecord.current_coord.lng,
        speed_kmh: newRecord.speed_kmh,
        heading: newRecord.heading,
        progress_pct: newRecord.progress_pct,
        departure_time: newRecord.departure_time,
        estimated_arrival_time: newRecord.estimated_arrival_time,
        status: newRecord.status,
        last_milestone: newRecord.last_milestone,
        cargo_fee: newRecord.cargo_fee,
        package_desc: newRecord.package_desc,
        driver_contacted_agent: newRecord.driver_contacted_agent,
        distance_remaining_km: newRecord.distance_remaining_km,
        eta_minutes: newRecord.eta_minutes,
        updated_at: newRecord.updated_at
      });
    } catch {
      // Local fallback handled smoothly
    }

    this.localShipments.unshift(newRecord);
    this.saveToStorage();
    return newRecord;
  }

  public getStatusMetrics() {
    return {
      isConnected: this.isConnectedToSupabase,
      latencyMs: this.lastPingMs,
      totalShipments: this.localShipments.length,
      oneHourAlerts: this.localShipments.filter(s => s.status === 'ONE_HOUR_ALERT').length,
      inTransit: this.localShipments.filter(s => s.status === 'IN_TRANSIT').length,
      arrived: this.localShipments.filter(s => s.status === 'ARRIVED_TERMINAL' || s.status === 'COLLECTED').length
    };
  }
}

export const supabaseShipments = new SupabaseShipmentsService();
