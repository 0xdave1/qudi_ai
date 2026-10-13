import { UserProfile, SupportedLanguage, UserCountry, OnboardingStep } from '../types/bot';
import { getPrisma } from '../db/prisma';
import { walletService } from './walletService';

class UserService {
  private fallbackUsers: Map<string, UserProfile> = new Map();

  constructor() {
    this.seedFallbackUser({
      phone: '2348031234567',
      name: 'Amina Bello',
      language: 'en',
      country: 'NG',
      onboardingStep: 'ACTIVE',
      consentGiven: true,
      isVerified: true,
    });
    this.seedFallbackUser({
      phone: '22997458812',
      name: 'David Dossou',
      language: 'fr',
      country: 'BJ',
      onboardingStep: 'ACTIVE',
      consentGiven: true,
      isVerified: true,
    });
  }

  private seedFallbackUser(data: Partial<UserProfile> & { phone: string }): void {
    const now = new Date().toISOString();
    this.fallbackUsers.set(data.phone, {
      id: `usr_${data.phone}`,
      phone: data.phone,
      name: data.name || '',
      language: data.language || 'en',
      country: data.country || 'NG',
      onboardingStep: data.onboardingStep || 'ACTIVE',
      consentGiven: data.consentGiven ?? true,
      isVerified: data.isVerified ?? false,
      createdAt: now,
      updatedAt: now,
    });
  }

  public async getUserByPhoneAsync(phone: string): Promise<UserProfile | undefined> {
    const prisma = getPrisma();
    if (prisma) {
      try {
        const u = await prisma.user.findUnique({
          where: { whatsappPhone: phone },
        });
        if (u) {
          const profile: UserProfile = {
            id: u.id,
            phone: u.whatsappPhone,
            name: u.fullName || '',
            language: (u.preferredLanguage as SupportedLanguage) || 'en',
            country: (u.country as UserCountry) || 'NG',
            onboardingStep: (u.onboardingStep as OnboardingStep) || 'ACTIVE',
            consentGiven: u.consentGiven,
            isVerified: u.isVerified,
            createdAt: u.createdAt.toISOString(),
            updatedAt: u.updatedAt.toISOString(),
          };
          this.fallbackUsers.set(phone, profile);
          return profile;
        }
      } catch (err: any) {
        console.warn('[UserService Prisma getUserByPhone Error]:', err.message);
      }
    }
    return this.fallbackUsers.get(phone);
  }

  public getUserByPhone(phone: string): UserProfile | undefined {
    // Immediate return from cache
    return this.fallbackUsers.get(phone);
  }

  public async getOrCreateUserAsync(phone: string): Promise<{ user: UserProfile; isNew: boolean }> {
    const prisma = getPrisma();
    if (prisma) {
      try {
        let u = await prisma.user.findUnique({
          where: { whatsappPhone: phone },
        });
        if (u) {
          const profile: UserProfile = {
            id: u.id,
            phone: u.whatsappPhone,
            name: u.fullName || '',
            language: (u.preferredLanguage as SupportedLanguage) || 'en',
            country: (u.country as UserCountry) || 'NG',
            onboardingStep: (u.onboardingStep as OnboardingStep) || 'ACTIVE',
            consentGiven: u.consentGiven,
            isVerified: u.isVerified,
            createdAt: u.createdAt.toISOString(),
            updatedAt: u.updatedAt.toISOString(),
          };
          this.fallbackUsers.set(phone, profile);
          return { user: profile, isNew: false };
        }

        // Create new user in Neon PostgreSQL or handle race condition
        let isNew = false;
        let userRecord;
        try {
          userRecord = await prisma.user.create({
            data: {
              whatsappPhone: phone,
              fullName: '',
              preferredLanguage: 'en',
              country: 'NG',
              onboardingStep: 'AWAITING_LANGUAGE',
              consentGiven: false,
              isVerified: false,
              accountStatus: 'ACTIVE',
              kycStatus: 'TIER_1',
            },
          });
          isNew = true;
          await walletService.createDefaultWallets(userRecord.id, 'NG').catch(() => {});
        } catch (createErr: any) {
          if (createErr.code === 'P2002' || createErr.message?.includes('Unique constraint')) {
            userRecord = await prisma.user.findUnique({ where: { whatsappPhone: phone } });
          } else {
            throw createErr;
          }
        }

        if (userRecord) {
          const profile: UserProfile = {
            id: userRecord.id,
            phone: userRecord.whatsappPhone,
            name: userRecord.fullName || '',
            language: (userRecord.preferredLanguage as SupportedLanguage) || 'en',
            country: (userRecord.country as UserCountry) || 'NG',
            onboardingStep: (userRecord.onboardingStep as OnboardingStep) || 'AWAITING_LANGUAGE',
            consentGiven: userRecord.consentGiven,
            isVerified: userRecord.isVerified,
            createdAt: userRecord.createdAt.toISOString(),
            updatedAt: userRecord.updatedAt.toISOString(),
          };
          this.fallbackUsers.set(phone, profile);
          return { user: profile, isNew };
        }
      } catch (err: any) {
        console.warn('[UserService Prisma getOrCreateUser Notice]:', err.message);
      }
    }

    // Fallback in-memory
    let user = this.fallbackUsers.get(phone);
    if (!user) {
      const now = new Date().toISOString();
      user = {
        id: `usr_${Date.now()}`,
        phone,
        name: '',
        language: 'en',
        country: 'NG',
        onboardingStep: 'AWAITING_LANGUAGE',
        consentGiven: false,
        isVerified: false,
        createdAt: now,
        updatedAt: now,
      };
      this.fallbackUsers.set(phone, user);
      if (user.id) {
        walletService.createDefaultWallets(user.id, 'NG').catch(() => {});
      }
      return { user, isNew: true };
    }
    return { user, isNew: false };
  }

  public getOrCreateUser(phone: string): { user: UserProfile; isNew: boolean } {
    const existing = this.fallbackUsers.get(phone);
    if (existing) {
      return { user: existing, isNew: false };
    }

    const now = new Date().toISOString();
    const newUser: UserProfile = {
      id: `usr_${Date.now()}`,
      phone,
      name: '',
      language: 'en',
      country: 'NG',
      onboardingStep: 'AWAITING_LANGUAGE',
      consentGiven: false,
      isVerified: false,
      createdAt: now,
      updatedAt: now,
    };
    this.fallbackUsers.set(phone, newUser);

    // Asynchronously write to Neon PostgreSQL
    this.getOrCreateUserAsync(phone).catch(() => {});

    return { user: newUser, isNew: true };
  }

  public async updateUserAsync(phone: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const existing = this.fallbackUsers.get(phone);
    const now = new Date().toISOString();
    const updated: UserProfile = {
      ...(existing || {
        id: `usr_${phone}`,
        phone,
        name: '',
        language: 'en',
        country: 'NG',
        onboardingStep: 'ACTIVE',
        consentGiven: true,
        isVerified: false,
        createdAt: now,
        updatedAt: now,
      }),
      ...updates,
      updatedAt: now,
    };
    this.fallbackUsers.set(phone, updated);

    const prisma = getPrisma();
    if (prisma) {
      try {
        const dbUpdates: any = {};
        if (updates.name !== undefined) dbUpdates.fullName = updates.name;
        if (updates.language !== undefined) dbUpdates.preferredLanguage = updates.language;
        if (updates.country !== undefined) dbUpdates.country = updates.country;
        if (updates.onboardingStep !== undefined) dbUpdates.onboardingStep = updates.onboardingStep;
        if (updates.consentGiven !== undefined) dbUpdates.consentGiven = updates.consentGiven;
        if (updates.isVerified !== undefined) dbUpdates.isVerified = updates.isVerified;

        await prisma.user.upsert({
          where: { whatsappPhone: phone },
          update: dbUpdates,
          create: {
            whatsappPhone: phone,
            fullName: updates.name || '',
            preferredLanguage: updates.language || 'en',
            country: updates.country || 'NG',
            onboardingStep: updates.onboardingStep || 'ACTIVE',
            consentGiven: updates.consentGiven ?? true,
            isVerified: updates.isVerified ?? false,
          },
        });
      } catch (err: any) {
        console.warn('[UserService Prisma updateUser Error]:', err.message);
      }
    }

    return updated;
  }

  public updateUser(phone: string, updates: Partial<UserProfile>): UserProfile {
    const updated = {
      ...(this.fallbackUsers.get(phone) || {
        id: `usr_${phone}`,
        phone,
        name: '',
        language: 'en',
        country: 'NG',
        onboardingStep: 'ACTIVE',
        consentGiven: true,
        isVerified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.fallbackUsers.set(phone, updated as UserProfile);

    // Asynchronously persist to Neon PostgreSQL
    this.updateUserAsync(phone, updates).catch(() => {});

    return updated as UserProfile;
  }

  public updateUserProfile(phone: string, updates: Partial<UserProfile>): UserProfile {
    return this.updateUser(phone, updates);
  }

  public setLanguage(phone: string, language: SupportedLanguage): UserProfile {
    return this.updateUser(phone, { language });
  }

  public setCountry(phone: string, country: UserCountry): UserProfile {
    return this.updateUser(phone, { country });
  }

  public setOnboardingStep(phone: string, step: OnboardingStep): UserProfile {
    return this.updateUser(phone, { onboardingStep: step });
  }

  public async getAllUsersAsync(): Promise<UserProfile[]> {
    const prisma = getPrisma();
    if (prisma) {
      try {
        const users = await prisma.user.findMany({
          orderBy: { updatedAt: 'desc' },
        });
        if (users.length > 0) {
          return users.map((u) => ({
            id: u.id,
            phone: u.whatsappPhone,
            name: u.fullName || '',
            language: (u.preferredLanguage as SupportedLanguage) || 'en',
            country: (u.country as UserCountry) || 'NG',
            onboardingStep: (u.onboardingStep as OnboardingStep) || 'ACTIVE',
            consentGiven: u.consentGiven,
            isVerified: u.isVerified,
            createdAt: u.createdAt.toISOString(),
            updatedAt: u.updatedAt.toISOString(),
          }));
        }
      } catch (err: any) {
        console.warn('[UserService Prisma getAllUsers Error]:', err.message);
      }
    }
    return this.getAllUsers();
  }

  public getAllUsers(): UserProfile[] {
    return Array.from(this.fallbackUsers.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }
}

export const userService = new UserService();
