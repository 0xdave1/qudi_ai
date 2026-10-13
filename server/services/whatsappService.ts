import crypto from 'crypto';
import { WebhookLogEntry } from '../types/bot';

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

  public verifySignature(rawBody: string, signatureHeader?: string): boolean {
    if (!this.appSecret) return true; // If app secret not configured in dev, pass
    if (!signatureHeader) return false;

    const [algorithm, signature] = signatureHeader.split('=');
    if (algorithm !== 'sha256' || !signature) return false;

    const expectedSignature = crypto
      .createHmac('sha256', this.appSecret)
      .update(rawBody)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'utf-8'),
      Buffer.from(expectedSignature, 'utf-8')
    );
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
