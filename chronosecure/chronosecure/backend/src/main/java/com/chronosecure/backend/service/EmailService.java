package com.chronosecure.backend.service;

import com.chronosecure.backend.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public void sendPasswordResetEmail(User user, String token) {
        // Updated port to 5174 based on metadata
        String resetUrl = "http://localhost:5174/reset-password?token=" + token;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(user.getEmail());
        message.setSubject("Password Reset Request - ChronoSecure");
        message.setText("Click the link below to reset your password:\n" + resetUrl +
                "\n\nIf you did not request a password reset, please ignore this email.\n" +
                "This link will expire in 24 hours.");

        try {
            mailSender.send(message);
        } catch (org.springframework.mail.MailException e) {
            e.printStackTrace(); // Log error to console for debugging
            // Throwing IllegalArgumentException so GlobalExceptionHandler returns 400
            // instead of 500
            throw new IllegalArgumentException("Failed to send email: " + e.getMessage());
        }
    }
}
