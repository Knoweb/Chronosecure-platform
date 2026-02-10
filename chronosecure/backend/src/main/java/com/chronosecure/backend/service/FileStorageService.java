package com.chronosecure.backend.service;

import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

public interface FileStorageService {
    String uploadFile(MultipartFile file, UUID employeeId, String folder);
    String uploadBase64Image(String base64Image, UUID employeeId, String folder);
    void deleteFile(String fileUrl);
    byte[] downloadFile(String fileUrl);
}






