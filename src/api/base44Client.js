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
 * @property {(email: string, role?: string) => Promise<any>} auth.login
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
 *   ActivityLog: EntityClient
 * }} entities
 */

import { mockBase44 } from './mockBase44';

// Export the mock client as the default 'base44' export
/** @type {Base44Client} */
export const base44 = mockBase44;
