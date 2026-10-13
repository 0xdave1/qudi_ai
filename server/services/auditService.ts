import { getPrisma } from '../db/prisma';

export interface AuditLogItem {
  id: string;
  action: string;
  actor: 'USER' | 'SYSTEM' | 'ADMIN';
  userId?: string;
  userPhone?: string;
  riskScore?: number;
  flags?: string;
  metadata?: any;
  createdAt: string;
}

class AuditService {
  private fallbackLogs: AuditLogItem[] = [];

  public async log(params: {
    action: string;
    actor: 'USER' | 'SYSTEM' | 'ADMIN';
    userId?: string;
    userPhone?: string;
    riskScore?: number;
    flags?: string;
    metadata?: any;
  }): Promise<AuditLogItem> {
    const item: AuditLogItem = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      ...params,
    };

    this.fallbackLogs.unshift(item);
    if (this.fallbackLogs.length > 200) {
      this.fallbackLogs.pop();
    }

    const prisma = getPrisma();
    if (prisma) {
      try {
        await prisma.auditLog.create({
          data: {
            action: params.action,
            actor: params.actor,
            userId: params.userId,
            userPhone: params.userPhone,
            riskScore: params.riskScore,
            flags: params.flags,
            metadata: params.metadata,
          },
        });
      } catch (err: any) {
        console.warn('[AuditService Prisma Log Error]:', err.message);
      }
    }

    return item;
  }

  public async getRecentLogs(limit: number = 50): Promise<AuditLogItem[]> {
    const prisma = getPrisma();
    if (prisma) {
      try {
        const records = await prisma.auditLog.findMany({
          orderBy: { createdAt: 'desc' },
          take: limit,
        });
        if (records.length > 0) {
          return records.map((r) => ({
            id: r.id,
            action: r.action,
            actor: r.actor as any,
            userId: r.userId || undefined,
            userPhone: r.userPhone || undefined,
            riskScore: r.riskScore || undefined,
            flags: r.flags || undefined,
            metadata: r.metadata,
            createdAt: r.createdAt.toISOString(),
          }));
        }
      } catch (err: any) {
        console.warn('[AuditService Prisma Read Error]:', err.message);
      }
    }

    return this.fallbackLogs.slice(0, limit);
  }
}

export const auditService = new AuditService();
