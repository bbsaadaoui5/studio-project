import { db } from './firebase-client';
import { collection, addDoc, serverTimestamp, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

/**
 * Audit logging system for tracking sensitive operations
 */

export type AuditAction = 
  | 'payroll.generate'
  | 'payroll.confirm'
  | 'payroll.edit'
  | 'payroll.delete'
  | 'payment.create'
  | 'payment.update'
  | 'payment.delete'
  | 'staff.create'
  | 'staff.update'
  | 'staff.delete'
  | 'student.create'
  | 'student.update'
  | 'student.delete'
  | 'auth.login'
  | 'auth.logout'
  | 'auth.failed_login'
  | 'settings.update'
  | 'expense.create'
  | 'expense.approve';

export interface AuditLogEntry {
  id?: string;
  action: AuditAction;
  userId?: string;
  userEmail?: string;
  userName?: string;
  resourceId?: string;
  resourceType?: string;
  timestamp: string | any;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'failure';
  errorMessage?: string;
}

/**
 * Log an audit event
 */
export async function logAudit(entry: Omit<AuditLogEntry, 'timestamp' | 'id'>): Promise<void> {
  if (!db) {
    console.warn('Firestore not initialized. Cannot log audit entry.');
    return;
  }

  try {
    const auditCollection = collection(db, 'auditLogs');
    const auditEntry: AuditLogEntry = {
      ...entry,
      timestamp: serverTimestamp(),
    };
    
    await addDoc(auditCollection, auditEntry);
  } catch (error) {
    console.error('Failed to log audit entry:', error);
    // Don't throw - audit logging shouldn't break the app
  }
}

/**
 * Get recent audit logs (admin only)
 */
export async function getRecentAuditLogs(maxResults: number = 100): Promise<AuditLogEntry[]> {
  if (!db) return [];

  try {
    const auditCollection = collection(db, 'auditLogs');
    const q = query(
      auditCollection,
      orderBy('timestamp', 'desc'),
      limit(maxResults)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as AuditLogEntry));
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    return [];
  }
}

/**
 * Get audit logs for a specific user
 */
export async function getUserAuditLogs(userId: string, maxResults: number = 50): Promise<AuditLogEntry[]> {
  if (!db) return [];

  try {
    const auditCollection = collection(db, 'auditLogs');
    const q = query(
      auditCollection,
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(maxResults)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as AuditLogEntry));
  } catch (error) {
    console.error('Failed to fetch user audit logs:', error);
    return [];
  }
}

/**
 * Get audit logs for a specific action
 */
export async function getActionAuditLogs(action: AuditAction, maxResults: number = 50): Promise<AuditLogEntry[]> {
  if (!db) return [];

  try {
    const auditCollection = collection(db, 'auditLogs');
    const q = query(
      auditCollection,
      where('action', '==', action),
      orderBy('timestamp', 'desc'),
      limit(maxResults)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as AuditLogEntry));
  } catch (error) {
    console.error('Failed to fetch action audit logs:', error);
    return [];
  }
}

/**
 * Helper to get browser info for audit logging
 */
export function getBrowserInfo(): { userAgent?: string; ipAddress?: string } {
  if (typeof window === 'undefined') return {};
  
  return {
    userAgent: navigator.userAgent,
    // Note: IP address would need to be set server-side via API route
  };
}
