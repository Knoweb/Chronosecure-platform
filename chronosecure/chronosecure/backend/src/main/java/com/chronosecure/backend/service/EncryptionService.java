package com.chronosecure.backend.service;

/**
 * Encryption Service for Biometric Data
 * BIPA Compliance: Encrypts fingerprint template hashes at rest
 */
public interface EncryptionService {
    String encrypt(String plainText);
    String decrypt(String encryptedText);
}






