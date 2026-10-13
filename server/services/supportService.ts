import { SupportTicket } from '../types/bot';

class SupportService {
  private tickets: Map<string, SupportTicket> = new Map();

  constructor() {
    // Seed initial support ticket for admin demonstration
    const now = new Date();
    this.tickets.set('tkt_1', {
      id: 'tkt_1',
      ticketNumber: 'SUP-4019',
      userPhone: '2348031234567',
      userName: 'Amina Bello',
      subject: 'Transaction confirmation inquiry',
      message: 'User requested human verification on exchange payout to Cotonou MTN MoMo account.',
      status: 'OPEN',
      createdAt: now.toISOString(),
    });
  }

  public createTicket(params: {
    userPhone: string;
    userName: string;
    subject: string;
    message: string;
  }): SupportTicket {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const id = `tkt_${Date.now()}`;
    const ticket: SupportTicket = {
      id,
      ticketNumber: `SUP-${randomSuffix}`,
      userPhone: params.userPhone,
      userName: params.userName || 'WhatsApp User',
      subject: params.subject,
      message: params.message,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
    };

    this.tickets.set(id, ticket);
    return ticket;
  }

  public getTickets(): SupportTicket[] {
    return Array.from(this.tickets.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public resolveTicket(id: string, _resolutionNote?: string): SupportTicket | undefined {
    const t = this.tickets.get(id);
    if (!t) return undefined;
    t.status = 'RESOLVED';
    t.resolvedAt = new Date().toISOString();
    this.tickets.set(id, t);
    return t;
  }
}

export const supportService = new SupportService();
