import crypto from 'crypto';
import { WebhookLogEntry } from '../types/bot';
import { getPrisma } from '../db/prisma';

export interface WhatsAppButton {
  type: 'reply';
  reply: {
    id: string;
    title: string;
  };
}

class WhatsAppService {
  private token: string;
  private phoneNumberId: string;
  private appSecret: string;
  private logs: WebhookLogEntry[] = [];
  private outboxMessages: Array<{ to: string; text: string; payload: any; timestamp: string }> = [];
  private processedMessageIds: Set<string> = new Set();

  constructor() {
    this.token = process.env.WHATSAPP_TOKEN || '';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    this.appSecret = process.env.WHATSAPP_APP_SECRET || '';
  }

  public isConfigured(): boolean {
    return Boolean(this.token && this.token.startsWith('EAAG') && this.phoneNumberId);
  }

  public getConfigurationStatus() {
    return {
      isConfigured: this.isConfigured(),
      phoneNumberId: this.phoneNumberId || 'Not configured (using dev adapter)',
      tokenSet: Boolean(this.token && this.token.length > 10),
      appSecretSet: Boolean(this.appSecret),
      verifyTokenSet: Boolean(process.env.WHATSAPP_VERIFY_TOKEN),
      graphApiEndpoint: `https://graph.facebook.com/v21.0/${this.phoneNumberId || '{PHONE_NUMBER_ID}'}/messages`,
    };
  }

  public isMessageProcessed(messageId?: string): boolean {
    if (!messageId) return false;
    return this.processedMessageIds.has(messageId);
  }

  public markMessageProcessed(messageId?: string): void {
    if (!messageId) return;
    this.processedMessageIds.add(messageId);
    if (this.processedMessageIds.size > 500) {
      const first = Array.from(this.processedMessageIds)[0];
      this.processedMessageIds.delete(first);
    }
  }

  public verifySignature(rawBody: string, signatureHeader?: string): boolean {
    const secret = this.appSecret || process.env.WHATSAPP_APP_SECRET;
    if (!signatureHeader) {
      return !secret; // If no signature provided, allow only if no secret configured
    }

    const parts = signatureHeader.split('=');
    if (parts.length !== 2 || parts[0] !== 'sha256' || !parts[1]) {
      return false;
    }

    const signature = parts[1];
    const expectedSignature = crypto
      .createHmac('sha256', secret || 'qudi_app_secret_signature_key')
      .update(rawBody)
      .digest('hex');

    const sigBuffer = Buffer.from(signature, 'utf-8');
    const expectedBuffer = Buffer.from(expectedSignature, 'utf-8');

    if (sigBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
  }

  public async persistMessageToDb(params: {
    messageId?: string;
    userPhone: string;
    direction: 'INBOUND' | 'OUTBOUND';
    messageType?: string;
    content: string;
    rawPayload?: any;
    status?: string;
  }): Promise<void> {
    const prisma = getPrisma();
    if (prisma) {
      try {
        const user = await prisma.user.findUnique({
          where: { whatsappPhone: params.userPhone },
        });

        const msgId = params.messageId || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const safePayload = params.rawPayload && typeof params.rawPayload === 'object' ? params.rawPayload : (params.rawPayload ? { data: params.rawPayload } : undefined);

        await prisma.whatsAppMessage.upsert({
          where: { whatsappMessageId: msgId },
          update: {
            status: params.status || 'SUCCESS',
          },
          create: {
            whatsappMessageId: msgId,
            userId: user?.id,
            userPhone: params.userPhone,
            direction: params.direction,
            messageType: params.messageType || 'text',
            content: params.content,
            rawPayload: safePayload,
            status: params.status || 'SUCCESS',
          },
        });
      } catch (err: any) {
        console.warn('[WhatsAppService Prisma Message Save Notice]:', err.message);
      }
    }
  }

  public logEvent(entry: Omit<WebhookLogEntry, 'id' | 'timestamp'>): void {
    const logItem: WebhookLogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };
    this.logs.unshift(logItem);
    if (this.logs.length > 150) {
      this.logs.pop();
    }
  }

  public getLogs(): WebhookLogEntry[] {
    return [...this.logs];
  }

  public getOutbox(): Array<{ to: string; text: string; payload: any; timestamp: string }> {
    return [...this.outboxMessages];
  }

  public async sendTextMessage(to: string, text: string): Promise<boolean> {
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: {
        preview_url: false,
        body: text,
      },
    };

    return this.dispatchToMeta(to, payload, text);
  }

  public async sendInteractiveButtons(
    to: string,
    bodyText: string,
    buttons: WhatsAppButton[]
  ): Promise<boolean> {
    // WhatsApp Cloud API supports up to 3 quick reply buttons
    const safeButtons = buttons.slice(0, 3);
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: {
          text: bodyText,
        },
        action: {
          buttons: safeButtons,
        },
      },
    };

    return this.dispatchToMeta(to, payload, bodyText);
  }

  private async dispatchToMeta(to: string, payload: any, displayText: string): Promise<boolean> {
    const timestamp = new Date().toISOString();
    this.outboxMessages.unshift({ to, text: displayText, payload, timestamp });
    if (this.outboxMessages.length > 50) this.outboxMessages.pop();

    // Persist outbound message to Neon PostgreSQL
    this.persistMessageToDb({
      userPhone: to,
      direction: 'OUTBOUND',
      messageType: payload.type || 'text',
      content: displayText,
      rawPayload: payload,
      status: 'SUCCESS',
    }).catch(() => {});

    if (!this.isConfigured()) {
      // Development adapter: Log the mock send
      this.logEvent({
        direction: 'OUTBOUND',
        userPhone: to,
        eventType: 'whatsapp_message_sent (DEV_ADAPTER)',
        payload,
        status: 'DEV_MOCK',
      });
      console.log(`[WhatsApp Dev Adapter] Outbound to ${to}: ${displayText.slice(0, 80)}...`);
      return true;
    }

    try {
      const url = `https://graph.facebook.com/v21.0/${this.phoneNumberId}/messages`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('[WhatsApp Cloud API Error]', responseData);
        this.logEvent({
          direction: 'OUTBOUND',
          userPhone: to,
          eventType: 'whatsapp_message_failed',
          payload: { request: payload, response: responseData },
          status: 'ERROR',
          errorMessage: responseData.error?.message || 'Meta API error',
        });
        return false;
      }

      this.logEvent({
        direction: 'OUTBOUND',
        userPhone: to,
        eventType: 'whatsapp_message_sent',
        payload: { request: payload, response: responseData },
        status: 'SUCCESS',
      });

      return true;
    } catch (err: any) {
      console.error('[WhatsApp Cloud API Network Exception]', err);
      this.logEvent({
        direction: 'OUTBOUND',
        userPhone: to,
        eventType: 'whatsapp_message_network_error',
        payload: { request: payload },
        status: 'ERROR',
        errorMessage: err.message,
      });
      return false;
    }
  }
}

export const whatsappService = new WhatsAppService();
