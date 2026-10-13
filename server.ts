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
import { checkDatabaseHealth, seedDatabaseIfEmpty, getCachedDatabaseStatus } from './server/db/prisma';

dotenv.config({ override: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Enable CORS for all external origins (Meta, browsers, test clients)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Hub-Signature-256');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Parse urlencoded bodies and keep raw body for HMAC signature verification
app.use(express.urlencoded({ extended: true }));
app.use(express.json({
  verify: (req: any, _res, buf) => {
    req.rawBody = buf.toString('utf-8');
  }
}));

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';
let currentVerifyToken = (process.env.WHATSAPP_VERIFY_TOKEN || 'qudi_axra_whatsapp_verify_token_2026').replace(/^["']|["']$/g, '').trim();

// ==========================================
// 1. REAL WHATSAPP CLOUD API WEBHOOK ENDPOINTS
// ==========================================

const WEBHOOK_PATHS = ['/webhook', '/webhook/', '/api/webhook', '/api/webhook/'];

// OPTIONS pre-flight
app.options(WEBHOOK_PATHS, (_req: Request, res: Response) => {
  res.sendStatus(200);
});

/**
 * Meta Webhook Verification Handshake
 * Triggered when developer enters Callback URL in Meta Developer Dashboard
 */
app.get(WEBHOOK_PATHS, (req: Request, res: Response) => {
  // Helper to extract parameter across different naming conventions
  const extractQueryParam = (...keys: string[]): string | undefined => {
    for (const key of keys) {
      const val = req.query[key] ?? (req.query as any)?.hub?.[key.replace('hub.', '')];
      if (val !== undefined && val !== null) {
        const str = Array.isArray(val) ? String(val[0]) : String(val);
        return str.replace(/^["']|["']$/g, '').trim();
      }
    }
    return undefined;
  };

  const mode = extractQueryParam('hub.mode', 'hub_mode', 'mode');
  const token = extractQueryParam('hub.verify_token', 'hub_verify_token', 'verify_token');
  const challenge = extractQueryParam('hub.challenge', 'hub_challenge', 'challenge');

  // Browser check fallback for developers testing the endpoint directly in a browser
  if (!mode && !token && !challenge) {
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
    const proto = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
    const currentOrigin = `${proto}://${host}`;
    return res.status(200).json({
      status: 'ONLINE',
      endpoint: '/webhook',
      message: 'Meta WhatsApp Cloud API Webhook endpoint is active and unauthenticated public-access ready.',
      activeVerifyToken: currentVerifyToken,
      suggestedCallbackUrl: `${currentOrigin}/webhook`,
      publicSharedCallbackUrl: 'https://ais-pre-pclekuvfazg27rxlkjk4es-482451006325.europe-west3.run.app/webhook',
      metaVerificationDoc: 'Enter the Callback URL and Verify Token in Meta Developer Console -> WhatsApp -> Configuration -> Webhook.',
      testUrl: `${currentOrigin}/webhook?hub.mode=subscribe&hub.verify_token=${currentVerifyToken}&hub.challenge=1158201244`
    });
  }

  const expectedToken = (process.env.WHATSAPP_VERIFY_TOKEN || currentVerifyToken || 'qudi_axra_whatsapp_verify_token_2026').replace(/^["']|["']$/g, '').trim();
  
  const acceptableTokens = new Set([
    expectedToken,
    currentVerifyToken,
    'qudi_axra_whatsapp_verify_token_2026',
    'qudi_verify_2026_token',
  ]);

  const isMatch = Boolean(token && acceptableTokens.has(token.trim()));

  whatsappService.logEvent({
    direction: 'INBOUND',
    eventType: 'webhook_verification_handshake',
    payload: { query: req.query, parsed: { mode, token, challenge, isMatch } },
    status: isMatch ? 'SUCCESS' : 'ERROR',
  });

  if (mode?.toLowerCase() === 'subscribe' && isMatch && challenge !== undefined) {
    console.log('[WhatsApp Webhook] Handshake verified successfully with Meta. Echoing challenge:', challenge);
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.status(200).send(String(challenge));
  }

  console.warn('[WhatsApp Webhook] Verification token mismatch or invalid mode.', {
    expected: expectedToken,
    receivedToken: token,
    receivedMode: mode,
  });
  return res.sendStatus(403);
});

app.post(WEBHOOK_PATHS, async (req: Request, res: Response) => {
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
app.get('/api/status', async (req: Request, res: Response) => {
  const config = whatsappService.getConfigurationStatus();
  const dbStatus = getCachedDatabaseStatus();
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
  const proto = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
  const detectedOrigin = `${proto}://${host}`;

  const publicSharedUrl = 'https://ais-pre-pclekuvfazg27rxlkjk4es-482451006325.europe-west3.run.app';
  const devWorkspaceUrl = 'https://ais-dev-pclekuvfazg27rxlkjk4es-482451006325.europe-west3.run.app';

  res.json({
    appName: 'Qudi WhatsApp AI Banking Bot',
    appUrl: detectedOrigin,
    publicAppUrl: publicSharedUrl,
    devAppUrl: devWorkspaceUrl,
    webhookCallbackUrl: `${publicSharedUrl}/webhook`,
    publicWebhookCallbackUrl: `${publicSharedUrl}/webhook`,
    devWebhookCallbackUrl: `${devWorkspaceUrl}/webhook`,
    verifyToken: currentVerifyToken,
    whatsappConfig: config,
    geminiAiConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 5),
    mode: config.isConfigured ? 'LIVE_WHATSAPP_CLOUD_API' : 'DEVELOPMENT_ADAPTER',
    database: dbStatus,
  });
});

// Database Health & Telemetry
app.get('/api/db/status', async (_req: Request, res: Response) => {
  const status = await checkDatabaseHealth();
  res.json(status);
});

// Seed or Re-sync Database
app.post('/api/db/seed', async (_req: Request, res: Response) => {
  try {
    await seedDatabaseIfEmpty();
    const status = await checkDatabaseHealth();
    res.json({ success: true, message: 'Database tables verified and seeded', status });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
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
app.get('/api/admin/metrics', async (_req: Request, res: Response) => {
  const users = await userService.getAllUsersAsync();
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
    database: getCachedDatabaseStatus(),
  });
});

// Admin: Users List
app.get('/api/admin/users', async (_req: Request, res: Response) => {
  const users = await userService.getAllUsersAsync();
  res.json(users);
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
  // Check Neon PostgreSQL database connection
  try {
    const dbStatus = await checkDatabaseHealth();
    if (dbStatus.isConnected) {
      console.log(`[Neon PostgreSQL] Connected successfully to host: ${dbStatus.host} (${dbStatus.isPooled ? 'Pooled' : 'Direct'})`);
      await seedDatabaseIfEmpty();
    } else {
      console.log('[Neon PostgreSQL] Database status:', dbStatus.error || 'DATABASE_URL not configured. Running in safe fallback mode.');
    }
  } catch (err: any) {
    console.warn('[Database Startup Notice]:', err.message);
  }

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
