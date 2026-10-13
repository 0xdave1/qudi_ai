import { UserProfile, SupportedLanguage, UserCountry, OnboardingStep } from '../types/bot';

class UserService {
  private users: Map<string, UserProfile> = new Map();

  constructor() {
    // Seed initial users for testing and demonstration
    this.seedUser({
      phone: '2348031234567',
      name: 'Amina Bello',
      language: 'en',
      country: 'NG',
      onboardingStep: 'ACTIVE',
      consentGiven: true,
      isVerified: true,
    });
    this.seedUser({
      phone: '22997458812',
      name: 'David Dossou',
      language: 'fr',
      country: 'BJ',
      onboardingStep: 'ACTIVE',
      consentGiven: true,
      isVerified: true,
    });
  }

  private seedUser(data: Partial<UserProfile> & { phone: string }): void {
    const now = new Date().toISOString();
    this.users.set(data.phone, {
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

  public getUserByPhone(phone: string): UserProfile | undefined {
    return this.users.get(phone);
  }

  public getOrCreateUser(phone: string): { user: UserProfile; isNew: boolean } {
    let user = this.users.get(phone);
    if (!user) {
      const now = new Date().toISOString();
      user = {
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
      this.users.set(phone, user);
      return { user, isNew: true };
    }
    return { user, isNew: false };
  }

  public updateUser(phone: string, updates: Partial<UserProfile>): UserProfile {
    const existing = this.users.get(phone);
    if (!existing) {
      throw new Error(`User with phone ${phone} does not exist`);
    }
    const updated: UserProfile = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.users.set(phone, updated);
    return updated;
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

  public getAllUsers(): UserProfile[] {
    return Array.from(this.users.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }
}

export const userService = new UserService();
