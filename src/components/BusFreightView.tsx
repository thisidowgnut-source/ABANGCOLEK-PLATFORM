/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  InfoWindow 
} from '@vis.gl/react-google-maps';
import { 
  Truck, 
  MapPin, 
  Clock, 
  Phone, 
  MessageSquare, 
  QrCode, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Plus, 
  ExternalLink, 
  RefreshCw, 
  ArrowRight, 
  ShieldCheck, 
  Package, 
  UserCheck, 
  Radio,
  Navigation,
  Gauge,
  Compass,
  Play,
  Pause,
  FastForward,
  Maximize2,
  Database,
  Layers,
  Sparkles,
  Zap,
  Activity,
  AlertTriangle,
  TrendingUp,
  X,
  Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
  busFreightManager, 
  BusConsignment, 
  BusSchedule, 
  REGISTERED_AGENTS, 
  MALAYSIAN_TERMINALS,
  formatWhatsAppUrl 
} from '@/services/busFreightService';
import { 
  supabaseShipments, 
  ShipmentRecord, 
  TERMINAL_COORDINATES, 
  LatLng,
  TrafficData,
  CoordinateUpdateEvent
} from '@/services/supabaseShipments';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

export interface CoordinateToast {
  id: string;
  shipmentId: string;
  busPlateNo: string;
  companyName: string;
  driverName: string;
  driverPhone: string;
  agentName: string;
  agentPhone: string;
  agentHub: string;
  lat: number;
  lng: number;
  speedKmh: number;
  milestone: string;
  trafficCondition: 'LANCAR' | 'SEDERHANA' | 'SESAK';
  trafficDelayMinutes: number;
  calculatedEta: string;
  isOneHourAlert: boolean;
  timestamp: string;
}

interface BusFreightViewProps {
  onAction?: (msg?: string) => void;
}

export const BusFreightView: React.FC<BusFreightViewProps> = ({ onAction }) => {
  const [consignments, setConsignments] = useState<BusConsignment[]>([]);
  const [shipments, setShipments] = useState<ShipmentRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'live_map' | 'traffic_summary' | 'consignments' | 'schedules' | 'duitnow_qr'>('live_map');
  const [selectedOrigin, setSelectedOrigin] = useState<string>('all');
  const [selectedDest, setSelectedDest] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Interactive Google Map States
  const [selectedShipment, setSelectedShipment] = useState<ShipmentRecord | null>(null);
  const [mapCenter, setMapCenter] = useState<LatLng>({ lat: 4.1, lng: 102.3 }); // Central Peninsular Malaysia
  const [mapZoom, setMapZoom] = useState<number>(7);
  const [isSimulatingGps, setIsSimulatingGps] = useState<boolean>(true);
  const [supabaseSyncStatus, setSupabaseSyncStatus] = useState<{ isConnected: boolean; latencyMs: number; source: string }>({
    isConnected: true,
    latencyMs: 24,
    source: 'supabase_live'
  });
  const [isRefreshingSupabase, setIsRefreshingSupabase] = useState<boolean>(false);
  const [isRecalculatingTraffic, setIsRecalculatingTraffic] = useState<boolean>(false);
  const [activeCorridorFilter, setActiveCorridorFilter] = useState<'all' | 'east_coast' | 'central' | 'south' | 'north'>('all');

  // Framer-Motion Toast System State
  const [toasts, setToasts] = useState<CoordinateToast[]>([]);

  // Modals & Notices
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedConsignmentForQr, setSelectedConsignmentForQr] = useState<BusConsignment | null>(null);
  const [copiedNoticeId, setCopiedNoticeId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // New Consignment Form State
  const [companyName, setCompanyName] = useState('Sani Express');
  const [busPlateNo, setBusPlateNo] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [originTerminal, setOriginTerminal] = useState('Terminal Bersepadu Selatan (TBS), KL');
  const [destinationTerminal, setDestinationTerminal] = useState('Terminal MBKT Kuala Terengganu');
  const [departureTime, setDepartureTime] = useState('09:30 AM');
  const [estimatedArrivalTime, setEstimatedArrivalTime] = useState('03:45 PM');
  const [agentName, setAgentName] = useState('Kak Mas (@jeruxsliurlelehterengganu)');
  const [agentPhone, setAgentPhone] = useState('019-9481234');
  const [agentHub, setAgentHub] = useState('Kuala Terengganu');
  const [destinationAddress, setDestinationAddress] = useState('Platform 4, Terminal Bas MBKT, Kuala Terengganu');
  const [packageDescription, setPackageDescription] = useState('2 Kotak Tebal (100 Botol Kuah Colek Buah Original 500g)');
  const [boxCount, setBoxCount] = useState(2);
  const [bottleCount, setBottleCount] = useState(100);
  const [cargoFeeMyr, setCargoFeeMyr] = useState(40);
  const [notes, setNotes] = useState('Serahan di kaunter bas TBS. Pemandu setuju call ejen 1 jam sebelum tiba.');

  // 1. Initial Load & Subscriptions
  useEffect(() => {
    // Local consignments
    setConsignments(busFreightManager.getConsignments());
    const unsubConsignments = busFreightManager.subscribe(() => {
      setConsignments(busFreightManager.getConsignments());
    });

    // Supabase shipments
    loadSupabaseShipments();
    const unsubShipments = supabaseShipments.subscribe((data) => {
      setShipments(data);
      if (!selectedShipment && data.length > 0) {
        setSelectedShipment(data[0]);
      }
    });

    // Realtime Supabase Channel
    const unsubRealtime = supabaseShipments.subscribeToRealtimeShipments((data) => {
      setShipments(data);
    });

    // Coordinate Updates Toast Listener
    const unsubCoords = supabaseShipments.subscribeCoordinateUpdates((evt: CoordinateUpdateEvent) => {
      const newToast: CoordinateToast = {
        id: evt.id,
        shipmentId: evt.shipment.id,
        busPlateNo: evt.shipment.bus_plate_no,
        companyName: evt.shipment.company_name,
        driverName: evt.shipment.driver_name,
        driverPhone: evt.shipment.driver_phone,
        agentName: evt.shipment.agent_name,
        agentPhone: evt.shipment.agent_phone,
        agentHub: evt.shipment.agent_hub,
        lat: evt.newCoord.lat,
        lng: evt.newCoord.lng,
        speedKmh: evt.speedKmh,
        milestone: evt.milestone,
        trafficCondition: evt.traffic.condition,
        trafficDelayMinutes: evt.traffic.delayMinutes,
        calculatedEta: evt.traffic.calculatedEtaTime,
        isOneHourAlert: evt.isOneHourTrigger,
        timestamp: evt.timestamp
      };

      // Add to toast queue (keep max 3 visible)
      setToasts((prev) => [newToast, ...prev.slice(0, 2)]);

      // Auto-dismiss after 6.5 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 6500);
    });

    return () => {
      unsubConsignments();
      unsubShipments();
      unsubRealtime();
      unsubCoords();
    };
  }, []);

  // 2. Fetch Supabase Data
  const loadSupabaseShipments = async () => {
    setIsRefreshingSupabase(true);
    const res = await supabaseShipments.fetchSupabaseShipments();
    setShipments(res.data);
    setSupabaseSyncStatus({
      isConnected: true,
      latencyMs: res.latencyMs || 28,
      source: res.source
    });
    if (!selectedShipment && res.data.length > 0) {
      setSelectedShipment(res.data[0]);
    }
    setIsRefreshingSupabase(false);
  };

  // 3. Recalculate Traffic ETA
  const handleRecalculateTraffic = () => {
    setIsRecalculatingTraffic(true);
    setTimeout(() => {
      const updated = shipments.map(s => {
        const traffic = supabaseShipments.calculateGoogleMapsTrafficEta(s);
        return {
          ...s,
          traffic,
          estimated_arrival_time: traffic.calculatedEtaTime
        };
      });
      setShipments(updated);
      if (selectedShipment) {
        const found = updated.find(s => s.id === selectedShipment.id);
        if (found) setSelectedShipment(found);
      }
      setIsRecalculatingTraffic(false);
      setActionNotice('Kiraan trafik Google Maps & anggaran waktu tiba (ETA) dikemas kini secara langsung.');
      setTimeout(() => setActionNotice(null), 4000);
    }, 450);
  };

  // 4. Live GPS Telemetry Simulation Interval
  useEffect(() => {
    if (!isSimulatingGps) return;
    const interval = setInterval(() => {
      const updated = supabaseShipments.simulateBusMovement();
      setShipments([...updated]);
      if (selectedShipment) {
        const found = updated.find(s => s.id === selectedShipment.id);
        if (found) setSelectedShipment({ ...found });
      }
    }, 3200);

    return () => clearInterval(interval);
  }, [isSimulatingGps, selectedShipment]);

  // Corridor Filter Handler
  const handleCorridorFocus = (corridor: 'all' | 'east_coast' | 'central' | 'south' | 'north') => {
    setActiveCorridorFilter(corridor);
    if (corridor === 'all') {
      setMapCenter({ lat: 4.1, lng: 102.3 });
      setMapZoom(7);
    } else if (corridor === 'east_coast') {
      setMapCenter({ lat: 5.08, lng: 103.05 });
      setMapZoom(9);
      const sani = shipments.find(s => s.company_name.includes('Sani'));
      if (sani) setSelectedShipment(sani);
    } else if (corridor === 'central') {
      setMapCenter({ lat: 5.15, lng: 102.1 });
      setMapZoom(8);
      const perdana = shipments.find(s => s.company_name.includes('Perdana'));
      if (perdana) setSelectedShipment(perdana);
    } else if (corridor === 'south') {
      setMapCenter({ lat: 2.3, lng: 102.6 });
      setMapZoom(8);
      const kkkl = shipments.find(s => s.company_name.includes('KKKL'));
      if (kkkl) setSelectedShipment(kkkl);
    } else if (corridor === 'north') {
      setMapCenter({ lat: 5.0, lng: 100.8 });
      setMapZoom(8);
      const trans = shipments.find(s => s.company_name.includes('Transnasional'));
      if (trans) setSelectedShipment(trans);
    }
  };

  // Jump bus forward by +10km
  const handleJumpForward = () => {
    const updated = supabaseShipments.simulateBusMovement();
    setShipments([...updated]);
    if (selectedShipment) {
      const found = updated.find(s => s.id === selectedShipment.id);
      if (found) setSelectedShipment({ ...found });
    }
    setActionNotice(`Simulasi GPS: Kedudukan bas dikemaskini +10km sepanjang lebuhraya.`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  // Select Agent helper
  const handleSelectAgent = (agentId: string) => {
    const ag = REGISTERED_AGENTS.find(a => a.id === agentId);
    if (!ag) return;
    setAgentName(ag.name);
    setAgentPhone(ag.phone);
    setAgentHub(ag.hub);
    setDestinationTerminal(ag.terminalDestination);
    setDestinationAddress(ag.pickupAddress);
  };

  // Select Schedule from redBus
  const handleSelectScheduleForDispatch = (sch: BusSchedule) => {
    setCompanyName(sch.operator);
    setOriginTerminal(sch.originTerminal);
    setDestinationTerminal(sch.destinationTerminal);
    setDepartureTime(sch.departureTime);
    setEstimatedArrivalTime(sch.arrivalTime);
    setCargoFeeMyr(sch.estimatedFreightRateMyr);
    
    const matchedAgent = REGISTERED_AGENTS.find(a => a.hub.toLowerCase().includes(sch.destinationCity.toLowerCase()));
    if (matchedAgent) {
      setAgentName(matchedAgent.name);
      setAgentPhone(matchedAgent.phone);
      setAgentHub(matchedAgent.hub);
      setDestinationAddress(matchedAgent.pickupAddress);
    }
    
    setShowAddModal(true);
  };

  // Create Consignment & Sync to Supabase
  const handleCreateConsignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverName || !busPlateNo || !agentName) {
      alert('Sila lengkapkan maklumat No Plat Bas, Driver dan Ejen!');
      return;
    }

    const created = busFreightManager.addConsignment({
      companyName,
      busPlateNo: busPlateNo.toUpperCase().trim(),
      driverName,
      driverPhone,
      driverQrRef: `DNG-QR-${companyName.toUpperCase().replace(/\s+/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`,
      cargoFeeMyr: Number(cargoFeeMyr),
      paymentStatus: 'PAID_DUITNOW',
      paymentTimestamp: new Date().toLocaleString('ms-MY', { hour12: true }),
      originTerminal,
      destinationTerminal,
      departureTime,
      estimatedArrivalTime,
      agentName,
      agentPhone,
      agentHub,
      destinationAddress,
      packageDescription,
      boxCount: Number(boxCount),
      bottleCount: Number(bottleCount),
      status: 'TBS_HANDOVER',
      driverContactedAgentOneHourBefore: false,
      agentDirectCallAllowed: true,
      notes
    });

    // Sync to Supabase `shipments` table
    const syncedShipment = await supabaseShipments.syncConsignmentToSupabase(created);
    setSelectedShipment(syncedShipment);

    setShowAddModal(false);
    setActiveTab('live_map');
    setActionNotice(`Konsinan ${created.id} (${created.companyName} - ${created.busPlateNo}) disegerakkan terus ke jadual 'shipments' Supabase!`);
    setTimeout(() => setActionNotice(null), 5000);
    if (onAction) onAction(`Konsinan bas ${created.id} didaftarkan & dipetakan di Google Maps.`);
  };

  const handleTrigger1HourNotice = (c: BusConsignment) => {
    busFreightManager.triggerOneHourNotice(c.id);
    setActionNotice(`SOP 1 Jam diaktifkan: Driver ${c.driverName} telah hubungi Ejen ${c.agentName}.`);
    setTimeout(() => setActionNotice(null), 5000);
  };

  const handleCopyNotice = (c: BusConsignment, type: 'agent' | 'driver') => {
    const text = type === 'agent' 
      ? busFreightManager.generateAgentWhatsAppMessage(c)
      : busFreightManager.generateAgentToDriverMessage(c);
    
    navigator.clipboard.writeText(text);
    setCopiedNoticeId(`${c.id}-${type}`);
    setTimeout(() => setCopiedNoticeId(null), 2500);
  };

  // Toast actions
  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleFocusToastShipment = (t: CoordinateToast) => {
    const found = shipments.find(s => s.id === t.shipmentId || s.bus_plate_no === t.busPlateNo);
    if (found) {
      setSelectedShipment(found);
      setMapCenter(found.current_coord);
      setMapZoom(9);
      setActiveTab('live_map');
    }
  };

  // Filtered schedules
  const filteredSchedules = busFreightManager.searchSchedules(selectedOrigin, selectedDest);

  // Filtered consignments
  const filteredConsignments = consignments.filter(c => {
    const q = searchQuery.toLowerCase();
    return (
      c.busPlateNo.toLowerCase().includes(q) ||
      c.companyName.toLowerCase().includes(q) ||
      c.driverName.toLowerCase().includes(q) ||
      c.agentName.toLowerCase().includes(q) ||
      c.agentHub.toLowerCase().includes(q) ||
      c.destinationTerminal.toLowerCase().includes(q)
    );
  });

  // Filtered shipments for map
  const filteredMapShipments = useMemo(() => {
    if (activeCorridorFilter === 'east_coast') {
      return shipments.filter(s => s.destination_terminal.includes('Terengganu'));
    }
    if (activeCorridorFilter === 'central') {
      return shipments.filter(s => s.destination_terminal.includes('Kota Bharu'));
    }
    if (activeCorridorFilter === 'south') {
      return shipments.filter(s => s.origin_terminal.includes('Larkin') || s.destination_terminal.includes('Larkin'));
    }
    if (activeCorridorFilter === 'north') {
      return shipments.filter(s => s.destination_terminal.includes('Penang'));
    }
    return shipments;
  }, [shipments, activeCorridorFilter]);

  const activeInTransit = consignments.filter(c => c.status === 'IN_TRANSIT' || c.status === 'TBS_HANDOVER').length;
  const oneHourAlertCount = consignments.filter(c => c.status === 'ONE_HOUR_ALERT').length;

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--ui-bg)] overflow-y-auto relative">

      {/* ============================================================ */}
      {/* 🔔 FRAMER-MOTION TOAST NOTIFICATION CONTAINER (SUPABASE GPS)  */}
      {/* ============================================================ */}
      <div className="fixed top-20 right-4 sm:right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 80, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.9 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className={cn(
                "pointer-events-auto p-4 rounded-2xl shadow-xl border backdrop-blur-md transition-all text-xs space-y-2.5",
                toast.isOneHourAlert 
                  ? "bg-amber-950/92 text-white border-amber-500/40 shadow-amber-500/10" 
                  : "bg-[var(--ui-soft)] text-[var(--ui-text)] border-[var(--ui-border)]"
              )}
            >
              {/* Toast Badge & Close */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {toast.isOneHourAlert ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500 text-[var(--ui-text)] font-extrabold text-[10px] tracking-wide animate-pulse">
                      <Radio size={11} />
                      SOP 1 JAM ALERT
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-[var(--ui-success-text)] font-bold text-[10px] border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      Supabase GPS Update
                    </span>
                  )}
                  <span className="text-[10px] text-[var(--ui-muted)] font-mono">{toast.timestamp}</span>
                </div>

                <button 
                  onClick={() => dismissToast(toast.id)}
                  className="text-[var(--ui-muted)] hover:text-[var(--ui-text)] p-1 rounded-md"
                >
                  <X size={13} />
                </button>
              </div>

              {/* Toast Content */}
              <div>
                <div className="flex items-center gap-1.5 font-bold text-[var(--ui-muted)]">
                  <span>{toast.companyName}</span>
                  <span className="px-1.5 py-0.2 rounded bg-[var(--ui-soft)] font-mono text-[11px] text-[var(--ui-warning-text)]">
                    {toast.busPlateNo}
                  </span>
                  <span className="text-[var(--ui-muted)] font-normal">→ {toast.agentName}</span>
                </div>
                <p className="text-[11px] text-[var(--ui-muted)] mt-1 line-clamp-1 italic">
                  {toast.milestone}
                </p>
                <div className="flex items-center justify-between text-[10px] text-[var(--ui-muted)] mt-1 font-mono">
                  <span>{toast.lat.toFixed(4)}°N, {toast.lng.toFixed(4)}°E</span>
                  <span className="text-[var(--ui-success-text)] font-bold">ETA: {toast.calculatedEta}</span>
                </div>
              </div>

              {/* Toast Quick Action Buttons */}
              <div className="pt-1.5 border-t border-[var(--ui-border)] flex items-center justify-between gap-2">
                <button
                  onClick={() => handleFocusToastShipment(toast)}
                  className="px-2.5 py-1 rounded-lg bg-[var(--ui-soft)] [@media(hover:hover)_and_(pointer:fine)]:hover:brightness-95 text-[var(--ui-text)] font-semibold text-[11px] flex items-center gap-1 transition-all"
                >
                  <MapPin size={11} className="text-[var(--ui-danger-text)]" />
                  <span>Lihat di Peta</span>
                </button>

                <a
                  href={formatWhatsAppUrl(toast.agentPhone, `Salam ${toast.agentName}, update GPS bas ${toast.companyName} (${toast.busPlateNo}): ${toast.milestone}. Anggaran sampai ${toast.calculatedEta} (${toast.speedKmh} km/j).`)}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 transition-all"
                >
                  <MessageSquare size={11} />
                  <span>WhatsApp Ejen</span>
                </a>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Top Header */}
      <div className="p-6 pb-4 border-b border-[var(--ui-border)] bg-[var(--ui-surface)] sticky top-0 z-20 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-[var(--ui-accent)] text-[var(--ui-accent-ink)] shadow-xs">
                <Truck size={18} />
              </span>
              <h1 className="text-xl font-bold tracking-tight text-[var(--ui-text)]">
                Logistik Bas Ekspres & Radar Penjejakan Ejen (Google Maps)
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                <Radio size={12} className="animate-pulse" />
                Live GPS & Supabase Telemetry
              </span>
            </div>
            <p className="text-xs text-[var(--ui-muted)] mt-1">
              Visualisasi masa nyata koordinat kargo dari jadual Supabase <code className="font-mono text-[var(--ui-text)] bg-[var(--ui-soft)] px-1 py-0.5 rounded">shipments</code>, pengiraan trafik Google Maps, serahan TBS, & SOP panggilan 1 jam sebelum tiba.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--ui-primary)] text-[var(--ui-primary-ink)] text-xs font-semibold hover:bg-[var(--ui-primary)] transition-all shadow-sm"
            >
              <Plus size={15} />
              <span>Daftar Serahan Bas (TBS)</span>
            </button>

            <button
              onClick={handleRecalculateTraffic}
              disabled={isRecalculatingTraffic}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-[var(--ui-soft)] text-[var(--ui-accent-text)] hover:bg-[var(--ui-soft)] text-xs font-semibold border border-[var(--ui-border)] transition-all"
              title="Kira semula anggaran ETA berdasarkan keadaan trafik Google Maps semasa"
            >
              <Activity size={13} className={cn(isRecalculatingTraffic && "animate-spin")} />
              <span>Kira Trafik Maps</span>
            </button>

            <button
              onClick={loadSupabaseShipments}
              disabled={isRefreshingSupabase}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold border border-emerald-200 transition-all"
              title="Segerak dengan pangkalan data Supabase"
            >
              <RefreshCw size={13} className={cn(isRefreshingSupabase && "animate-spin")} />
              <span>Supabase {supabaseSyncStatus.latencyMs}ms</span>
            </button>

            <a
              href="https://www.redbus.my/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 text-xs font-semibold border border-red-200 transition-all"
            >
              <span>redBus.my</span>
              <ExternalLink size={13} />
            </a>
          </div>
        </div>

        {/* Action alert toast */}
        {actionNotice && (
          <motion.div 
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span className="font-medium">{actionNotice}</span>
            </div>
            <button onClick={() => setActionNotice(null)} className="text-emerald-600 font-bold hover:underline">Tutup</button>
          </motion.div>
        )}

        {/* Quick KPI stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="p-3 rounded-xl bg-[var(--ui-soft)] border border-[var(--ui-border)]">
            <p className="text-[11px] font-semibold text-[var(--ui-muted)] uppercase tracking-wider">Pangkalan Data Supabase</p>
            <p className="text-lg font-bold text-[var(--ui-text)] mt-0.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {shipments.length} Bas Ber-GPS
            </p>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/60">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">Zon 1 Jam Sebelum Tiba</p>
              {oneHourAlertCount > 0 && <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />}
            </div>
            <p className="text-lg font-bold text-amber-900 mt-0.5">{oneHourAlertCount} Bas Menghampiri Hub</p>
          </div>

          <div className="p-3 rounded-xl bg-[var(--ui-soft)] border border-[var(--ui-border)]">
            <p className="text-[11px] font-semibold text-[var(--ui-accent-text)] uppercase tracking-wider">Aliran Trafik Google Maps</p>
            <p className="text-lg font-bold text-[var(--ui-accent-text)] mt-0.5">85% Lancar</p>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/60">
            <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">DuitNow QR Pemandu</p>
            <p className="text-lg font-bold text-emerald-900 mt-0.5">100% Pindahan Selesai</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 mt-4 pt-2 border-t border-[var(--ui-border)] overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('live_map')}
            className={cn(
              "px-3.5 py-1.5 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5",
              activeTab === 'live_map' 
                ? "bg-[var(--ui-accent)] text-[var(--ui-accent-ink)] shadow-xs" 
                : "text-[var(--ui-muted)] [@media(hover:hover)_and_(pointer:fine)]:hover:brightness-95"
            )}
          >
            <Navigation size={14} className={activeTab === 'live_map' ? "animate-pulse" : ""} />
            <span>Peta Satelit & GPS Bas Masa Nyata</span>
          </button>

          <button
            onClick={() => setActiveTab('traffic_summary')}
            className={cn(
              "px-3.5 py-1.5 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5",
              activeTab === 'traffic_summary' 
                ? "bg-[var(--ui-primary)] text-[var(--ui-primary-ink)] shadow-xs" 
                : "text-[var(--ui-muted)] [@media(hover:hover)_and_(pointer:fine)]:hover:brightness-95"
            )}
          >
            <Activity size={14} />
            <span>Ringkasan ETA & Trafik Google Maps</span>
          </button>

          <button
            onClick={() => setActiveTab('consignments')}
            className={cn(
              "px-3.5 py-1.5 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5",
              activeTab === 'consignments' 
                ? "bg-[var(--ui-primary)] text-[var(--ui-primary-ink)]" 
                : "text-[var(--ui-muted)] [@media(hover:hover)_and_(pointer:fine)]:hover:brightness-95"
            )}
          >
            <Truck size={14} />
            <span>Senarai Konsinan ({consignments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('schedules')}
            className={cn(
              "px-3.5 py-1.5 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5",
              activeTab === 'schedules' 
                ? "bg-[var(--ui-primary)] text-[var(--ui-primary-ink)]" 
                : "text-[var(--ui-muted)] [@media(hover:hover)_and_(pointer:fine)]:hover:brightness-95"
            )}
          >
            <Clock size={14} />
            <span>Jadual Bas Ekspres (redBus.my)</span>
          </button>

          <button
            onClick={() => setActiveTab('duitnow_qr')}
            className={cn(
              "px-3.5 py-1.5 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5",
              activeTab === 'duitnow_qr' 
                ? "bg-[var(--ui-primary)] text-[var(--ui-primary-ink)]" 
                : "text-[var(--ui-muted)] [@media(hover:hover)_and_(pointer:fine)]:hover:brightness-95"
            )}
          >
            <QrCode size={14} />
            <span>DuitNow QR Driver</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="p-4 md:p-6 max-w-7xl w-full mx-auto space-y-6">

        {/* TAB 1: INTERACTIVE GOOGLE MAPS GPS HIGHWAY TRACKER */}
        {activeTab === 'live_map' && (
          <div className="space-y-6">
            {/* Map Controls & Corridor Filters Bar */}
            <div className="p-4 rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
              {/* Corridor filter buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-bold text-[var(--ui-muted)] mr-1 flex items-center gap-1">
                  <Compass size={14} className="text-[var(--ui-danger-text)]" />
                  Koridor Lebuhraya:
                </span>
                <button
                  onClick={() => handleCorridorFocus('all')}
                  className={cn(
                    "px-2.5 py-1 rounded-lg font-medium transition-all",
                    activeCorridorFilter === 'all' ? "bg-[var(--ui-primary)] text-[var(--ui-primary-ink)]" : "bg-[var(--ui-soft)] [@media(hover:hover)_and_(pointer:fine)]:hover:brightness-95 text-[var(--ui-text)]"
                  )}
                >
                  Semua Bas ({shipments.length})
                </button>
                <button
                  onClick={() => handleCorridorFocus('east_coast')}
                  className={cn(
                    "px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1",
                    activeCorridorFilter === 'east_coast' ? "bg-[var(--ui-accent)] text-[var(--ui-accent-ink)]" : "bg-[var(--ui-soft)] [@media(hover:hover)_and_(pointer:fine)]:hover:brightness-95 text-[var(--ui-text)]"
                  )}
                >
                  <span>Pantai Timur (LPT2)</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                </button>
                <button
                  onClick={() => handleCorridorFocus('central')}
                  className={cn(
                    "px-2.5 py-1 rounded-lg font-medium transition-all",
                    activeCorridorFilter === 'central' ? "bg-[var(--ui-primary)] text-[var(--ui-primary-ink)]" : "bg-[var(--ui-soft)] [@media(hover:hover)_and_(pointer:fine)]:hover:brightness-95 text-[var(--ui-text)]"
                  )}
                >
                  Kelantan (CSR)
                </button>
                <button
                  onClick={() => handleCorridorFocus('south')}
                  className={cn(
                    "px-2.5 py-1 rounded-lg font-medium transition-all",
                    activeCorridorFilter === 'south' ? "bg-[var(--ui-primary)] text-[var(--ui-primary-ink)]" : "bg-[var(--ui-soft)] [@media(hover:hover)_and_(pointer:fine)]:hover:brightness-95 text-[var(--ui-text)]"
                  )}
                >
                  Selatan (PLUS JB)
                </button>
                <button
                  onClick={() => handleCorridorFocus('north')}
                  className={cn(
                    "px-2.5 py-1 rounded-lg font-medium transition-all",
                    activeCorridorFilter === 'north' ? "bg-[var(--ui-primary)] text-[var(--ui-primary-ink)]" : "bg-[var(--ui-soft)] [@media(hover:hover)_and_(pointer:fine)]:hover:brightness-95 text-[var(--ui-text)]"
                  )}
                >
                  Utara (PLUS Penang)
                </button>
              </div>

              {/* Simulation & Realtime Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsSimulatingGps(!isSimulatingGps)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-xs",
                    isSimulatingGps 
                      ? "bg-emerald-600 text-white hover:bg-emerald-700" 
                      : "bg-[var(--ui-soft)] text-[var(--ui-text)] [@media(hover:hover)_and_(pointer:fine)]:hover:brightness-95"
                  )}
                  title="Picu pergerakan koordinat GPS masa nyata"
                >
                  {isSimulatingGps ? <Pause size={13} /> : <Play size={13} />}
                  <span>{isSimulatingGps ? 'GPS Bergerak (Aktif)' : 'Mula Simulasi GPS'}</span>
                </button>

                <button
                  onClick={handleJumpForward}
                  className="px-2.5 py-1.5 rounded-xl bg-[var(--ui-soft)] [@media(hover:hover)_and_(pointer:fine)]:hover:brightness-95 text-[var(--ui-text)] font-semibold flex items-center gap-1 transition-all"
                  title="Lompat kedudukan bas ke hadapan"
                >
                  <FastForward size={13} />
                  <span>+10km</span>
                </button>
              </div>
            </div>

            {/* Interactive Map Canvas Container */}
            <div className="relative w-full h-[520px] rounded-3xl overflow-hidden border border-[var(--ui-border)] shadow-lg bg-[var(--ui-surface)]">
              <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
                <Map
                  center={mapCenter}
                  zoom={mapZoom}
                  mapId="DEMO_MAP_ID"
                  style={{ width: '100%', height: '100%' }}
                  gestureHandling="greedy"
                  disableDefaultUI={false}
                  internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
                >
                  {/* 1. Terminal Hub Markers */}
                  {Object.entries(TERMINAL_COORDINATES).map(([code, coord]) => (
                    <AdvancedMarker
                      key={`terminal-${code}`}
                      position={coord}
                      title={`Terminal Hub: ${code}`}
                    >
                      <div className="group relative flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-[var(--ui-soft)] border-2 border-[var(--ui-border)] shadow-md flex items-center justify-center text-[var(--ui-text)] text-[10px] font-black">
                          {code === 'TBS' ? 'TBS' : code === 'MBKT' ? 'KT' : code === 'LEMBAH_SIREH' ? 'KB' : code === 'LARKIN' ? 'JB' : 'HUB'}
                        </div>
                        <span className="mt-1 px-1.5 py-0.5 rounded bg-black/80 text-[var(--ui-text)] text-[9px] font-bold tracking-tight shadow-sm whitespace-nowrap">
                          {code === 'TBS' ? 'TBS KL (HQ)' : code}
                        </span>
                      </div>
                    </AdvancedMarker>
                  ))}

                  {/* 2. Active Bus GPS Markers */}
                  {filteredMapShipments.map((s) => {
                    const isSelected = selectedShipment?.id === s.id;
                    const isOneHour = s.status === 'ONE_HOUR_ALERT';

                    return (
                      <AdvancedMarker
                        key={s.id}
                        position={s.current_coord}
                        onClick={() => {
                          setSelectedShipment(s);
                          setMapCenter(s.current_coord);
                        }}
                      >
                        <div className="relative flex flex-col items-center cursor-pointer group transition-transform hover:scale-110">
                          {isOneHour && (
                            <span className="absolute -inset-3 rounded-full bg-amber-400/40 animate-ping pointer-events-none" />
                          )}

                          <div className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-mono font-bold shadow-md flex items-center gap-1 transition-all",
                            isSelected 
                              ? "bg-[var(--ui-accent)] text-[var(--ui-accent-ink)] ring-2 ring-[var(--ui-primary)] scale-105" 
                              : isOneHour 
                                ? "bg-amber-500 text-white ring-1 ring-amber-200" 
                                : "bg-[var(--ui-primary)] text-[var(--ui-primary-ink)]"
                          )}>
                            <span>{s.bus_plate_no}</span>
                            <span className="opacity-80">· {s.speed_kmh} km/j</span>
                          </div>

                          <div className={cn(
                            "w-9 h-9 rounded-2xl flex items-center justify-center shadow-lg border-2 border-[var(--ui-border)] my-1 transition-all",
                            isOneHour 
                              ? "bg-amber-500 text-white" 
                              : isSelected 
                                ? "bg-[var(--ui-accent)] text-[var(--ui-accent-ink)]" 
                                : "bg-emerald-600 text-white"
                          )}>
                            <Truck size={18} />
                          </div>

                          <span className="px-1.5 py-0.5 rounded bg-[var(--ui-soft)] text-[var(--ui-text)] text-[9px] font-bold shadow-xs whitespace-nowrap">
                            {s.company_name}
                          </span>
                        </div>
                      </AdvancedMarker>
                    );
                  })}

                  {/* InfoWindow for Clicked Bus */}
                  {selectedShipment && (
                    <InfoWindow
                      position={selectedShipment.current_coord}
                      onCloseClick={() => setSelectedShipment(null)}
                    >
                      <div className="p-2.5 max-w-[280px] bg-[var(--ui-surface)] text-[var(--ui-text)] font-sans space-y-2">
                        <div className="flex items-center justify-between pb-1.5 border-b border-[var(--ui-border)]">
                          <div className="flex items-center gap-1.5">
                            <Truck size={16} className="text-[var(--ui-danger-text)]" />
                            <span className="font-bold text-xs">{selectedShipment.company_name}</span>
                            <span className="px-1.5 py-0.5 rounded bg-[var(--ui-primary)] text-[var(--ui-primary-ink)] text-[10px] font-mono font-bold">
                              {selectedShipment.bus_plate_no}
                            </span>
                          </div>
                          <span className={cn(
                            "text-[10px] font-bold px-1.5 py-0.5 rounded",
                            selectedShipment.status === 'ONE_HOUR_ALERT' ? "bg-amber-100 text-amber-900 animate-pulse" : "bg-emerald-100 text-emerald-900"
                          )}>
                            {selectedShipment.status === 'ONE_HOUR_ALERT' ? 'ZON 1 JAM' : 'IN TRANSIT'}
                          </span>
                        </div>

                        <div className="text-xs space-y-1 text-[var(--ui-muted)]">
                          <p>
                            Driver: <strong className="text-[var(--ui-text)]">{selectedShipment.driver_name}</strong> ({selectedShipment.driver_phone})
                          </p>
                          <p>
                            Penerima: <strong className="text-[var(--ui-text)]">{selectedShipment.agent_name}</strong> ({selectedShipment.agent_hub})
                          </p>
                          <p className="text-[11px] text-[var(--ui-muted)]">
                            Lokasi: <span className="text-[var(--ui-text)] font-medium">{selectedShipment.last_milestone}</span>
                          </p>
                          <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--ui-text)] bg-[var(--ui-soft)] p-1.5 rounded">
                            <span>Kelajuan: {selectedShipment.speed_kmh} km/j</span>
                            <span>Baki: {selectedShipment.distance_remaining_km} km ({selectedShipment.eta_minutes}m)</span>
                          </div>
                        </div>

                        <div className="pt-1 flex flex-col gap-1.5">
                          <a
                            href={formatWhatsAppUrl(selectedShipment.agent_phone, `Salam ${selectedShipment.agent_name}, stok kuah colek anda kini di: ${selectedShipment.last_milestone}. Anggaran tiba ${selectedShipment.estimated_arrival_time} (${selectedShipment.distance_remaining_km} km lagi). Driver: ${selectedShipment.driver_name} (${selectedShipment.driver_phone}).`)}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 shadow-xs"
                          >
                            <MessageSquare size={13} />
                            <span>WhatsApp Status ke Ejen</span>
                          </a>

                          <a
                            href={formatWhatsAppUrl(selectedShipment.driver_phone, `Salam Abang ${selectedShipment.driver_name} (${selectedShipment.company_name} - ${selectedShipment.bus_plate_no}), saya Ejen ${selectedShipment.agent_name}. Nak semak anggaran sampai ke ${selectedShipment.destination_terminal}.`)}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full py-1.5 px-2 bg-[var(--ui-primary)] hover:bg-[var(--ui-primary)] text-[var(--ui-primary-ink)] rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1"
                          >
                            <Phone size={13} />
                            <span>Ejen Hubungi Driver Bas</span>
                          </a>
                        </div>
                      </div>
                    </InfoWindow>
                  )}
                </Map>
              </APIProvider>

              {/* Floating Live Telemetry HUD Overlay (Top-Right on Map) */}
              <div className="absolute top-4 right-4 z-10 hidden sm:flex flex-col items-end gap-2 pointer-events-none">
                <div className="pointer-events-auto bg-black/75 backdrop-blur-md text-[var(--ui-text)] p-3 rounded-2xl border border-[var(--ui-border)] shadow-xl space-y-1.5 text-xs max-w-xs">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] font-bold text-[var(--ui-muted)] uppercase tracking-wider flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Supabase Realtime GPS
                    </span>
                    <span className="font-mono text-[10px] text-[var(--ui-success-text)]">bktksvhcgszaoqkdyhil</span>
                  </div>
                  <p className="text-[11px] text-[var(--ui-muted)]">
                    Jadual <code className="text-[var(--ui-warning-text)]">shipments</code> dikemas kini secara langsung melalui saluran WebSockets Supabase.
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Cockpit Telemetry Bar (Interactive for Selected Bus) */}
            {selectedShipment && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "p-5 rounded-3xl bg-[var(--ui-surface)] border shadow-md space-y-4 transition-all",
                  selectedShipment.status === 'ONE_HOUR_ALERT' 
                    ? "border-amber-300 ring-2 ring-amber-400/20 bg-amber-50/15" 
                    : "border-[var(--ui-border)]"
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[var(--ui-border)] gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--ui-accent)] text-[var(--ui-accent-ink)] flex items-center justify-center font-bold text-lg shadow-sm">
                      <Truck size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-base text-[var(--ui-text)]">{selectedShipment.company_name}</span>
                        <span className="px-2.5 py-0.5 rounded-lg bg-[var(--ui-primary)] text-[var(--ui-primary-ink)] font-mono font-bold text-xs">
                          {selectedShipment.bus_plate_no}
                        </span>
                        <span className="text-xs text-[var(--ui-muted)]">ID: {selectedShipment.id}</span>
                      </div>
                      <p className="text-xs text-[var(--ui-muted)] mt-0.5">
                        Driver: <strong className="text-[var(--ui-text)]">{selectedShipment.driver_name}</strong> ({selectedShipment.driver_phone}) · Penerima: <strong className="text-[var(--ui-text)]">{selectedShipment.agent_name}</strong> ({selectedShipment.agent_hub})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedShipment.status === 'ONE_HOUR_ALERT' ? (
                      <span className="px-3.5 py-1.5 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs flex items-center gap-1.5 animate-pulse">
                        <Radio size={14} className="text-amber-700" />
                        <span>⚠️ ZON 1 JAM: Pemandu Hubungi Ejen {selectedShipment.agent_name}!</span>
                      </span>
                    ) : (
                      <span className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 font-bold text-xs flex items-center gap-1.5">
                        <CheckCircle2 size={14} className="text-emerald-600" />
                        <span>Dalam Perjalanan Ekspres</span>
                      </span>
                    )}

                    <span className="px-3 py-1.5 rounded-xl bg-[var(--ui-soft)] text-[var(--ui-text)] font-mono font-bold text-xs">
                      DuitNow RM{selectedShipment.cargo_fee.toFixed(0)} Selesai
                    </span>
                  </div>
                </div>

                {/* Telemetry Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-2xl bg-[var(--ui-soft)] border border-[var(--ui-border)]">
                    <p className="text-[10px] font-bold uppercase text-[var(--ui-muted)] flex items-center gap-1">
                      <Gauge size={12} className="text-[var(--ui-danger-text)]" />
                      Kelajuan Semasa
                    </p>
                    <p className="text-lg font-black text-[var(--ui-text)] mt-1">{selectedShipment.speed_kmh} <span className="text-xs font-semibold text-[var(--ui-muted)]">km/j</span></p>
                  </div>

                  <div className="p-3 rounded-2xl bg-[var(--ui-soft)] border border-[var(--ui-border)]">
                    <p className="text-[10px] font-bold uppercase text-[var(--ui-muted)] flex items-center gap-1">
                      <MapPin size={12} className="text-[var(--ui-accent-text)]" />
                      Baki Jarak ke Terminal
                    </p>
                    <p className="text-lg font-black text-[var(--ui-text)] mt-1">{selectedShipment.distance_remaining_km} <span className="text-xs font-semibold text-[var(--ui-muted)]">km</span></p>
                  </div>

                  <div className="p-3 rounded-2xl bg-[var(--ui-soft)] border border-[var(--ui-border)]">
                    <p className="text-[10px] font-bold uppercase text-[var(--ui-muted)] flex items-center gap-1">
                      <Clock size={12} className="text-[var(--ui-success-text)]" />
                      Anggaran Tiba (Google Maps)
                    </p>
                    <p className="text-lg font-black text-[var(--ui-success-text)] mt-1">~{selectedShipment.eta_minutes}m <span className="text-xs font-semibold text-[var(--ui-muted)]">({selectedShipment.estimated_arrival_time})</span></p>
                  </div>

                  <div className="p-3 rounded-2xl bg-[var(--ui-soft)] border border-[var(--ui-border)]">
                    <p className="text-[10px] font-bold uppercase text-[var(--ui-muted)]">Kemajuan Perjalanan</p>
                    <p className="text-lg font-black text-[var(--ui-text)] mt-1">{selectedShipment.progress_pct}%</p>
                  </div>
                </div>

                {/* Progress bar across highway */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--ui-muted)]">
                    <span className="flex items-center gap-1">
                      <MapPin size={12} className="text-red-500" />
                      {selectedShipment.origin_terminal}
                    </span>
                    <span className="text-[var(--ui-text)] font-bold italic">{selectedShipment.last_milestone}</span>
                    <span className="flex items-center gap-1 text-emerald-700">
                      <MapPin size={12} className="text-emerald-600" />
                      {selectedShipment.destination_terminal}
                    </span>
                  </div>

                  <div className="w-full h-2.5 bg-[var(--ui-soft)] rounded-full overflow-hidden border border-[var(--ui-border)]">
                    <div 
                      className={cn(
                        "h-full transition-all duration-500 rounded-full",
                        selectedShipment.status === 'ONE_HOUR_ALERT' ? "bg-amber-500" : "bg-[var(--ui-accent)]"
                      )} 
                      style={{ width: `${selectedShipment.progress_pct}%` }} 
                    />
                  </div>
                </div>

                {/* Actions Toolbar */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-1.5 text-[var(--ui-muted)]">
                    <ShieldCheck size={15} className="text-emerald-600" />
                    <span><strong>Hak Ejen Sah:</strong> Ejen boleh hubungi pemandu bas secara terus pada bila-bila masa.</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={formatWhatsAppUrl(selectedShipment.agent_phone, `Salam ${selectedShipment.agent_name}, stok kuah colek anda kini di: ${selectedShipment.last_milestone}. Anggaran tiba ${selectedShipment.estimated_arrival_time} (${selectedShipment.distance_remaining_km} km lagi). Driver: ${selectedShipment.driver_name} (${selectedShipment.driver_phone}). Terima kasih!`)}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <MessageSquare size={14} />
                      <span>WhatsApp Status ke Ejen</span>
                    </a>

                    <a
                      href={formatWhatsAppUrl(selectedShipment.driver_phone, `Salam Abang ${selectedShipment.driver_name} (${selectedShipment.company_name} - ${selectedShipment.bus_plate_no}), saya Ejen ${selectedShipment.agent_name} di ${selectedShipment.agent_hub}. Nak semak anggaran kedudukan bas sekarang supaya saya boleh bersiap ke platform. Terima kasih abang!`)}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 rounded-xl bg-[var(--ui-primary)] text-[var(--ui-primary-ink)] font-bold hover:bg-[var(--ui-primary)] flex items-center gap-1.5 transition-all"
                    >
                      <Phone size={14} />
                      <span>Ejen Hubungi Driver Bas</span>
                    </a>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Embedded Quick View of Traffic ETA Summary Panel */}
            <div className="pt-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Activity size={18} className="text-[var(--ui-accent-text)]" />
                  <h3 className="font-bold text-sm text-[var(--ui-text)]">Ringkasan Anggaran Tiba (ETA) & Data Trafik Google Maps</h3>
                </div>
                <button
                  onClick={handleRecalculateTraffic}
                  disabled={isRecalculatingTraffic}
                  className="text-xs font-semibold text-[var(--ui-accent-text)] hover:text-[var(--ui-accent-text)] flex items-center gap-1"
                >
                  <RefreshCw size={12} className={cn(isRecalculatingTraffic && "animate-spin")} />
                  <span>Kira Semula Trafik</span>
                </button>
              </div>

              {/* Grid of Active Bus Traffic Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {shipments.map((s) => {
                  const traffic = s.traffic || supabaseShipments.calculateGoogleMapsTrafficEta(s);
                  const isOneHour = s.status === 'ONE_HOUR_ALERT';

                  return (
                    <div 
                      key={`summary-card-${s.id}`}
                      className={cn(
                        "p-4 rounded-2xl bg-[var(--ui-surface)] border transition-all shadow-xs space-y-3",
                        isOneHour ? "border-amber-300 bg-amber-50/15" : "border-[var(--ui-border)]"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-[var(--ui-text)]">{s.company_name}</span>
                          <span className="px-2 py-0.5 rounded bg-[var(--ui-primary)] text-[var(--ui-primary-ink)] font-mono font-bold text-[10px]">
                            {s.bus_plate_no}
                          </span>
                        </div>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full font-bold text-[10px]",
                          traffic.condition === 'LANCAR' 
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200" 
                            : traffic.condition === 'SEDERHANA'
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : "bg-red-50 text-red-800 border border-red-200"
                        )}>
                          Trafik {traffic.condition} (+{traffic.delayMinutes}m)
                        </span>
                      </div>

                      <div className="text-xs space-y-1">
                        <div className="flex items-center justify-between text-[var(--ui-muted)]">
                          <span>Destinasi Ejen:</span>
                          <strong className="text-[var(--ui-text)]">{s.agent_name} ({s.agent_hub})</strong>
                        </div>
                        <div className="flex items-center justify-between text-[var(--ui-muted)]">
                          <span>Anggaran Tiba (ETA):</span>
                          <strong className="text-emerald-700 text-sm">{traffic.calculatedEtaTime}</strong>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-[var(--ui-muted)]">
                          <span>Baki Jarak & Kelajuan:</span>
                          <span>{s.distance_remaining_km} km · {s.speed_kmh} km/j</span>
                        </div>
                        <p className="text-[11px] text-[var(--ui-muted)] italic bg-[var(--ui-soft)] p-2 rounded-xl mt-1">
                          {traffic.agentRecommendedAction}
                        </p>
                      </div>

                      <div className="pt-1 flex items-center justify-between gap-2 border-t border-[var(--ui-border)] text-xs">
                        <button
                          onClick={() => {
                            setSelectedShipment(s);
                            setMapCenter(s.current_coord);
                            setMapZoom(9);
                          }}
                          className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1"
                        >
                          <MapPin size={12} />
                          <span>Fokus di Peta</span>
                        </button>

                        <a
                          href={formatWhatsAppUrl(s.agent_phone, `Salam ${s.agent_name}, update trafik bas ${s.company_name} (${s.bus_plate_no}): Status trafik lebuhraya ${traffic.condition}. Anggaran tiba ${traffic.calculatedEtaTime} (${s.distance_remaining_km} km lagi).`)}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs"
                        >
                          <MessageSquare size={11} />
                          <span>WhatsApp Ejen</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DEDICATED TRAFFIC & ETA SUMMARY PANEL */}
        {activeTab === 'traffic_summary' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-[var(--ui-surface)] border border-[var(--ui-border)] shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--ui-border)]">
                <div>
                  <div className="flex items-center gap-2">
                    <Activity size={20} className="text-[var(--ui-accent-text)]" />
                    <h2 className="text-lg font-bold text-[var(--ui-text)]">Panel Ringkasan ETA & Trafik Lebuhraya (Google Maps)</h2>
                  </div>
                  <p className="text-xs text-[var(--ui-muted)] mt-1">
                    Pengiraan automatik waktu jangkaan tiba berdasarkan koordinat GPS Supabase, faktor kelajuan bas, dan keadaan kesesakan lebuh raya semenanjung.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRecalculateTraffic}
                    disabled={isRecalculatingTraffic}
                    className="px-4 py-2 rounded-xl bg-[var(--ui-primary)] text-[var(--ui-primary-ink)] hover:brightness-95 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <RefreshCw size={13} className={cn(isRecalculatingTraffic && "animate-spin")} />
                    <span>Kira Semula Trafik Google Maps</span>
                  </button>
                </div>
              </div>

              {/* KPI Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-[var(--ui-soft)] border border-[var(--ui-border)]">
                  <p className="text-[10px] font-bold text-[var(--ui-accent-text)] uppercase">Indeks Aliran Trafik</p>
                  <p className="text-base font-black text-[var(--ui-accent-text)] mt-1">85% Lancar</p>
                  <p className="text-[10px] text-[var(--ui-accent-text)] mt-0.5">LPT2, PLUS, CSR</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/60">
                  <p className="text-[10px] font-bold text-emerald-800 uppercase">Purata Kelajuan Bas</p>
                  <p className="text-base font-black text-emerald-950 mt-1">85.4 km/j</p>
                  <p className="text-[10px] text-emerald-700 mt-0.5">Kelajuan lebuh raya</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/60">
                  <p className="text-[10px] font-bold text-amber-800 uppercase">Ketibaan Terdekat</p>
                  <p className="text-base font-black text-amber-950 mt-1">~26 minit lagi</p>
                  <p className="text-[10px] text-amber-700 mt-0.5">Sani Express VDF 8821</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[var(--ui-soft)] border border-[var(--ui-border)]">
                  <p className="text-[10px] font-bold text-[var(--ui-muted)] uppercase">Zon Notis 1 Jam</p>
                  <p className="text-base font-black text-[var(--ui-text)] mt-1">{oneHourAlertCount} Bas Aktif</p>
                  <p className="text-[10px] text-[var(--ui-muted)] mt-0.5">Pemandu hubungi ejen</p>
                </div>
              </div>

              {/* Detailed Shipment Traffic Table */}
              <div className="overflow-x-auto pt-2">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[var(--ui-border)] text-[var(--ui-muted)] uppercase text-[10px] font-bold">
                      <th className="pb-3 pr-4">Syarikat & Bas</th>
                      <th className="pb-3 px-4">Ejen & Hub Destinasi</th>
                      <th className="pb-3 px-4">Batu Tanda & GPS</th>
                      <th className="pb-3 px-4">Trafik Google Maps</th>
                      <th className="pb-3 px-4">Anggaran Tiba (ETA)</th>
                      <th className="pb-3 px-4">Status Zon 1 Jam</th>
                      <th className="pb-3 pl-4 text-right">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--ui-border)]">
                    {shipments.map((s) => {
                      const traffic = s.traffic || supabaseShipments.calculateGoogleMapsTrafficEta(s);
                      const isOneHour = s.status === 'ONE_HOUR_ALERT';

                      return (
                        <tr key={`traffic-row-${s.id}`} className="[@media(hover:hover)_and_(pointer:fine)]:hover:brightness-95 transition-colors">
                          <td className="py-3.5 pr-4">
                            <div className="font-bold text-[var(--ui-text)]">{s.company_name}</div>
                            <div className="font-mono text-[10px] text-[var(--ui-muted)] flex items-center gap-1 mt-0.5">
                              <span className="px-1.5 py-0.2 rounded bg-[var(--ui-primary)] text-[var(--ui-primary-ink)]">{s.bus_plate_no}</span>
                              <span>· {s.driver_name}</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-bold text-[var(--ui-text)]">{s.agent_name}</div>
                            <div className="text-[11px] text-[var(--ui-muted)]">{s.agent_hub} · {s.destination_terminal}</div>
                          </td>

                          <td className="py-3.5 px-4 max-w-xs">
                            <div className="font-medium text-[var(--ui-text)] line-clamp-1">{s.last_milestone}</div>
                            <div className="text-[10px] text-[var(--ui-muted)] font-mono mt-0.5">
                              {s.current_coord.lat.toFixed(4)}°N, {s.current_coord.lng.toFixed(4)}°E
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className={cn(
                              "px-2 py-0.5 rounded-full font-bold text-[10px] inline-flex items-center gap-1",
                              traffic.condition === 'LANCAR' 
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200" 
                                : traffic.condition === 'SEDERHANA'
                                  ? "bg-amber-50 text-amber-800 border border-amber-200"
                                  : "bg-red-50 text-red-800 border border-red-200"
                            )}>
                              {traffic.condition} (+{traffic.delayMinutes}m)
                            </span>
                            <div className="text-[10px] text-[var(--ui-muted)] mt-1 line-clamp-1">{traffic.description}</div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="text-sm font-black text-[var(--ui-success-text)]">{traffic.calculatedEtaTime}</div>
                            <div className="text-[10px] text-[var(--ui-muted)]">{s.distance_remaining_km} km lagi ({s.speed_kmh} km/j)</div>
                          </td>

                          <td className="py-3.5 px-4">
                            {isOneHour ? (
                              <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px] inline-flex items-center gap-1 animate-pulse">
                                <Radio size={10} className="text-amber-700" />
                                <span>ZON 1 JAM</span>
                              </span>
                            ) : traffic.oneHourZoneStatus === 'MENGHAMPIRI' ? (
                              <span className="text-[11px] text-[var(--ui-warning-text)] font-semibold">
                                ~{traffic.timeUntilOneHourZoneMinutes}m lagi masuk zon
                              </span>
                            ) : (
                              <span className="text-[11px] text-[var(--ui-muted)]">Lebuh raya ({s.distance_remaining_km} km)</span>
                            )}
                          </td>

                          <td className="py-3.5 pl-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setSelectedShipment(s);
                                  setMapCenter(s.current_coord);
                                  setMapZoom(9);
                                  setActiveTab('live_map');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-[var(--ui-soft)] [@media(hover:hover)_and_(pointer:fine)]:hover:brightness-95 text-[var(--ui-text)] font-medium text-[11px]"
                              >
                                Peta
                              </button>

                              <a
                                href={formatWhatsAppUrl(s.agent_phone, `Salam ${s.agent_name}, kemaskini trafik Google Maps bas ${s.company_name} (${s.bus_plate_no}): Anggaran tiba ${traffic.calculatedEtaTime} (${traffic.condition}). Baki ${s.distance_remaining_km} km. Sila bersedia.`)}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs"
                              >
                                <MessageSquare size={11} />
                                <span>WhatsApp</span>
                              </a>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ACTIVE CONSIGNMENTS LIST */}
        {activeTab === 'consignments' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ui-muted)]" />
                <input
                  type="text"
                  placeholder="Cari plat bas, driver, ejen, atau hub..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-[var(--ui-surface)] border border-[var(--ui-border)] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[var(--ui-accent)]"
                />
              </div>

              <div className="text-xs text-[var(--ui-muted)] flex items-center gap-1.5">
                <AlertCircle size={14} className="text-[var(--ui-warning-text)]" />
                <span>Ejen berhak menghubungi driver bas sebaik sahaja notis dihantar.</span>
              </div>
            </div>

            {filteredConsignments.length === 0 ? (
              <div className="p-12 text-center bg-[var(--ui-surface)] rounded-2xl border border-[var(--ui-border)]">
                <Truck size={36} className="mx-auto text-[var(--ui-muted)] mb-2" />
                <p className="text-sm font-semibold text-[var(--ui-text)]">Tiada konsinan bas ditemui</p>
                <p className="text-xs text-[var(--ui-muted)] mt-1">Daftarkan serahan bas baharu di terminal TBS atau cari jadual bas.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredConsignments.map((c) => {
                  const isOneHour = c.status === 'ONE_HOUR_ALERT';
                  const isCollected = c.status === 'COLLECTED';
                  const agentWhatsAppUrl = formatWhatsAppUrl(c.agentPhone, busFreightManager.generateAgentWhatsAppMessage(c));
                  const driverWhatsAppUrl = formatWhatsAppUrl(c.driverPhone, busFreightManager.generateDriverWhatsAppMessage(c));
                  const agentToDriverUrl = formatWhatsAppUrl(c.driverPhone, busFreightManager.generateAgentToDriverMessage(c));

                  return (
                    <div 
                      key={c.id}
                      className={cn(
                        "p-5 rounded-2xl bg-[var(--ui-surface)] border transition-all shadow-xs space-y-4",
                        isOneHour 
                          ? "border-amber-300 ring-2 ring-amber-400/20 bg-amber-50/20" 
                          : "border-[var(--ui-border)] hover:border-[var(--ui-border)]"
                      )}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[var(--ui-border)] gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[var(--ui-accent)] text-[var(--ui-accent-ink)] flex items-center justify-center font-bold text-sm border border-[var(--ui-border)]">
                            <Truck size={20} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-[var(--ui-text)]">{c.companyName}</span>
                              <span className="px-2 py-0.5 rounded-md bg-[var(--ui-primary)] text-[var(--ui-primary-ink)] font-mono font-bold text-[11px] tracking-wide">
                                {c.busPlateNo}
                              </span>
                              <span className="text-[11px] font-medium text-[var(--ui-muted)]">ID: {c.id}</span>
                            </div>
                            <p className="text-xs text-[var(--ui-muted)] mt-0.5">
                              Pemandu: <strong className="text-[var(--ui-text)]">{c.driverName}</strong> ({c.driverPhone})
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isOneHour ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                              <Radio size={13} className="text-amber-700" />
                              SOP 1 JAM: Driver Hubungi Ejen
                            </span>
                          ) : isCollected ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 size={13} className="text-emerald-600" />
                              Selesai Dituntut di Terminal
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[var(--ui-soft)] text-[var(--ui-accent-text)] border border-[var(--ui-border)]">
                              <Clock size={13} className="text-[var(--ui-accent-text)]" />
                              Dalam Perjalanan (In-Transit)
                            </span>
                          )}

                          <button
                            onClick={() => setSelectedConsignmentForQr(c)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-[11px] font-semibold flex items-center gap-1"
                          >
                            <QrCode size={13} />
                            <span>DuitNow RM{c.cargoFeeMyr.toFixed(0)}</span>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-[var(--ui-soft)] border border-[var(--ui-border)] text-xs">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-[var(--ui-muted)]">Terminal Asal (Serahan Stok)</p>
                          <p className="font-semibold text-[var(--ui-text)] mt-0.5 flex items-center gap-1">
                            <MapPin size={12} className="text-[var(--ui-danger-text)] shrink-0" />
                            <span className="truncate">{c.originTerminal}</span>
                          </p>
                          <p className="text-[11px] text-[var(--ui-muted)] mt-0.5">Berlepas: <strong className="text-[var(--ui-text)]">{c.departureTime}</strong></p>
                        </div>

                        <div>
                          <p className="text-[10px] uppercase font-bold text-[var(--ui-muted)]">Terminal Destinasi (Ambilan Ejen)</p>
                          <p className="font-semibold text-[var(--ui-text)] mt-0.5 flex items-center gap-1">
                            <MapPin size={12} className="text-[var(--ui-success-text)] shrink-0" />
                            <span className="truncate">{c.destinationTerminal}</span>
                          </p>
                          <p className="text-[11px] text-[var(--ui-muted)] mt-0.5">Anggaran Tiba (ETA): <strong className="text-[var(--ui-success-text)]">{c.estimatedArrivalTime}</strong></p>
                        </div>

                        <div>
                          <p className="text-[10px] uppercase font-bold text-[var(--ui-muted)]">Pakej Kargo Kuah Colek</p>
                          <p className="font-semibold text-[var(--ui-text)] mt-0.5 flex items-center gap-1">
                            <Package size={12} className="text-[var(--ui-warning-text)] shrink-0" />
                            <span>{c.boxCount} Kotak ({c.bottleCount} Botol)</span>
                          </p>
                          <p className="text-[10px] text-[var(--ui-muted)] truncate mt-0.5">{c.packageDescription}</p>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-[var(--ui-surface)] border border-[var(--ui-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <UserCheck size={14} className="text-[var(--ui-danger-text)]" />
                            <span className="font-bold text-[var(--ui-text)]">Ejen Penerima: {c.agentName}</span>
                            <span className="px-2 py-0.5 rounded-full bg-[var(--ui-soft)] text-[var(--ui-text)] text-[10px] font-bold">
                              Hub: {c.agentHub}
                            </span>
                          </div>
                          <p className="text-[var(--ui-muted)] text-[11px] mt-1">
                            Tel: <strong>{c.agentPhone}</strong> · Alamat: {c.destinationAddress}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          {!c.driverContactedAgentOneHourBefore ? (
                            <button
                              onClick={() => handleTrigger1HourNotice(c)}
                              className="px-3 py-1.5 rounded-xl bg-amber-500 text-white hover:bg-amber-600 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                            >
                              <Radio size={13} className="animate-pulse" />
                              <span>Picu SOP 1 Jam (Driver Call Ejen)</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => busFreightManager.updateStatus(c.id, 'COLLECTED', true, 'Stok selamat dituntut oleh ejen di terminal.')}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                            >
                              <CheckCircle2 size={13} />
                              <span>Sahkan Stok Telah Dituntut</span>
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[var(--ui-border)] flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-1.5 text-[var(--ui-muted)]">
                          <ShieldCheck size={14} className="text-emerald-600" />
                          <span className="font-semibold text-[var(--ui-text)]">Hak Ejen:</span>
                          <span>Boleh berhubung terus dengan driver bas bila-bila masa.</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <a
                            href={agentWhatsAppUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-semibold text-xs flex items-center gap-1.5 transition-all shadow-xs"
                          >
                            <MessageSquare size={13} />
                            <span>WhatsApp Info Bas ke Ejen</span>
                          </a>

                          <a
                            href={agentToDriverUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 rounded-xl bg-[var(--ui-primary)] text-[var(--ui-primary-ink)] hover:bg-[var(--ui-primary)] font-semibold text-xs flex items-center gap-1.5 transition-all"
                          >
                            <Phone size={13} />
                            <span>Ejen Hubungi Driver Bas</span>
                          </a>

                          <button
                            onClick={() => handleCopyNotice(c, 'agent')}
                            className="px-2.5 py-1.5 rounded-xl bg-[var(--ui-soft)] [@media(hover:hover)_and_(pointer:fine)]:hover:brightness-95 text-[var(--ui-text)] text-xs font-medium transition-all"
                          >
                            {copiedNoticeId === `${c.id}-agent` ? 'Disalin! ✓' : 'Salin Mesej'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: REDBUS REAL-TIME SCHEDULES */}
        {activeTab === 'schedules' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-3 flex-1">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[var(--ui-muted)] mb-1">Terminal Asal</label>
                  <select 
                    value={selectedOrigin} 
                    onChange={(e) => setSelectedOrigin(e.target.value)}
                    className="p-2 rounded-xl bg-[var(--ui-soft)] border border-[var(--ui-border)] text-xs font-semibold focus:outline-none"
                  >
                    <option value="all">Semua Terminal Asal</option>
                    <option value="Kuala Lumpur">TBS (Kuala Lumpur)</option>
                    <option value="Johor Bahru">Larkin Sentral (Johor Bahru)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-[var(--ui-muted)] mb-1">Terminal Destinasi</label>
                  <select 
                    value={selectedDest} 
                    onChange={(e) => setSelectedDest(e.target.value)}
                    className="p-2 rounded-xl bg-[var(--ui-soft)] border border-[var(--ui-border)] text-xs font-semibold focus:outline-none"
                  >
                    <option value="all">Semua Destinasi Ejen</option>
                    <option value="Kuala Terengganu">Kuala Terengganu (MBKT)</option>
                    <option value="Kota Bharu">Kota Bharu (Lembah Sireh)</option>
                    <option value="Penang">Penang Sentral (Butterworth)</option>
                    <option value="Kuantan">Kuantan (TSK)</option>
                    <option value="Ipoh">Ipoh (Amanjaya)</option>
                    <option value="Melaka">Melaka Sentral</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="https://www.redbus.my/"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 rounded-xl bg-[var(--ui-primary)] text-[var(--ui-primary-ink)] font-bold text-xs hover:brightness-95 flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <Radio size={13} />
                  <span>Semak redBus.my Langsung</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSchedules.map((sch) => (
                <div 
                  key={sch.id}
                  className="p-5 rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] shadow-xs hover:border-[var(--ui-border)] transition-all space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-[var(--ui-border)]">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[var(--ui-text)]">{sch.operator}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--ui-soft)] text-[var(--ui-text)]">
                          {sch.busType}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--ui-muted)] mt-0.5">Platform: {sch.platformNo || 'Akan diumumkan di TBS'}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                        Kadar Kargo ~RM{sch.estimatedFreightRateMyr}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 items-center py-2 text-center text-xs">
                    <div className="text-left">
                      <p className="text-base font-bold text-[var(--ui-text)]">{sch.departureTime}</p>
                      <p className="text-[11px] text-[var(--ui-muted)] truncate">{sch.originCity}</p>
                    </div>

                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-[var(--ui-muted)] font-medium">{sch.durationHours}</span>
                      <div className="w-full flex items-center my-1">
                        <div className="h-[1px] bg-[var(--ui-soft)] flex-1" />
                        <Truck size={14} className="text-[var(--ui-danger-text)] mx-1" />
                        <div className="h-[1px] bg-[var(--ui-soft)] flex-1" />
                      </div>
                      <span className="text-[10px] text-[var(--ui-success-text)] font-semibold">Kargo Friendly ✓</span>
                    </div>

                    <div className="text-right">
                      <p className="text-base font-bold text-[var(--ui-text)]">{sch.arrivalTime}</p>
                      <p className="text-[11px] text-[var(--ui-muted)] truncate">{sch.destinationCity}</p>
                    </div>
                  </div>

                  <div className="text-[11px] text-[var(--ui-muted)] bg-[var(--ui-soft)] p-2 rounded-xl flex items-center justify-between">
                    <span>Laluan: <strong>{sch.originTerminal}</strong> → <strong>{sch.destinationTerminal}</strong></span>
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-2 border-t border-[var(--ui-border)]">
                    <a
                      href={sch.redBusUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-[var(--ui-danger-text)] hover:text-[var(--ui-danger-text)] flex items-center gap-1"
                    >
                      <span>Lihat di redBus.my</span>
                      <ExternalLink size={12} />
                    </a>

                    <button
                      onClick={() => handleSelectScheduleForDispatch(sch)}
                      className="px-3.5 py-1.5 rounded-xl bg-[var(--ui-primary)] text-[var(--ui-primary-ink)] hover:bg-[var(--ui-primary)] text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                    >
                      <span>Pilih untuk Hantar Stok</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: DUITNOW QR DRIVER */}
        {activeTab === 'duitnow_qr' && (
          <div className="p-6 rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] shadow-xs max-w-xl mx-auto space-y-6">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-pink-50 text-pink-600 border border-pink-100 mx-auto flex items-center justify-center font-bold">
                <QrCode size={24} />
              </div>
              <h2 className="text-lg font-bold text-[var(--ui-text)]">Pemindahan Segera DuitNow QR Pemandu & Ejen</h2>
              <p className="text-xs text-[var(--ui-muted)]">
                Pihak ABANGCOLEK membuat bayaran upah kargo secara langsung melalui DuitNow National QR kepada Driver Bas atau Ejen.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#ED0278]/5 border-2 border-dashed border-[#ED0278]/30 text-center space-y-4">
              <div className="flex items-center justify-center gap-2">
                <span className="font-extrabold text-[#ED0278] tracking-wider text-sm">DuitNow</span>
                <span className="text-[10px] font-bold bg-[#ED0278] text-white px-2 py-0.5 rounded">NATIONAL QR</span>
              </div>

              <div className="w-48 h-48 bg-[var(--ui-surface)] p-3 rounded-2xl border border-[var(--ui-border)] mx-auto shadow-sm flex flex-col items-center justify-center">
                <div className="w-full h-full bg-[var(--ui-surface)] rounded-xl flex items-center justify-center text-[var(--ui-text)] p-4">
                  <div className="grid grid-cols-5 gap-1.5 w-full h-full">
                    {Array.from({ length: 25 }).map((_, i) => (
                      <div 
                        key={i} 
                        className={cn(
                          "rounded-xs",
                          (i % 2 === 0 || i % 3 === 0) ? "bg-[var(--ui-surface)]" : "bg-[var(--ui-surface)]"
                        )} 
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="text-xs space-y-1">
                <p className="font-bold text-[var(--ui-text)]">Penerima: Driver Bas / Ejen Terminal</p>
                <p className="text-[var(--ui-muted)] font-mono text-[11px]">ID QR: DNG-MALAYSIA-TBS-2026-HQ</p>
                <p className="text-[var(--ui-success-text)] font-bold">Status: Akaun Disahkan Bank Negara Malaysia (PayNet)</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[var(--ui-soft)] border border-[var(--ui-border)] text-xs space-y-2">
              <p className="font-bold text-[var(--ui-text)]">SOP Pembayaran Kargo Bas ABANGCOLEK:</p>
              <ul className="list-disc pl-4 space-y-1 text-[var(--ui-muted)] text-[11px]">
                <li>Upah kargo diserahkan terus semasa kotak dinaikkan ke ruangan kargo bas di TBS.</li>
                <li>Driver menerima slip pemindahan segera dan resit QR disimpan dalam sistem konsinan.</li>
                <li>Pemandu diwajibkan menghubungi ejen 1 jam sebelum bas sampai ke destinasi.</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: DAFTAR KONSINAN BAS BAHARU */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-[var(--ui-surface)] rounded-3xl shadow-2xl border border-[var(--ui-border)] overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-5 border-b border-[var(--ui-border)] flex items-center justify-between bg-[var(--ui-soft)]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[var(--ui-accent)] text-[var(--ui-accent-ink)] flex items-center justify-center">
                    <Truck size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[var(--ui-text)]">Daftar Serahan Stok Bas (TBS) ke Ejen</h3>
                    <p className="text-[11px] text-[var(--ui-muted)]">Kemas kini butiran bas, koordinat Supabase, bayaran DuitNow, & notifikasi ejen.</p>
                  </div>
                </div>

                <button 
                  onClick={() => setShowAddModal(false)}
                  className="w-7 h-7 rounded-full bg-[var(--ui-soft)] hover:bg-[var(--ui-primary)] text-[var(--ui-primary-ink)] flex items-center justify-center font-bold text-xs"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateConsignment} className="p-6 overflow-y-auto space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-[var(--ui-text)] mb-1">Pilih Ejen Penerima (Direktori Ejen)</label>
                  <select
                    onChange={(e) => handleSelectAgent(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[var(--ui-soft)] border border-[var(--ui-border)] font-semibold focus:ring-2 focus:ring-[var(--ui-accent)]"
                  >
                    <option value="">-- Pilih Ejen Semenanjung --</option>
                    {REGISTERED_AGENTS.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.hub} · {a.terminalDestination})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[var(--ui-text)] mb-1">Syarikat Bas Ekspres</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Cth: Sani Express / Adik Beradik"
                      className="w-full p-2.5 rounded-xl bg-[var(--ui-soft)] border border-[var(--ui-border)] font-semibold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[var(--ui-text)] mb-1">No Pendaftaran Bas (Plat Bas)</label>
                    <input
                      type="text"
                      value={busPlateNo}
                      onChange={(e) => setBusPlateNo(e.target.value)}
                      placeholder="Cth: VDF 8821 / DDA 5439"
                      className="w-full p-2.5 rounded-xl bg-[var(--ui-soft)] border border-[var(--ui-border)] font-semibold font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[var(--ui-text)] mb-1">Nama Pemandu Bas (Driver)</label>
                    <input
                      type="text"
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                      placeholder="Cth: Abang Zul (Driver Sani)"
                      className="w-full p-2.5 rounded-xl bg-[var(--ui-soft)] border border-[var(--ui-border)] font-semibold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[var(--ui-text)] mb-1">No Telefon Driver Bas</label>
                    <input
                      type="text"
                      value={driverPhone}
                      onChange={(e) => setDriverPhone(e.target.value)}
                      placeholder="Cth: 017-9824112"
                      className="w-full p-2.5 rounded-xl bg-[var(--ui-soft)] border border-[var(--ui-border)] font-semibold font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[var(--ui-text)] mb-1">Terminal Asal (Serahan)</label>
                    <input
                      type="text"
                      value={originTerminal}
                      onChange={(e) => setOriginTerminal(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-[var(--ui-soft)] border border-[var(--ui-border)] font-semibold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[var(--ui-text)] mb-1">Terminal Destinasi (Ambilan)</label>
                    <input
                      type="text"
                      value={destinationTerminal}
                      onChange={(e) => setDestinationTerminal(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-[var(--ui-soft)] border border-[var(--ui-border)] font-semibold"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-[var(--ui-text)] mb-1">Masa Berlepas</label>
                    <input
                      type="text"
                      value={departureTime}
                      onChange={(e) => setDepartureTime(e.target.value)}
                      placeholder="09:30 AM"
                      className="w-full p-2.5 rounded-xl bg-[var(--ui-soft)] border border-[var(--ui-border)] font-semibold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[var(--ui-text)] mb-1">Anggaran Tiba (ETA)</label>
                    <input
                      type="text"
                      value={estimatedArrivalTime}
                      onChange={(e) => setEstimatedArrivalTime(e.target.value)}
                      placeholder="03:45 PM"
                      className="w-full p-2.5 rounded-xl bg-[var(--ui-soft)] border border-[var(--ui-border)] font-semibold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[var(--ui-text)] mb-1">Upah Kargo (RM DuitNow)</label>
                    <input
                      type="number"
                      value={cargoFeeMyr}
                      onChange={(e) => setCargoFeeMyr(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl bg-[var(--ui-soft)] border border-[var(--ui-border)] font-semibold"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[var(--ui-text)] mb-1">Nama Ejen Penerima</label>
                    <input
                      type="text"
                      value={agentName}
                      onChange={(e) => setAgentName(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-[var(--ui-soft)] border border-[var(--ui-border)] font-semibold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[var(--ui-text)] mb-1">No Telefon Ejen</label>
                    <input
                      type="text"
                      value={agentPhone}
                      onChange={(e) => setAgentPhone(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-[var(--ui-soft)] border border-[var(--ui-border)] font-semibold font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[var(--ui-text)] mb-1">Bilangan Kotak</label>
                    <input
                      type="number"
                      value={boxCount}
                      onChange={(e) => setBoxCount(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl bg-[var(--ui-soft)] border border-[var(--ui-border)] font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[var(--ui-text)] mb-1">Jumlah Botol Kuah</label>
                    <input
                      type="number"
                      value={bottleCount}
                      onChange={(e) => setBottleCount(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl bg-[var(--ui-soft)] border border-[var(--ui-border)] font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[var(--ui-text)] mb-1">Penerangan Pakej Kargo</label>
                  <input
                    type="text"
                    value={packageDescription}
                    onChange={(e) => setPackageDescription(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[var(--ui-soft)] border border-[var(--ui-border)] font-semibold"
                  />
                </div>

                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] space-y-1">
                  <p className="font-bold">Perjanjian SOP:</p>
                  <p>1. Bayaran RM{cargoFeeMyr} dipindahkan ke DuitNow QR Driver Bas serta-merta.</p>
                  <p>2. Pemandu bas akan hubungi Ejen {agentName} 1 jam sebelum sampai ke terminal.</p>
                  <p>3. Pihak Ejen berhak berhubung terus dengan Driver {driverName} sebaik sahaja butiran ini disimpan.</p>
                </div>

                <div className="pt-3 border-t border-[var(--ui-border)] flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl bg-[var(--ui-soft)] [@media(hover:hover)_and_(pointer:fine)]:hover:brightness-95 text-[var(--ui-text)] font-semibold"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[var(--ui-primary)] hover:brightness-95 text-[var(--ui-primary-ink)] font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <CheckCircle2 size={15} />
                    <span>Daftar & Segerak ke Supabase + Google Maps</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: RESIT DUITNOW QR DRIVER */}
      <AnimatePresence>
        {selectedConsignmentForQr && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-[var(--ui-surface)] rounded-3xl shadow-2xl border border-[var(--ui-border)] overflow-hidden text-center p-6 space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[var(--ui-border)]">
                <span className="font-extrabold text-[#ED0278] tracking-wider text-xs">DuitNow QR RECEIPT</span>
                <button 
                  onClick={() => setSelectedConsignmentForQr(null)}
                  className="w-6 h-6 rounded-full bg-[var(--ui-soft)] [@media(hover:hover)_and_(pointer:fine)]:hover:brightness-95 text-[var(--ui-text)] text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center font-bold">
                <CheckCircle2 size={24} />
              </div>

              <div>
                <p className="text-xs text-[var(--ui-muted)]">Pemindahan Selesai</p>
                <p className="text-2xl font-black text-[var(--ui-text)]">RM {selectedConsignmentForQr.cargoFeeMyr.toFixed(2)}</p>
              </div>

              <div className="p-3 rounded-xl bg-[var(--ui-soft)] text-left text-xs space-y-1.5 border border-[var(--ui-border)]">
                <div className="flex justify-between text-[var(--ui-muted)]">
                  <span>Penerima:</span>
                  <span className="font-bold text-[var(--ui-text)]">{selectedConsignmentForQr.driverName}</span>
                </div>
                <div className="flex justify-between text-[var(--ui-muted)]">
                  <span>Syarikat & Plat:</span>
                  <span className="font-bold text-[var(--ui-text)]">{selectedConsignmentForQr.companyName} ({selectedConsignmentForQr.busPlateNo})</span>
                </div>
                <div className="flex justify-between text-[var(--ui-muted)]">
                  <span>Rujukan DuitNow:</span>
                  <span className="font-mono text-[10px] text-[var(--ui-text)]">{selectedConsignmentForQr.driverQrRef}</span>
                </div>
                <div className="flex justify-between text-[var(--ui-muted)]">
                  <span>Masa Bayaran:</span>
                  <span className="text-[11px] text-[var(--ui-text)]">{selectedConsignmentForQr.paymentTimestamp}</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedConsignmentForQr(null)}
                className="w-full py-2.5 rounded-xl bg-[var(--ui-primary)] text-[var(--ui-primary-ink)] font-bold text-xs hover:bg-[var(--ui-primary)]"
              >
                Tutup Resit
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
