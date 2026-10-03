/**
 * Supabase Client & Operations Service for ABANGCOLEK-OS
 * Project ID: bktksvhcgszaoqkdyhil
 * Host: db.bktksvhcgszaoqkdyhil.supabase.co
 */

import { createClient } from '@supabase/supabase-js';

export const SUPABASE_CONFIG = {
  url: import.meta.env.VITE_SUPABASE_URL || 'https://bktksvhcgszaoqkdyhil.supabase.co',
  publishableKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  projectRef: 'bktksvhcgszaoqkdyhil',
  dbHost: 'db.bktksvhcgszaoqkdyhil.supabase.co:5432',
};

// Initialize Supabase Client
export const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.publishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export interface SupabaseHealthCheckResult {
  isConnected: boolean;
  projectUrl: string;
  projectRef: string;
  latencyMs: number;
  message: string;
  tables?: string[];
  error?: string;
}

/**
 * Checks connectivity to the live Supabase project
 */
export async function checkSupabaseConnection(): Promise<SupabaseHealthCheckResult> {
  const startTime = Date.now();
  try {
    // Attempt a light ping by querying auth settings or public schema
    const { data: _data, error } = await supabase.from('orders').select('count', { count: 'exact', head: true });
    const latencyMs = Date.now() - startTime;

    if (error && error.code !== 'PGRST116' && !error.message.includes('relation "public.orders" does not exist')) {
      // If table doesn't exist yet, it still means Supabase responded with a valid PostgREST error!
      if (error.message.includes('does not exist') || error.code === '42P01') {
        return {
          isConnected: true,
          projectUrl: SUPABASE_CONFIG.url,
          projectRef: SUPABASE_CONFIG.projectRef,
          latencyMs,
          message: 'Tersambung ke Supabase (Pangkalan data aktif, sedia untuk migrasi jadual).',
          tables: [],
        };
      }
      return {
        isConnected: false,
        projectUrl: SUPABASE_CONFIG.url,
        projectRef: SUPABASE_CONFIG.projectRef,
        latencyMs,
        message: 'Ralat respon Supabase',
        error: error.message,
      };
    }

    return {
      isConnected: true,
      projectUrl: SUPABASE_CONFIG.url,
      projectRef: SUPABASE_CONFIG.projectRef,
      latencyMs,
      message: 'Tersambung ke Supabase Cloud (Live & Responsif)',
    };
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    return {
      isConnected: false,
      projectUrl: SUPABASE_CONFIG.url,
      projectRef: SUPABASE_CONFIG.projectRef,
      latencyMs,
      message: 'Gagal menyambung ke pelayan Supabase',
      error: err?.message || String(err),
    };
  }
}

/**
 * SQL Schema definition for Abang Colek OS
 * Can be run in Supabase SQL Editor if tables are not yet created
 */
export const ABANGCOLEK_SQL_SCHEMA = `
-- ================================================================
-- ABANGCOLEK-OS POSTGRESQL SCHEMA (Supabase Project: bktksvhcgszaoqkdyhil)
-- ================================================================

-- 1. Jadual Pesanan (Orders)
CREATE TABLE IF NOT EXISTS public.orders (
  id VARCHAR(64) PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  location VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'completed',
  total_amount NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- 2. Jadual Inventori Botol (Inventory)
CREATE TABLE IF NOT EXISTS public.inventory (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100) UNIQUE NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  min_alert INT NOT NULL DEFAULT 10,
  price NUMERIC(10, 2) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Jadual Log & Invarian JEV (Audit Logs)
CREATE TABLE IF NOT EXISTS public.jev_audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand VARCHAR(50) NOT NULL,
  issue_class VARCHAR(100) NOT NULL,
  root_cause VARCHAR(100) NOT NULL,
  confidence_score NUMERIC(4, 2),
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jev_audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow read access for authenticated and anon clients with publishable key
CREATE POLICY "Allow public read orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Allow public insert orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read inventory" ON public.inventory FOR SELECT USING (true);
CREATE POLICY "Allow public read jev_audit_logs" ON public.jev_audit_logs FOR SELECT USING (true);
`;
