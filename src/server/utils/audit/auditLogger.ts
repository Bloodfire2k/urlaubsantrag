import { Request } from 'express'

export interface AuditLogEntry {
  id: number
  user_id: number
  action: string
  table_name: string
  record_id: number
  old_values?: string
  new_values?: string
  ip_address: string
  user_agent?: string
  created_at: string
}

export const createAuditLog = (
  req: Request,
  action: string,
  tableName: string,
  recordId: number,
  oldValues?: any,
  newValues?: any
): AuditLogEntry => {
  return {
    id: 0, // Wird von der Datenbank gesetzt
    user_id: req.user.userId,
    action,
    table_name: tableName,
    record_id: recordId,
    old_values: oldValues ? JSON.stringify(oldValues) : undefined,
    new_values: newValues ? JSON.stringify(newValues) : undefined,
    ip_address: req.ip,
    user_agent: req.get('User-Agent'),
    created_at: new Date().toISOString()
  }
}
