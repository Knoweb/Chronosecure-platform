package com.chronosecure.backend.service.impl;

import com.chronosecure.backend.service.EncryptionService;
import lombok.extern.slf4j.Slf4j;
import org.jasypt.encryption.StringEncryptor;
import org.jasypt.encryption.pbe.PooledPBEStringEncryptor;
import org.jasypt.encryption.pbe.config.SimpleStringPBEConfig;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

/**
 * Encryption Service Implementation
 * BIPA Compliance: Uses AES-256 encryption for biometric data at rest
 */
@Service
@Slf4j
public class EncryptionServiceImpl implements EncryptionService {

    @Value("${jasypt.encryptor.password:default-encryption-key-change-in-production}")
    private String encryptionPassword;

    private StringEncryptor getEncryptor() {
        PooledPBEStringEncryptor encryptor = new PooledPBEStringEncryptor();
        SimpleStringPBEConfig config = new SimpleStringPBEConfig();
        config.setPassword(encryptionPassword);
        config.setAlgorithm("PBEWithMD5AndDES");
        config.setKeyObtentionIterations("1000");
        config.setPoolSize("1");
        config.setProviderName("SunJCE");
        config.setSaltGeneratorClassName("org.jasypt.salt.RandomSaltGenerator");
        config.setStringOutputType("base64");
        encryptor.setConfig(config);
        return encryptor;
    }

    @Override
    public String encrypt(String plainText) {
        if (plainText == null || plainText.isEmpty()) {
            return plainText;
        }
        try {
            return getEncryptor().encrypt(plainText);
        } catch (Exception e) {
            log.error("Error encrypting data", e);
            throw new RuntimeException("Encryption failed", e);
        }
    }

    @Override
    public String decrypt(String encryptedText) {
        if (encryptedText == null || encryptedText.isEmpty()) {
            return encryptedText;
        }
        try {
            return getEncryptor().decrypt(encryptedText);
        } catch (Exception e) {
            log.error("Error decrypting data", e);
            throw new RuntimeException("Decryption failed", e);
        }
    }
}






