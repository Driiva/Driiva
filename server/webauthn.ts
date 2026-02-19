/**
 * WebAuthn server implementation for Face ID/Touch ID authentication
 * Uses @simplewebauthn/server for secure credential management
 */

import { 
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} from '@simplewebauthn/server';
import type {
  GenerateRegistrationOptionsOpts,
  GenerateAuthenticationOptionsOpts,
  VerifyRegistrationResponseOpts,
  VerifyAuthenticationResponseOpts,
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '@simplewebauthn/server';
import { db } from './db';
import { users, webauthnCredentials, type WebauthnCredential } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';

// WebAuthn configuration
const RP_NAME = 'Driiva - Smart Insurance';
const RP_ID = process.env.NODE_ENV === 'production' ? 'driiva.replit.app' : 'localhost';
const ORIGIN = process.env.NODE_ENV === 'production' ? 'https://driiva.replit.app' : 'http://localhost:5000';

// In-memory challenge storage (use Redis in production)
const challengeStore = new Map<string, string>();

export interface WebAuthnService {
  generateRegistrationOptions(username: string): Promise<any>;
  verifyRegistration(username: string, response: RegistrationResponseJSON): Promise<{ verified: boolean; error?: string }>;
  generateAuthenticationOptions(username: string): Promise<any>;
  verifyAuthentication(username: string, response: AuthenticationResponseJSON): Promise<{ verified: boolean; user?: any; error?: string }>;
  getUserCredentials(username: string): Promise<WebauthnCredential[]>;
}

export class SimpleWebAuthnService implements WebAuthnService {
  
  async generateRegistrationOptions(username: string): Promise<any> {
    // Get user from database
    const [user] = await db.select().from(users).where(eq(users.username, username));
    if (!user) {
      throw new Error('User not found');
    }

    // Get existing credentials for this user
    const existingCredentials = await db
      .select()
      .from(webauthnCredentials)
      .where(and(
        eq(webauthnCredentials.userId, user.id),
        eq(webauthnCredentials.isActive, true)
      ));

    const opts: GenerateRegistrationOptionsOpts = {
      rpName: RP_NAME,
      rpID: RP_ID,
      userID: new TextEncoder().encode(user.id.toString()),
      userName: username,
      userDisplayName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || username,
      timeout: 60000,
      attestationType: 'none',
      excludeCredentials: existingCredentials.map(cred => ({
        id: cred.credentialId,
        transports: ['internal' as const],
      })),
      authenticatorSelection: {
        authenticatorAttachment: 'platform', // Force Face ID/Touch ID only
        userVerification: 'required',
        residentKey: 'preferred',
      },
      supportedAlgorithmIDs: [-7, -257], // ES256, RS256
    };

    const options = await generateRegistrationOptions(opts);
    
    // Store challenge for verification
    challengeStore.set(`reg_${username}`, options.challenge);
    
    return options;
  }

  async verifyRegistration(username: string, response: RegistrationResponseJSON): Promise<{ verified: boolean; error?: string }> {
    // Get stored challenge
    const expectedChallenge = challengeStore.get(`reg_${username}`);
    if (!expectedChallenge) {
      return { verified: false, error: 'No challenge found for this registration' };
    }

    // Get user from database
    const [user] = await db.select().from(users).where(eq(users.username, username));
    if (!user) {
      return { verified: false, error: 'User not found' };
    }

    const opts: VerifyRegistrationResponseOpts = {
      response,
      expectedChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      requireUserVerification: true,
    };

    try {
      const verification = await verifyRegistrationResponse(opts);
      
      if (verification.verified && verification.registrationInfo) {
        const { credential } = verification.registrationInfo;
        
        // Store credential in database
        await db.insert(webauthnCredentials).values({
          userId: user.id,
          credentialId: Buffer.from(credential.id).toString('base64url'),
          publicKey: Buffer.from(credential.publicKey).toString('base64url'),
          counter: 0,
          deviceType: 'platform', // Face ID/Touch ID
          deviceName: this.detectDeviceType(response.response.clientDataJSON),
          isActive: true,
        });

        // Clean up challenge
        challengeStore.delete(`reg_${username}`);
        
        return { verified: true };
      }
      
      return { verified: false, error: 'Registration verification failed' };
    } catch (error) {
      console.error('WebAuthn registration verification error:', error);
      return { verified: false, error: 'Registration verification failed' };
    }
  }

  async generateAuthenticationOptions(username: string): Promise<any> {
    // Get user from database
    const [user] = await db.select().from(users).where(eq(users.username, username));
    if (!user) {
      throw new Error('User not found');
    }

    // Get user's active credentials
    const userCredentials = await db
      .select()
      .from(webauthnCredentials)
      .where(and(
        eq(webauthnCredentials.userId, user.id),
        eq(webauthnCredentials.isActive, true)
      ));

    if (userCredentials.length === 0) {
      throw new Error('No biometric credentials found for this user');
    }

    const opts: GenerateAuthenticationOptionsOpts = {
      timeout: 60000,
      allowCredentials: userCredentials.map(cred => ({
        id: cred.credentialId,
        transports: ['internal' as const],
      })),
      userVerification: 'required',
      rpID: RP_ID,
    };

    const options = await generateAuthenticationOptions(opts);
    
    // Store challenge for verification
    challengeStore.set(`auth_${username}`, options.challenge);
    
    return options;
  }

  async verifyAuthentication(username: string, response: AuthenticationResponseJSON): Promise<{ verified: boolean; user?: any; error?: string }> {
    // Get stored challenge
    const expectedChallenge = challengeStore.get(`auth_${username}`);
    if (!expectedChallenge) {
      return { verified: false, error: 'No challenge found for this authentication' };
    }

    // Get user from database
    const [user] = await db.select().from(users).where(eq(users.username, username));
    if (!user) {
      return { verified: false, error: 'User not found' };
    }

    // Get the credential being used
    const [credential] = await db
      .select()
      .from(webauthnCredentials)
      .where(and(
        eq(webauthnCredentials.credentialId, response.id),
        eq(webauthnCredentials.userId, user.id),
        eq(webauthnCredentials.isActive, true)
      ));

    if (!credential) {
      return { verified: false, error: 'Credential not found' };
    }

    const opts: VerifyAuthenticationResponseOpts = {
      response,
      expectedChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      expectedCredentialID: Buffer.from(credential.credentialId, 'base64url'),
      credential: {
        id: credential.credentialId,
        publicKey: Buffer.from(credential.publicKey, 'base64url'),
        counter: credential.counter || 0,
      },
      requireUserVerification: true,
    };

    try {
      const verification = await verifyAuthenticationResponse(opts);
      
      if (verification.verified) {
        // Update counter and last used
        await db
          .update(webauthnCredentials)
          .set({ 
            counter: verification.authenticationInfo.newCounter,
            lastUsed: new Date(),
          })
          .where(eq(webauthnCredentials.id, credential.id));

        // Clean up challenge
        challengeStore.delete(`auth_${username}`);
        
        // Return user data without password
        const { password: _, ...userWithoutPassword } = user;
        return { verified: true, user: userWithoutPassword };
      }
      
      return { verified: false, error: 'Authentication verification failed' };
    } catch (error) {
      console.error('WebAuthn authentication verification error:', error);
      return { verified: false, error: 'Authentication verification failed' };
    }
  }

  async getUserCredentials(username: string): Promise<WebauthnCredential[]> {
    // Get user from database
    const [user] = await db.select().from(users).where(eq(users.username, username));
    if (!user) {
      return [];
    }

    return await db
      .select()
      .from(webauthnCredentials)
      .where(and(
        eq(webauthnCredentials.userId, user.id),
        eq(webauthnCredentials.isActive, true)
      ));
  }

  private detectDeviceType(clientDataJSON: string): string {
    try {
      const clientData = JSON.parse(Buffer.from(clientDataJSON, 'base64url').toString());
      const userAgent = clientData.origin || '';
      
      if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
        return 'Face ID / Touch ID';
      } else if (userAgent.includes('Mac')) {
        return 'Touch ID';
      } else if (userAgent.includes('Android')) {
        return 'Fingerprint / Face Recognition';
      } else {
        return 'Biometric Authentication';
      }
    } catch {
      return 'Unknown Device';
    }
  }
}

export const webauthnService = new SimpleWebAuthnService();