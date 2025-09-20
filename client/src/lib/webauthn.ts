/**
 * WebAuthn utilities for Face ID, Touch ID, and biometric authentication
 * Provides secure passwordless authentication using device biometrics
 */

// Utility functions for base64url encoding/decoding
export function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const base64 = btoa(String.fromCharCode(...Array.from(bytes)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export function base64UrlToArrayBuffer(base64url: string): ArrayBuffer {
  const padding = '='.repeat((4 - base64url.length % 4) % 4);
  const base64 = (base64url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return new Uint8Array(Array.from(rawData).map(char => char.charCodeAt(0))).buffer;
}

// Check if WebAuthn and biometric authentication is supported
export async function checkBiometricSupport(): Promise<{
  supported: boolean;
  platformAuthenticator: boolean;
  error?: string;
}> {
  if (!window.PublicKeyCredential) {
    return {
      supported: false,
      platformAuthenticator: false,
      error: 'WebAuthn not supported by this browser'
    };
  }

  try {
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return {
      supported: true,
      platformAuthenticator: available,
      error: available ? undefined : 'Face ID/Touch ID not available on this device'
    };
  } catch (error) {
    return {
      supported: true,
      platformAuthenticator: false,
      error: 'Could not verify biometric support'
    };
  }
}

// Register a new WebAuthn credential (Face ID/Touch ID)
export async function registerBiometricCredential(username: string): Promise<{
  success: boolean;
  credential?: any;
  error?: string;
}> {
  try {
    // Get registration options from server
    const response = await fetch('/api/auth/webauthn/register/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to start registration');
    }

    const options = await response.json();

    // Convert base64 strings to ArrayBuffer
    options.publicKey.challenge = base64UrlToArrayBuffer(options.publicKey.challenge);
    options.publicKey.user.id = base64UrlToArrayBuffer(options.publicKey.user.id);

    // Create credential with biometric authentication
    const credential = await navigator.credentials.create(options);

    if (!credential) {
      throw new Error('Failed to create credential');
    }

    // Send credential to server for verification
    const verificationResponse = await fetch('/api/auth/webauthn/register/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        credential: {
          id: credential.id,
          rawId: arrayBufferToBase64Url((credential as any).rawId),
          response: {
            clientDataJSON: arrayBufferToBase64Url((credential as any).response.clientDataJSON),
            attestationObject: arrayBufferToBase64Url((credential as any).response.attestationObject)
          },
          type: credential.type
        }
      })
    });

    if (!verificationResponse.ok) {
      const error = await verificationResponse.json();
      throw new Error(error.message || 'Failed to verify credential');
    }

    return { success: true, credential };

  } catch (error: any) {
    console.error('Biometric registration error:', error);
    return {
      success: false,
      error: error.message || 'Failed to register biometric authentication'
    };
  }
}

// Authenticate using WebAuthn (Face ID/Touch ID)
export async function authenticateWithBiometrics(username: string): Promise<{
  success: boolean;
  user?: any;
  error?: string;
}> {
  try {
    // Get authentication options from server
    const response = await fetch('/api/auth/webauthn/authenticate/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to start authentication');
    }

    const options = await response.json();

    // Convert challenge and credential IDs
    options.publicKey.challenge = base64UrlToArrayBuffer(options.publicKey.challenge);
    options.publicKey.allowCredentials = options.publicKey.allowCredentials.map((cred: any) => ({
      ...cred,
      id: base64UrlToArrayBuffer(cred.id)
    }));

    // Get assertion using biometric authentication
    const assertion = await navigator.credentials.get(options);

    if (!assertion) {
      throw new Error('Failed to get assertion');
    }

    // Send assertion to server for verification
    const verificationResponse = await fetch('/api/auth/webauthn/authenticate/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        assertion: {
          id: assertion.id,
          rawId: arrayBufferToBase64Url((assertion as any).rawId),
          response: {
            authenticatorData: arrayBufferToBase64Url((assertion as any).response.authenticatorData),
            clientDataJSON: arrayBufferToBase64Url((assertion as any).response.clientDataJSON),
            signature: arrayBufferToBase64Url((assertion as any).response.signature),
            userHandle: (assertion as any).response.userHandle ? 
              arrayBufferToBase64Url((assertion as any).response.userHandle) : null
          },
          type: assertion.type
        }
      })
    });

    if (!verificationResponse.ok) {
      const error = await verificationResponse.json();
      throw new Error(error.message || 'Failed to verify assertion');
    }

    const result = await verificationResponse.json();
    return { success: true, user: result.user };

  } catch (error: any) {
    console.error('Biometric authentication error:', error);
    return {
      success: false,
      error: error.message || 'Failed to authenticate with biometrics'
    };
  }
}

// Get user's registered credentials
export async function getUserCredentials(username: string): Promise<{
  hasCredentials: boolean;
  credentials?: Array<{
    id: string;
    createdAt: string;
  }>;
  error?: string;
}> {
  try {
    const response = await fetch(`/api/auth/webauthn/credentials/${username}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch credentials');
    }

    const data = await response.json();
    return {
      hasCredentials: data.credentials.length > 0,
      credentials: data.credentials
    };

  } catch (error: any) {
    console.error('Error fetching credentials:', error);
    return {
      hasCredentials: false,
      error: error.message || 'Failed to fetch credentials'
    };
  }
}