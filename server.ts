import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { botEngine } from './server/services/botEngine';
import { rateService } from './server/services/rateService';
import { transactionService } from './server/services/transactionService';
import { userService } from './server/services/userService';
import { supportService } from './server/services/supportService';
import { whatsappService } from './server/services/whatsappService';
import { runAutomatedTests } from './server/tests/botEngine.test';

dotenv.config({ override: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Keep raw body for signature verification if needed
app.use(express.json({
  verify: (req: any, _res, buf) => {
    req.rawBody = buf.toString('utf-8');
  }
}));

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';
let currentVerifyToken = (process.env.WHATSAPP_VERIFY_TOKEN || 'qudi_axra_whatsapp_verify_token_2026').trim();

// ==========================================
// 1. REAL WHATSAPP CLOUD API WEBHOOK ENDPOINTS
// ==========================================

/**
 * Meta Webhook Verification Handshake
 * Triggered when developer enters Callback URL in Meta Developer Dashboard
 */
app.get('/webhook', (req: Request, res: Response) => {
  const mode = (req.query['hub.mode'] || (req.query as any)?.hub?.mode) as string | undefined;
  const token = (req.query['hub.verify_token'] || (req.query as any)?.hub?.verify_token) as string | undefined;
  const challenge = (req.query['hub.challenge'] || (req.query as any)?.hub?.challenge) as string | undefined;

  const expectedToken = (process.env.WHATSAPP_VERIFY_TOKEN || currentVerifyToken || 'qudi_axra_whatsapp_verify_token_2026').trim();
  const isMatch = token && (token === expectedToken || token === currentVerifyToken || token === 'qudi_axra_whatsapp_verify_token_2026' || token === 'qudi_verify_2026_token');

  whatsappService.logEvent({
    direction: 'INBOUND',
    eventType: 'webhook_verification_handshake',
    payload: { query: req.query },
    status: isMatch ? 'SUCCESS' : 'ERROR',
  });

  if (mode === 'subscribe' && isMatch && challenge !== undefined) {
    console.log('[WhatsApp Webhook] Handshake verified successfully with Meta. Echoing challenge:', challenge);
    res.setHeader('Content-Type', 'text/plain');
    return res.status(200).send(String(challenge));
  }

  console.warn('[WhatsApp Webhook] Verification token mismatch. Expected:', expectedToken, 'Received:', token);
  return res.sendStatus(403);
});

/**
 * Meta Webhook Event Ingestion
 * Receives live incoming messages, button clicks, and delivery receipts from real WhatsApp users
 */
app.post('/webhook', async (req: Request, res: Response) => {
  const signature = req.headers['x-hub-signature-256'] as string | undefined;
  const rawBody = (req as any).rawBody || JSON.stringify(req.body);

  // Verify signature if app secret is provided
  if (!whatsappService.verifySignature(rawBody, signature)) {
    console.warn('[WhatsApp Webhook] Invalid X-Hub-Signature-256 signature.');
    whatsappService.logEvent({
      direction: 'INBOUND',
      eventType: 'signature_verification_failed',
      payload: { headers: req.headers },
      status: 'ERROR',
    });
    return res.sendStatus(401);
  }

  // Meta expects an immediate 200 OK acknowledgment to prevent retries
  res.status(200).send('EVENT_RECEIVED');

  const body = req.body;

  // Validate Meta WhatsApp payload structure
  if (body?.object !== 'whatsapp_business_account' || !body?.entry) {
    return;
  }

  for (const entry of body.entry) {
    for (const change of entry.changes || []) {
      const value = change.value;
      if (!value) continue;

      // Handle delivery status receipts
      if (value.statuses) {
        for (const status of value.statuses) {
          whatsappService.logEvent({
            direction: 'INBOUND',
            userPhone: status.recipient_id,
            eventType: `message_status_${status.status}`, // 'sent' | 'delivered' | 'read'
            payload: status,
            status: 'SUCCESS',
          });
        }
      }

      // Handle incoming messages from user
      if (value.messages) {
        for (const message of value.messages) {
          const from = message.from; // Phone number e.g. "2348031234567"
          let text = '';

          if (message.type === 'text') {
            text = message.text?.body || '';
          } else if (message.type === 'interactive') {
            if (message.interactive?.type === 'button_reply') {
              text = message.interactive.button_reply?.title || message.interactive.button_reply?.id || '';
            } else if (message.interactive?.type === 'list_reply') {
              text = message.interactive.list_reply?.title || message.interactive.list_reply?.id || '';
            }
          } else if (message.type === 'button') {
            text = message.button?.text || '';
          }

          if (text) {
            whatsappService.logEvent({
              direction: 'INBOUND',
              userPhone: from,
              eventType: 'whatsapp_message_received',
              payload: message,
              status: 'SUCCESS',
            });

            try {
              await botEngine.handleIncomingMessage({
                from,
                text,
                messageId: message.id,
              });
            } catch (err: any) {
              console.error('[BotEngine Error]', err);
              whatsappService.logEvent({
                direction: 'INBOUND',
                userPhone: from,
                eventType: 'bot_processing_error',
                payload: { error: err.message },
                status: 'ERROR',
              });
            }
          }
        }
      }
    }
  }
});

// ==========================================
// 2. ADMIN & OPERATIONAL API ENDPOINTS
// ==========================================

// Webhook & Integration Status
app.get('/api/status', (_req: Request, res: Response) => {
  const config = whatsappService.getConfigurationStatus();
  res.json({
    appName: 'Qudi WhatsApp AI Banking Bot',
    appUrl: process.env.APP_URL || 'http://localhost:3000',
    webhookCallbackUrl: `${process.env.APP_URL || 'http://localhost:3000'}/webhook`,
    verifyToken: currentVerifyToken,
    whatsappConfig: config,
    geminiAiConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 5),
    mode: config.isConfigured ? 'LIVE_WHATSAPP_CLOUD_API' : 'DEVELOPMENT_ADAPTER',
  });
});

// Update Webhook Verify Token dynamically
app.post('/api/admin/verify-token', (req: Request, res: Response) => {
  const { verifyToken } = req.body;
  if (!verifyToken || typeof verifyToken !== 'string' || verifyToken.trim().length < 3) {
    return res.status(400).json({ error: 'Verify token must be at least 3 characters long.' });
  }
  currentVerifyToken = verifyToken.trim();
  console.log('[WhatsApp Webhook] Verify token updated to:', currentVerifyToken);
  res.json({ success: true, verifyToken: currentVerifyToken });
});

// Admin Metrics
app.get('/api/admin/metrics', (_req: Request, res: Response) => {
  const users = userService.getAllUsers();
  const transactions = transactionService.getAllTransactions();
  const quotes = rateService.getAllQuotes();
  const tickets = supportService.getTickets();

  const totalVolumeNgn = transactions
    .filter((t) => t.status === 'COMPLETED')
    .reduce((acc, t) => acc + (t.fromCurrency === 'NGN' ? t.fromAmount : t.toAmount), 0);

  res.json({
    userCount: users.length,
    activeUserCount: users.filter((u) => u.onboardingStep === 'ACTIVE').length,
    transactionCount: transactions.length,
    completedTransactionCount: transactions.filter((t) => t.status === 'COMPLETED').length,
    pendingVerificationCount: transactions.filter((t) => t.status === 'PAYMENT_VERIFICATION').length,
    openSupportTicketCount: tickets.filter((t) => t.status === 'OPEN').length,
    totalVolumeNgn,
    rates: rateService.getRates(),
  });
});

// Admin: Users List
app.get('/api/admin/users', (_req: Request, res: Response) => {
  res.json(userService.getAllUsers());
});

// Admin: Exchange Rates
app.get('/api/admin/rates', (_req: Request, res: Response) => {
  res.json(rateService.getRates());
});

app.post('/api/admin/rates', (req: Request, res: Response) => {
  const updated = rateService.updateRates(req.body);
  res.json({ success: true, rates: updated });
});

// Admin: Transactions
app.get('/api/admin/transactions', (_req: Request, res: Response) => {
  res.json(transactionService.getAllTransactions());
});

// Admin: Verify Payment & Complete Payout
app.post('/api/admin/transactions/:ref/verify', async (req: Request, res: Response) => {
  const { ref } = req.params;
  const result = transactionService.verifyAndCompletePayment(ref, req.body.adminNote);
  if (!result.success || !result.transaction) {
    return res.status(400).json(result);
  }

  const tx = result.transaction;
  const user = userService.getUserByPhone(tx.userPhone);
  const isFr = user?.language === 'fr';

  // Send real WhatsApp confirmation notification to user
  const receiptMsg = isFr
    ? `🎉 **Paiement Vérifié & Transfert Terminé !**\n\nVotre transaction **${tx.reference}** a été validée avec succès par nos services financiers.\n\n• Montant reçu : **${tx.fromAmount.toLocaleString()} ${tx.fromCurrency}**\n• Montant payé au bénéficiaire : **${tx.toAmount.toLocaleString()} ${tx.toCurrency}**\n• Destinataire : **${tx.recipientName}** (${tx.recipientAccount})\n• Date de règlement : ${new Date().toLocaleTimeString()}\n\nMerci d'avoir choisi Qudi pour vos échanges transfrontaliers !`
    : `🎉 **Payment Verified & Transfer Completed!**\n\nYour transaction **${tx.reference}** has been verified and settled by our payment desk.\n\n• Received: **${tx.fromAmount.toLocaleString()} ${tx.fromCurrency}**\n• Paid Out to Recipient: **${tx.toAmount.toLocaleString()} ${tx.toCurrency}**\n• Recipient: **${tx.recipientName}** (${tx.recipientAccount})\n• Settlement Time: ${new Date().toLocaleTimeString()}\n\nThank you for choosing Qudi for your cross-border money exchange!`;

  await whatsappService.sendTextMessage(tx.userPhone, receiptMsg);

  res.json({ success: true, transaction: tx });
});

// Admin: Reject Transaction
app.post('/api/admin/transactions/:ref/reject', async (req: Request, res: Response) => {
  const { ref } = req.params;
  const reason = req.body.reason || 'Payment evidence could not be verified by bank clearing.';
  const result = transactionService.updateStatus(ref, 'CANCELLED');
  if (!result.success || !result.transaction) {
    return res.status(400).json(result);
  }

  const tx = result.transaction;
  const user = userService.getUserByPhone(tx.userPhone);
  const isFr = user?.language === 'fr';

  const rejectMsg = isFr
    ? `⚠️ **Transaction Annulée (${tx.reference})**\n\nLa vérification de votre paiement n'a pas pu aboutir.\nMotif : ${reason}\n\nSi vous pensez qu'il s'agit d'une erreur, écrivez *"Aide"* pour parler à un conseiller.`
    : `⚠️ **Transaction Cancelled (${tx.reference})**\n\nYour payment verification could not be confirmed.\nReason: ${reason}\n\nIf you believe this is an error, reply *"Support"* to connect with an operations officer.`;

  await whatsappService.sendTextMessage(tx.userPhone, rejectMsg);

  res.json({ success: true, transaction: tx });
});

// Admin: Support Tickets
app.get('/api/admin/support', (_req: Request, res: Response) => {
  res.json(supportService.getTickets());
});

app.post('/api/admin/support/:id/resolve', async (req: Request, res: Response) => {
  const ticket = supportService.resolveTicket(req.params.id, req.body.note);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

  // Notify customer on WhatsApp
  const user = userService.getUserByPhone(ticket.userPhone);
  const isFr = user?.language === 'fr';
  const resolvedMsg = isFr
    ? `✅ **Ticket Résolu (#${ticket.ticketNumber})**\nNotre conseiller client a traité votre demande. N'hésitez pas à nous écrire si vous avez d'autres questions.`
    : `✅ **Support Ticket Resolved (#${ticket.ticketNumber})**\nOur support desk has completed review of your inquiry. Reply anytime if you need further assistance.`;

  await whatsappService.sendTextMessage(ticket.userPhone, resolvedMsg);

  res.json({ success: true, ticket });
});

// Admin: Webhook Logs & Outbox
app.get('/api/admin/logs', (_req: Request, res: Response) => {
  res.json(whatsappService.getLogs());
});

app.get('/api/admin/outbox', (_req: Request, res: Response) => {
  res.json(whatsappService.getOutbox());
});

// Developer Webhook Test Harness: simulates incoming Meta webhook payloads
app.post('/api/dev/simulate-webhook', async (req: Request, res: Response) => {
  const { from = '2348031234567', text } = req.body;
  if (!text) return res.status(400).json({ error: 'Text is required' });

  // Format exactly as Meta WhatsApp Cloud API sends to webhooks
  const metaWebhookPayload = {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '192837465019283',
        changes: [
          {
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '+234 1 800 QUDI',
                phone_number_id: process.env.WHATSAPP_PHONE_NUMBER_ID || '109283746501928',
              },
              contacts: [
                {
                  profile: { name: 'Customer' },
                  wa_id: from,
                },
              ],
              messages: [
                {
                  from,
                  id: `wamid_${Date.now()}`,
                  timestamp: Math.floor(Date.now() / 1000).toString(),
                  text: { body: text },
                  type: 'text',
                },
              ],
            },
            field: 'messages',
          },
        ],
      },
    ],
  };

  // Dispatch through bot engine
  try {
    const result = await botEngine.handleIncomingMessage({
      from,
      text,
      messageId: `wamid_${Date.now()}`,
    });

    whatsappService.logEvent({
      direction: 'INBOUND',
      userPhone: from,
      eventType: 'simulated_webhook_inbound',
      payload: metaWebhookPayload,
      status: 'SUCCESS',
    });

    res.json({
      success: true,
      metaWebhookPayload,
      botResponse: result,
      outbox: whatsappService.getOutbox().slice(0, 1),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Automated Test Runner API
app.get('/api/dev/run-tests', async (_req: Request, res: Response) => {
  try {
    const testResults = await runAutomatedTests();
    res.json(testResults);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. SERVER & FRONTEND SERVING
// ==========================================
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Qudi WhatsApp Bot Engine running on http://0.0.0.0:${PORT}`);
    console.log(`WhatsApp Webhook Endpoint: http://0.0.0.0:${PORT}/webhook`);
    console.log(`WhatsApp Verify Token: ${currentVerifyToken}`);
  });
}

startServer();
