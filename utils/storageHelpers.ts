/**
 * Storage Helper Functions
 * Convenient wrappers for common storage operations
 */

import { storage } from './platform';

// Wallet Storage
export const getWallet = () => storage.get('xbyte_wallet');
export const setWallet = (data: any) => storage.set('xbyte_wallet', data);
export const removeWallet = () => storage.remove('xbyte_wallet');

// Admin Users
export const getAdminUsers = async () => {
  const users = await storage.get('xbyte_admin_users');
  return users || [];
};
export const setAdminUsers = (users: any[]) => storage.set('xbyte_admin_users', users);

// Admin Fees
export const getAdminFees = async () => {
  const fees = await storage.get('xbyte_admin_fees');
  return fees || null;
};
export const setAdminFees = (fees: any) => storage.set('xbyte_admin_fees', fees);

// User Activities
export const getUserActivities = async () => {
  const activities = await storage.get('xbyte_user_activities');
  return activities || {};
};
export const setUserActivities = (activities: any) => storage.set('xbyte_user_activities', activities);

// Support Tickets
export const getSupportTickets = async () => {
  const tickets = await storage.get('xbyte_support_tickets');
  return tickets || [];
};
export const setSupportTickets = (tickets: any[]) => storage.set('xbyte_support_tickets', tickets);

export const getUserTickets = async (userId: string) => {
  const tickets = await storage.get(`xbyte_tickets_${userId}`);
  return tickets || [];
};
export const setUserTickets = (userId: string, tickets: any[]) => 
  storage.set(`xbyte_tickets_${userId}`, tickets);

// Live Chats
export const getLiveChats = async () => {
  const chats = await storage.get('xbyte_live_chats');
  return chats || [];
};
export const setLiveChats = (chats: any[]) => storage.set('xbyte_live_chats', chats);

// Audit Logs
export const getAuditLogs = async () => {
  const logs = await storage.get('xbyte_admin_audit_logs');
  return logs || [];
};
export const setAuditLogs = (logs: any[]) => storage.set('xbyte_admin_audit_logs', logs);

// Admin Session
export const getAdminSession = () => storage.get('xbyte_admin_session');
export const setAdminSession = (session: any) => storage.set('xbyte_admin_session', session);
export const removeAdminSession = () => storage.remove('xbyte_admin_session');

// Dark Mode
export const getDarkMode = () => storage.get('darkMode');
export const setDarkMode = (darkMode: boolean) => storage.set('darkMode', darkMode);
