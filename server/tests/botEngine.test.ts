import { botEngine } from '../services/botEngine';
import { rateService } from '../services/rateService';
import { transactionService } from '../services/transactionService';
import { userService } from '../services/userService';
import { supportService } from '../services/supportService';

/**
 * Qudi WhatsApp AI Banking Bot Automated Test Suite
 * Validates conversational flows, onboarding states, rate quotes, and transaction state machines.
 */
export async function runAutomatedTests(): Promise<{
  passed: number;
  failed: number;
  results: Array<{ testName: string; passed: boolean; message?: string }>;
}> {
  const results: Array<{ testName: string; passed: boolean; message?: string }> = [];

  const assert = (condition: boolean, testName: string, detail?: string) => {
    if (condition) {
      results.push({ testName, passed: true });
    } else {
      results.push({ testName, passed: false, message: detail || 'Assertion failed' });
    }
  };

  // TEST 1: Rate calculation logic
  try {
    const quoteRes = rateService.calculateQuote({
      userPhone: 'test_phone_1',
      fromCurrency: 'XOF',
      toCurrency: 'NGN',
      amount: 100000,
    });
    assert(
      quoteRes.success === true && quoteRes.quote !== undefined,
      'RateService: Calculates valid quote for 100,000 XOF'
    );
    assert(
      (quoteRes.quote?.toAmount || 0) > 200000,
      'RateService: 100,000 XOF yields expected NGN payout (> ₦200,000)'
    );
    assert(
      quoteRes.quote?.status === 'PENDING',
      'RateService: New quote status is PENDING'
    );
  } catch (e: any) {
    assert(false, 'RateService: Calculation exception', e.message);
  }

  // TEST 2: Threshold limits (Min/Max)
  try {
    const belowMin = rateService.calculateQuote({
      userPhone: 'test_phone_1',
      fromCurrency: 'NGN',
      toCurrency: 'XOF',
      amount: 500, // below 5000 NGN
    });
    assert(
      belowMin.success === false,
      'RateService: Rejects transaction below minimum limit'
    );
  } catch (e: any) {
    assert(false, 'RateService: Min limit test exception', e.message);
  }

  // TEST 3: Onboarding state machine progression (English)
  try {
    const testPhoneEn = `test_en_${Date.now()}`;
    // Step 0 -> Awaiting language
    const step0 = await botEngine.handleIncomingMessage({ from: testPhoneEn, text: 'Hello' });
    assert(
      step0.handledIntent === 'ONBOARDING_LANGUAGE',
      'BotEngine: New user receives language selection prompt'
    );

    // Step 1 -> Select English
    const step1 = await botEngine.handleIncomingMessage({ from: testPhoneEn, text: '1' });
    assert(
      step1.handledIntent === 'ONBOARDING_NAME',
      'BotEngine: Selecting 1 sets language to English and asks for Name'
    );

    // Step 2 -> Provide Name
    const step2 = await botEngine.handleIncomingMessage({ from: testPhoneEn, text: 'Emeka Nwosu' });
    assert(
      step2.handledIntent === 'ONBOARDING_COUNTRY',
      'BotEngine: Providing Name triggers Country selection'
    );

    // Step 3 -> Select Nigeria
    const step3 = await botEngine.handleIncomingMessage({ from: testPhoneEn, text: '1' });
    assert(
      step3.handledIntent === 'ONBOARDING_CONSENT',
      'BotEngine: Selecting Country triggers Regulatory Consent notice'
    );

    // Step 4 -> Accept Consent
    const step4 = await botEngine.handleIncomingMessage({ from: testPhoneEn, text: 'Yes, I accept' });
    assert(
      step4.handledIntent === 'ONBOARDING_COMPLETE',
      'BotEngine: Accepting consent activates user account'
    );

    const createdUser = userService.getUserByPhone(testPhoneEn);
    assert(
      createdUser?.onboardingStep === 'ACTIVE' && createdUser.language === 'en',
      'UserService: User record marked ACTIVE with English preference'
    );
  } catch (e: any) {
    assert(false, 'BotEngine: Onboarding English test exception', e.message);
  }

  // TEST 4: Onboarding state machine progression (French)
  try {
    const testPhoneFr = `test_fr_${Date.now()}`;
    // Step 0 -> Prompt
    await botEngine.handleIncomingMessage({ from: testPhoneFr, text: 'Bonjour' });
    // Step 1 -> Select French
    const step1Fr = await botEngine.handleIncomingMessage({ from: testPhoneFr, text: '2' });
    assert(
      step1Fr.handledIntent === 'ONBOARDING_NAME' && step1Fr.replyText.includes('Français sélectionné'),
      'BotEngine: Selecting 2 sets French and prompts in French'
    );

    // Step 2 -> Name
    await botEngine.handleIncomingMessage({ from: testPhoneFr, text: 'Koffi Mensah' });
    // Step 3 -> Benin Republic
    await botEngine.handleIncomingMessage({ from: testPhoneFr, text: '2' });
    // Step 4 -> Accept consent
    const step4Fr = await botEngine.handleIncomingMessage({ from: testPhoneFr, text: '1' });
    assert(
      step4Fr.handledIntent === 'ONBOARDING_COMPLETE' && step4Fr.replyText.includes('Bienvenue sur Qudi'),
      'BotEngine: Completes French onboarding with French welcome message'
    );
  } catch (e: any) {
    assert(false, 'BotEngine: Onboarding French test exception', e.message);
  }

  // TEST 5: Active user exchange quote & confirmation workflow
  try {
    const activePhone = '2348031234567'; // Pre-seeded active user
    const quoteMsg = await botEngine.handleIncomingMessage({
      from: activePhone,
      text: 'Convert 100,000 CFA to Naira',
    });
    assert(
      quoteMsg.handledIntent === 'REQUEST_QUOTE',
      'BotEngine: Correctly generates exchange quote from natural language request'
    );

    // Confirm quote
    const confirmMsg = await botEngine.handleIncomingMessage({
      from: activePhone,
      text: 'Confirm',
    });
    assert(
      confirmMsg.handledIntent === 'TRANSACTION_CREATED',
      'BotEngine: Confirming quote creates transaction with payment instructions'
    );

    // Submit payment proof
    const proofMsg = await botEngine.handleIncomingMessage({
      from: activePhone,
      text: 'Payment sent via bank transfer',
    });
    assert(
      proofMsg.handledIntent === 'PAYMENT_PROOF_SUBMITTED',
      'BotEngine: Submitting payment proof updates status to PAYMENT_VERIFICATION'
    );
  } catch (e: any) {
    assert(false, 'BotEngine: Active exchange quote test exception', e.message);
  }

  // TEST 6: Customer support trigger & ticket generation
  try {
    const supportPhone = '2348031234567';
    const supportMsg = await botEngine.handleIncomingMessage({
      from: supportPhone,
      text: 'I have a dispute with my transfer, need human help',
    });
    assert(
      supportMsg.handledIntent === 'CUSTOMER_SUPPORT',
      'BotEngine: Recognizes human support and dispute intent'
    );
    const tickets = supportService.getTickets();
    assert(
      tickets.length > 0 && tickets[0].userPhone === supportPhone,
      'SupportService: Creates registered support ticket in ops queue'
    );
  } catch (e: any) {
    assert(false, 'BotEngine: Customer support test exception', e.message);
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  return { passed, failed, results };
}
