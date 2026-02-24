/**
 * @typedef {Object} EntityClient
 * @property {(sort?: string, limit?: number) => Promise<any[]>} list
 * @property {(id: string) => Promise<any>} get
 * @property {(data: any) => Promise<any>} create
 * @property {(id: string, data: any) => Promise<any>} update
 * @property {(id: string) => Promise<any>} delete
 * @property {(callback: (e: any) => void) => () => void} subscribe
 */

/**
 * @typedef {Object} Base44Client
 * @property {object} auth
 * @property {() => Promise<any>} auth.me
 * @property {(email: string, role: string, password?: string) => Promise<any>} auth.login
 * @property {(email: string) => Promise<any>} auth.resendConfirmation
 * @property {() => Promise<void>} auth.logout
 * @property {() => void} auth.redirectToLogin
 * @property {object} users
 * @property {(email: string, role: string) => Promise<any>} users.inviteUser
 * @property {{
 *   logUserInApp: (pageName: string) => Promise<void>
 * }} appLogs
 * @property {{
 *   Startup: EntityClient,
 *   Team: EntityClient,
 *   Bid: EntityClient,
 *   AuctionSettings: EntityClient,
 *   PowerCard: EntityClient,
 *   BreakingNews: EntityClient,
 *   ActivityLog: EntityClient,
 *   User: EntityClient
 * }} entities
 */

import { mockBase44 } from './mockBase44';
import { supabaseBase44 } from './supabaseClientImplementation';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isSupabaseConfigured = supabaseUrl && supabaseAnonKey && supabaseUrl !== 'YOUR_SUPABASE_URL';

if (!isSupabaseConfigured) {
    console.warn('Bid2Unicorn: Supabase not configured. Using Mock Data (LocalStorage). Setup .env to switch to Live Database.');
} else {
    console.log('Bid2Unicorn: Connected to Supabase Live Database');
}

// Export the appropriate client
/** @type {Base44Client} */
export const base44 = isSupabaseConfigured ? supabaseBase44 : mockBase44;
