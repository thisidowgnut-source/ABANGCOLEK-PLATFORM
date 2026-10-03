/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  Pin,
  InfoWindow 
} from '@vis.gl/react-google-maps';
import { 
  MapPin, 
  Truck, 
  Package, 
  Navigation, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  Building2, 
  Layers,
  ArrowUpRight,
  TrendingUp,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import realData from '../data.json';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// Abang Colek major distribution hubs & regional pop-up / agent centroids in Malaysia
const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'johor bahru': { lat: 1.4927, lng: 103.7414 }, // HQ & Toppen JB Pop-up
  'shah alam': { lat: 3.0738, lng: 101.5183 },   // Central Hub
  'kuala lumpur': { lat: 3.1390, lng: 101.6869 },// Klang Valley retail
  'bangi': { lat: 2.9289, lng: 101.7801 },       // Selangor Hub
  'kuala terengganu': { lat: 5.3117, lng: 103.1324 }, // Stokis Utama Pantai Timur
  'kota bharu': { lat: 6.1254, lng: 102.2386 },  // Kelantan
  'melaka': { lat: 2.1896, lng: 102.2501 },      // Melaka
  'penang': { lat: 5.4164, lng: 100.3327 },      // Northern Hub
  'ipoh': { lat: 4.5975, lng: 101.0901 },        // Perak
  'kuantan': { lat: 3.8077, lng: 103.3260 },     // Pahang
  'pasir gudang': { lat: 1.4723, lng: 103.9038 },// Johor
  'default': { lat: 1.4927, lng: 103.7414 }
};

interface MapsViewProps {
  onAction?: (msg?: string) => void;
}

export const MapsView: React.FC<MapsViewProps> = ({ onAction }) => {
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeOrder, setActiveOrder] = useState<any | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 3.6, lng: 102.2 });
  const [zoom, setZoom] = useState<number>(7);

  // Map orders from database with realistic geographic jitter around their cities
  const mappedOrders = useMemo(() => {
    return (realData.orders as any[]).slice(0, 80).map((order, idx) => {
      const cityKey = (order.city || 'default').toLowerCase().trim();
      const baseCoord = CITY_COORDINATES[cityKey] || CITY_COORDINATES['default'];
      // Pseudo-random deterministic offset so pins don't overlap completely
      const seed = idx * 17;
      const offsetLat = ((seed % 100) - 50) * 0.0035;
      const offsetLng = (((seed * 3) % 100) - 50) * 0.0035;

      return {
        ...order,
        lat: baseCoord.lat + offsetLat,
        lng: baseCoord.lng + offsetLng,
      };
    });
  }, []);

  const filteredOrders = useMemo(() => {
    return mappedOrders.filter(o => {
      const matchCity = selectedCity === 'all' || (o.city && o.city.toLowerCase() === selectedCity.toLowerCase());
      const matchStatus = statusFilter === 'all' || (o.status && o.status.toLowerCase() === statusFilter.toLowerCase());
      return matchCity && matchStatus;
    });
  }, [mappedOrders, selectedCity, statusFilter]);

  const delayedOrders = filteredOrders.filter(o => o.status === 'Delayed');

  const handleCitySelect = (city: string) => {
    setSelectedCity(city);
    if (city === 'all') {
      setMapCenter({ lat: 4.2105, lng: 101.9758 });
      setZoom(7);
    } else {
      const coord = CITY_COORDINATES[city.toLowerCase()] || CITY_COORDINATES['default'];
      setMapCenter(coord);
      setZoom(11);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[var(--ui-surface)] rounded-[32px] border border-[var(--ui-border)] shadow-[0_4px_24px_rgba(0,0,0,0.02)] overflow-hidden relative">
      {/* Header */}
      <header className="px-6 py-4 border-b border-[var(--ui-border)] flex flex-wrap items-center justify-between gap-4 shrink-0 bg-[var(--ui-surface)] z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-100/60 shadow-xs">
            <Navigation className="text-emerald-600" size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[var(--ui-text)] tracking-tight flex items-center gap-2">
              Abang Colek Fleet & Logistics Map (Google Maps)
              <span className="text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Map
              </span>
            </h1>
            <p className="text-xs text-[var(--ui-muted)]">
              Interactive fleet tracking for Abang Colek pop-up stalls, runner dispatches, and outstation deliveries across Malaysia.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedCity}
            onChange={(e) => handleCitySelect(e.target.value)}
            className="text-xs bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-full px-3 py-1.5 text-[var(--ui-text)] focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
          >
            <option value="all">Semua Wilayah (Malaysia)</option>
            <option value="johor bahru">Johor Bahru (HQ & Pop-up Toppen)</option>
            <option value="shah alam">Shah Alam (Central Fulfillment Hub)</option>
            <option value="kuala terengganu">Kuala Terengganu (Stokis Pantai Timur)</option>
            <option value="kuala lumpur">Kuala Lumpur / Lembah Klang</option>
            <option value="bangi">Bangi (Selangor Hub)</option>
            <option value="penang">Pulau Pinang (Northern Hub)</option>
            <option value="kota bharu">Kota Bharu (Kelantan Hub)</option>
            <option value="melaka">Melaka Hub</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-full px-3 py-1.5 text-[var(--ui-text)] focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
          >
            <option value="all">All Order Statuses</option>
            <option value="delayed">⚠️ Delayed Only</option>
            <option value="delivered">✅ Delivered</option>
            <option value="processing">📦 Processing</option>
          </select>
        </div>
      </header>

      {/* Main split */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Map Container (70% on desktop) */}
        <div className="flex-1 min-h-[380px] md:min-h-0 relative h-full w-full">
          <APIProvider apiKey={API_KEY}>
            <Map
              center={mapCenter}
              zoom={zoom}
              mapId="DEMO_MAP_ID"
              style={{ width: '100%', height: '100%' }}
              gestureHandling="greedy"
              disableDefaultUI={false}
              internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
            >
              {filteredOrders.map((order) => {
                const isDelayed = order.status === 'Delayed';
                return (
                  <AdvancedMarker
                    key={order.order_id}
                    position={{ lat: order.lat, lng: order.lng }}
                    onClick={() => setActiveOrder(order)}
                  >
                    <Pin
                      background={isDelayed ? '#EF4444' : '#10B981'}
                      borderColor={isDelayed ? '#B91C1C' : '#047857'}
                      glyphColor="#FFFFFF"
                      scale={isDelayed ? 1.15 : 0.9}
                    />
                  </AdvancedMarker>
                );
              })}

              {activeOrder && (
                <InfoWindow
                  position={{ lat: activeOrder.lat, lng: activeOrder.lng }}
                  onCloseClick={() => setActiveOrder(null)}
                >
                  <div className="p-2 rounded-xl bg-[var(--ui-surface)] space-y-1.5 max-w-[220px] text-[var(--ui-text)] font-sans">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs">Order #{activeOrder.order_id.slice(-6)}</span>
                      <span className={cn(
                        "text-[10px] font-semibold px-1.5 py-0.5 rounded",
                        activeOrder.status === 'Delayed' ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"
                      )}>
                        {activeOrder.status}
                      </span>
                    </div>
                    <div className="text-xs text-[var(--ui-muted)]">
                      City: <span className="font-semibold text-[var(--ui-text)] capitalize">{activeOrder.city}</span>
                    </div>
                    <div className="text-xs text-[var(--ui-muted)]">
                      Amount: <span className="font-bold text-[var(--ui-text)]">RM {activeOrder.amount}</span>
                    </div>
                    <div className="text-[10px] text-[var(--ui-muted)]">
                      Date: {activeOrder.date}
                    </div>
                    {activeOrder.status === 'Delayed' && onAction && (
                      <button
                        onClick={() => {
                          onAction(`Investigate delayed shipment for order ${activeOrder.order_id} in ${activeOrder.city} and issue refund.`);
                        }}
                        className="mt-2 w-full py-1 px-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-semibold transition-colors flex items-center justify-center gap-1"
                      >
                        Refund with AI Agent &rarr;
                      </button>
                    )}
                  </div>
                </InfoWindow>
              )}
            </Map>
          </APIProvider>
        </div>

        {/* Sidebar Info Panel (30% on desktop) */}
        <div className="w-full md:w-[360px] border-t md:border-t-0 md:border-l border-[var(--ui-border)] bg-[var(--ui-bg)] flex flex-col shrink-0 overflow-y-auto p-5 space-y-4">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 bg-[var(--ui-surface)] rounded-2xl border border-[var(--ui-border)] shadow-xs">
              <span className="text-[10px] uppercase font-bold text-[var(--ui-muted)]">Visible Shipments</span>
              <div className="text-lg font-bold text-[var(--ui-text)] mt-0.5">{filteredOrders.length}</div>
            </div>
            <div className="p-3 bg-[var(--ui-surface)] rounded-2xl border border-[var(--ui-border)] shadow-xs">
              <span className="text-[10px] uppercase font-bold text-[var(--ui-danger-text)]">Delayed Shipments</span>
              <div className="text-lg font-bold text-[var(--ui-danger-text)] mt-0.5">{delayedOrders.length}</div>
            </div>
          </div>

          {/* Delayed Orders Callout */}
          {delayedOrders.length > 0 && (
            <div className="p-3.5 bg-red-50/80 border border-red-200/60 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-red-800">
                <AlertTriangle size={15} />
                <span>Bottlenecks Detected</span>
              </div>
              <p className="text-[11px] text-red-700 leading-relaxed">
                {delayedOrders.length} orders are delayed. Click any delayed pin on the map to issue an instant refund or notify the customer.
              </p>
            </div>
          )}

          {/* Orders Feed */}
          <div className="space-y-2 flex-1">
            <span className="text-xs font-bold text-[var(--ui-text)] uppercase tracking-wider block">
              Shipment Dispatch Log
            </span>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {filteredOrders.slice(0, 15).map((order) => (
                <div
                  key={order.order_id}
                  onClick={() => {
                    setActiveOrder(order);
                    setMapCenter({ lat: order.lat, lng: order.lng });
                    setZoom(12);
                  }}
                  className="p-3 bg-[var(--ui-surface)] rounded-xl border border-[var(--ui-border)] hover:border-emerald-300 transition-all cursor-pointer flex items-center justify-between shadow-xs"
                >
                  <div>
                    <div className="text-xs font-semibold text-[var(--ui-text)] truncate capitalize">
                      {order.city} Delivery
                    </div>
                    <div className="text-[10px] text-[var(--ui-muted)]">
                      ID: #{order.order_id.slice(-6)} • RM {order.amount}
                    </div>
                  </div>
                  <span className={cn(
                    "text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0",
                    order.status === 'Delayed' ? "bg-red-50 text-red-700 border border-red-200/60" : "bg-emerald-50 text-emerald-700"
                  )}>
                    {order.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
