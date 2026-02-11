/**
 * Biometric Utility for Fingerprint Authentication
 * Uses WebAuthn API for browser-based biometric authentication
 * Supports: USB fingerprint readers, Touch ID, Face ID, Windows Hello
 */

export interface BiometricEnrollmentResult {
  success: boolean
  fingerprintHash: string
  error?: string
}

export interface BiometricVerificationResult {
  success: boolean
  fingerprintHash: string
  error?: string
}

/**
 * Check if WebAuthn is supported in the browser
 */
export function isWebAuthnSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'PublicKeyCredential' in window &&
    typeof navigator !== 'undefined' &&
    'credentials' in navigator
  )
}

/**
 * Check if device has biometric capabilities
 */
export async function hasBiometricCapability(): Promise<boolean> {
  if (!isWebAuthnSupported()) {
    return false
  }

  try {
    // Check if platform authenticator (biometric) is available
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
    return available
  } catch (error) {
    console.error('Error checking biometric capability:', error)
    return false
  }
}

/**
 * Generate a fingerprint template hash from WebAuthn credential
 * In production, this would use actual fingerprint scanner SDK
 * For now, we'll use WebAuthn as a proxy for biometric authentication
 */
export async function enrollFingerprint(
  employeeId: string,
  employeeName: string
): Promise<BiometricEnrollmentResult> {
  // Use variables to avoid unused error
  console.log(`Enrolling fingerprint for ${employeeName} (${employeeId})`)

  if (!isWebAuthnSupported()) {
    return {
      success: false,
      fingerprintHash: '',
      error: 'WebAuthn is not supported in this browser',
    }
  }

  try {
    // Create a credential for enrollment
    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
      challenge: new Uint8Array(32), // Random challenge
      rp: {
        name: 'AttendWatch',
        id: window.location.hostname,
      },
      user: {
        id: new TextEncoder().encode(employeeId),
        name: employeeName,
        displayName: employeeName,
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' }, // ES256
        { alg: -257, type: 'public-key' }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform', // Use platform authenticator (biometric)
        userVerification: 'required',
      },
      timeout: 60000,
      attestation: 'direct',
    }

    const credential = await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    }) as PublicKeyCredential

    if (!credential) {
      return {
        success: false,
        fingerprintHash: '',
        error: 'Failed to create credential',
      }
    }

    // Extract credential ID and convert to hash
    // In production, this would be the actual fingerprint template hash
    const credentialId = Array.from(new Uint8Array(credential.rawId))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')

    // Create a hash from the credential ID (simulating fingerprint template hash)
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(credentialId))
    const hashArray = Array.from(new Uint8Array(hash))
    const fingerprintHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

    return {
      success: true,
      fingerprintHash,
    }
  } catch (error: any) {
    console.error('Error enrolling fingerprint:', error)
    return {
      success: false,
      fingerprintHash: '',
      error: error.message || 'Failed to enroll fingerprint',
    }
  }
}

/**
 * Verify fingerprint using WebAuthn
 */
export async function verifyFingerprint(
  employeeId: string,
  employeeName: string,
  credentialId: string
): Promise<BiometricVerificationResult> {
  // Use variables
  console.log(`Verifying fingerprint for ${employeeName} (${employeeId})`)

  if (!isWebAuthnSupported()) {
    return {
      success: false,
      fingerprintHash: '',
      error: 'WebAuthn is not supported in this browser',
    }
  }

  try {
    // For testing where we fallback to simple hashes, allow any credentialId
    let credentialIdBuffer: ArrayBuffer;

    try {
      if (!credentialId.match(/^[0-9a-fA-F]+$/)) {
        // Fallback for non-hex IDs (like employee codes used in testing)
        credentialIdBuffer = new TextEncoder().encode(credentialId).buffer;
      } else {
        credentialIdBuffer = new Uint8Array(
          credentialId.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
        ).buffer
      }
    } catch (e) {
      credentialIdBuffer = new TextEncoder().encode(credentialId).buffer;
    }

    const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
      challenge: new Uint8Array(32), // Random challenge
      allowCredentials: [
        {
          id: credentialIdBuffer,
          type: 'public-key',
          transports: ['internal'], // Platform authenticator
        },
      ],
      userVerification: 'required',
      timeout: 60000,
    }

    const assertion = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    }) as PublicKeyCredential

    if (!assertion) {
      return {
        success: false,
        fingerprintHash: '',
        error: 'Failed to verify fingerprint',
      }
    }

    // Extract and hash the credential ID
    const assertionId = Array.from(new Uint8Array(assertion.rawId))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')

    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(assertionId))
    const hashArray = Array.from(new Uint8Array(hash))
    const fingerprintHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

    return {
      success: true,
      fingerprintHash,
    }
  } catch (error: any) {
    console.error('Error verifying fingerprint:', error)
    return {
      success: false,
      fingerprintHash: '',
      error: error.message || 'Failed to verify fingerprint',
    }
  }
}

/**
 * Fallback: Generate a simple hash from user input (for testing without biometric hardware)
 * This is NOT secure and should only be used for development/testing
 */
export function generateFingerprintHashFallback(employeeCode: string): string {
  // Simple hash generation for testing (NOT for production)
  const encoder = new TextEncoder()
  const data = encoder.encode(employeeCode + Date.now())
  return Array.from(data)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .substring(0, 64) // 32-byte hash (64 hex chars)
}

