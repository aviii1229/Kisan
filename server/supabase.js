import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = () => {
  return Boolean(
    supabaseUrl &&
    supabaseKey &&
    !supabaseUrl.includes('your-supabase-project') &&
    !supabaseKey.includes('your_supabase_anon_key')
  );
};

// Initialize Supabase Client for Server
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder'
);

/**
 * Server-side Supabase Database Service
 */
export class SupabaseService {
  /**
   * Check connection status to online Supabase database
   */
  static async checkConnection() {
    if (!isSupabaseConfigured()) {
      return {
        connected: false,
        message: 'Supabase credentials missing in .env file (SUPABASE_URL / SUPABASE_ANON_KEY)'
      };
    }
    try {
      const { data, error } = await supabase.from('centres').select('id').limit(1);
      if (error) {
        return { connected: false, message: error.message };
      }
      return { connected: true, message: 'Connected to online Supabase database!' };
    } catch (e) {
      return { connected: false, message: e.message };
    }
  }

  // --- CENTRES ---
  static async getCentres() {
    const { data, error } = await supabase.from('centres').select('*');
    if (error) throw error;
    return data;
  }

  static async getCentreById(id) {
    const { data, error } = await supabase.from('centres').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  }

  static async updateCentreStatus(id, status, statusReason = '') {
    const { data, error } = await supabase
      .from('centres')
      .update({ status, statusReason, updatedAt: new Date().toISOString() })
      .eq('id', id)
      .select();
    if (error) throw error;
    return data[0];
  }

  // --- TOKENS (BOOKINGS) ---
  static async getTokens() {
    const { data, error } = await supabase.from('tokens').select('*').order('issuedAt', { ascending: false });
    if (error) throw error;
    return data;
  }

  static async createToken(tokenData) {
    const { data, error } = await supabase.from('tokens').insert([tokenData]).select();
    if (error) throw error;
    return data[0];
  }

  static async updateTokenStatus(tokenNumber, status, extraData = {}) {
    const payload = { status, updatedAt: new Date().toISOString(), ...extraData };
    const { data, error } = await supabase
      .from('tokens')
      .update(payload)
      .eq('tokenNumber', tokenNumber)
      .select();
    if (error) throw error;
    return data[0];
  }

  // --- FARMERS ---
  static async getFarmers() {
    const { data, error } = await supabase.from('farmers').select('*');
    if (error) throw error;
    return data;
  }

  static async upsertFarmer(farmerData) {
    const { data, error } = await supabase.from('farmers').upsert([farmerData]).select();
    if (error) throw error;
    return data[0];
  }

  // --- ANNOUNCEMENTS ---
  static async getAnnouncements() {
    const { data, error } = await supabase.from('announcements').select('*').order('timestamp', { ascending: false });
    if (error) throw error;
    return data;
  }

  static async createAnnouncement(announcementData) {
    const { data, error } = await supabase.from('announcements').insert([announcementData]).select();
    if (error) throw error;
    return data[0];
  }

  // --- MSP CATALOG ---
  static async getMspCatalog() {
    const { data, error } = await supabase.from('msp_catalog').select('*');
    if (error) throw error;
    return data;
  }

  // --- NOTIFICATIONS ---
  static async getNotifications(phone) {
    let query = supabase.from('notifications').select('*').order('timestamp', { ascending: false });
    if (phone) query = query.eq('phone', phone);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  static async createNotification(notifData) {
    const { data, error } = await supabase.from('notifications').insert([notifData]).select();
    if (error) throw error;
    return data[0];
  }
}
