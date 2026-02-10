package com.chronosecure.backend.service.impl;

import com.chronosecure.backend.service.FileStorageService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Base64;
import java.util.UUID;

@Service
@Slf4j
public class FileStorageServiceImpl implements FileStorageService {

    @Value("${file.upload.dir:./uploads}")
    private String uploadDir;

    @Override
    public String uploadFile(MultipartFile file, UUID employeeId, String folder) {
        try {
            // Create directory if it doesn't exist
            Path uploadPath = Paths.get(uploadDir, folder, employeeId.toString());
            Files.createDirectories(uploadPath);

            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".") 
                    ? originalFilename.substring(originalFilename.lastIndexOf(".")) 
                    : ".jpg";
            String filename = UUID.randomUUID().toString() + extension;
            Path filePath = uploadPath.resolve(filename);

            // Save file
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Return relative URL
            String fileUrl = "/uploads/" + folder + "/" + employeeId + "/" + filename;
            log.info("File uploaded successfully: {}", fileUrl);
            return fileUrl;

        } catch (IOException e) {
            log.error("Error uploading file", e);
            throw new RuntimeException("File upload failed", e);
        }
    }

    @Override
    public String uploadBase64Image(String base64Image, UUID employeeId, String folder) {
        try {
            // Remove data URL prefix if present
            String base64Data = base64Image;
            if (base64Image.contains(",")) {
                base64Data = base64Image.split(",")[1];
            }

            // Decode base64
            byte[] imageBytes = Base64.getDecoder().decode(base64Data);

            // Create directory if it doesn't exist
            Path uploadPath = Paths.get(uploadDir, folder, employeeId.toString());
            Files.createDirectories(uploadPath);

            // Generate unique filename
            String filename = UUID.randomUUID().toString() + ".jpg";
            Path filePath = uploadPath.resolve(filename);

            // Save file
            Files.write(filePath, imageBytes);

            // Return relative URL
            String fileUrl = "/uploads/" + folder + "/" + employeeId + "/" + filename;
            log.info("Base64 image uploaded successfully: {}", fileUrl);
            return fileUrl;

        } catch (IOException e) {
            log.error("Error uploading base64 image", e);
            throw new RuntimeException("Image upload failed", e);
        }
    }

    @Override
    public void deleteFile(String fileUrl) {
        try {
            // Remove leading slash if present
            String relativePath = fileUrl.startsWith("/") ? fileUrl.substring(1) : fileUrl;
            Path filePath = Paths.get(uploadDir).resolve(relativePath);
            Files.deleteIfExists(filePath);
            log.info("File deleted: {}", fileUrl);
        } catch (IOException e) {
            log.error("Error deleting file: {}", fileUrl, e);
        }
    }

    @Override
    public byte[] downloadFile(String fileUrl) {
        try {
            // Remove leading slash if present
            String relativePath = fileUrl.startsWith("/") ? fileUrl.substring(1) : fileUrl;
            Path filePath = Paths.get(uploadDir).resolve(relativePath);
            return Files.readAllBytes(filePath);
        } catch (IOException e) {
            log.error("Error downloading file: {}", fileUrl, e);
            throw new RuntimeException("File download failed", e);
        }
    }
}


