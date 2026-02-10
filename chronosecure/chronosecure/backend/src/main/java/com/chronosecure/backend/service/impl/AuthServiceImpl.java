package com.chronosecure.backend.service.impl;

import com.chronosecure.backend.dto.LoginRequest;
import com.chronosecure.backend.dto.LoginResponse;
import com.chronosecure.backend.dto.SignupRequest;
import com.chronosecure.backend.model.Company;
import com.chronosecure.backend.model.User;
import com.chronosecure.backend.model.PasswordResetToken;
import com.chronosecure.backend.model.enums.UserRole;
import com.chronosecure.backend.repository.CompanyRepository;
import com.chronosecure.backend.repository.UserRepository;
import com.chronosecure.backend.repository.PasswordResetTokenRepository;
import com.chronosecure.backend.service.AuthService;
import com.chronosecure.backend.service.EmailService;
import com.chronosecure.backend.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;

    @Override
    @Transactional
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmailAndIsActiveTrue(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        // Update last login
        user.setLastLogin(Instant.now());
        userRepository.save(user);

        // Generate JWT token
        String token = jwtUtil.generateToken(
                user.getId(),
                user.getEmail(),
                user.getCompanyId(),
                user.getRole().name());

        return LoginResponse.builder()
                .token(token)
                .email(user.getEmail())
                .userId(user.getId())
                .companyId(user.getCompanyId())
                .role(user.getRole().name())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .companyName(user.getCompany() != null ? user.getCompany().getName() : null)
                .subdomain(user.getCompany() != null ? user.getCompany().getSubdomain() : null)
                .build();
    }

    @Override
    @Transactional
    public LoginResponse signup(SignupRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already exists");
        }

        // Create company if not provided
        Company company;
        if (request.getCompanyId() != null) {
            company = companyRepository.findById(request.getCompanyId())
                    .orElseThrow(() -> new IllegalArgumentException("Company not found"));
        } else {
            // Generate subdomain from company name
            String subdomain = generateSubdomain(request.getCompanyName());

            // Check if subdomain already exists
            int counter = 1;
            String originalSubdomain = subdomain;
            while (companyRepository.findBySubdomain(subdomain).isPresent()) {
                subdomain = originalSubdomain + counter;
                counter++;
            }

            company = Company.builder()
                    .name(request.getCompanyName())
                    .subdomain(subdomain)
                    .isActive(true)
                    .build();
            company = companyRepository.save(company);
        }

        // Create user with COMPANY_ADMIN role for new signups
        UserRole userRole = request.getCompanyId() != null
                ? (request.getRole() != null ? request.getRole() : UserRole.EMPLOYEE)
                : UserRole.COMPANY_ADMIN;

        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .companyId(company.getId())
                .role(userRole)
                .isActive(true)
                .build();

        user = userRepository.save(user);

        // Generate JWT token
        String token = jwtUtil.generateToken(
                user.getId(),
                user.getEmail(),
                user.getCompanyId(),
                user.getRole().name());

        return LoginResponse.builder()
                .token(token)
                .email(user.getEmail())
                .userId(user.getId())
                .companyId(user.getCompanyId())
                .role(user.getRole().name())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .companyName(company.getName())
                .subdomain(company.getSubdomain())
                .build();
    }

    private String generateSubdomain(String companyName) {
        return companyName.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
    }

    @Override
    public void logout(String token) {
        // Stateless JWT logout
    }

    @Override
    @Transactional
    public void forgotPassword(String email) {
        System.out.println("Processing forgotPassword for email: " + email);
        User user = userRepository.findByEmailAndIsActiveTrue(email)
                .orElseThrow(() -> {
                    System.out.println("User NOT FOUND for email: " + email);
                    return new IllegalArgumentException("User not found with this email");
                });

        System.out.println("User found: " + user.getId());
        passwordResetTokenRepository.deleteByUser(user);

        String token = UUID.randomUUID().toString();
        PasswordResetToken passwordResetToken = PasswordResetToken.builder()
                .token(token)
                .user(user)
                .expiryDate(Instant.now().plusSeconds(86400)) // 24 hours
                .build();

        passwordResetTokenRepository.save(passwordResetToken);

        System.out.println("Token saved. Sending email...");
        emailService.sendPasswordResetEmail(user, token);
        System.out.println("Email sent successfully.");
    }

    @Override
    @Transactional
    public void resetPassword(String token, String newPassword) {
        PasswordResetToken passwordResetToken = passwordResetTokenRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid token"));

        if (passwordResetToken.getExpiryDate().isBefore(Instant.now())) {
            throw new IllegalArgumentException("Token has expired");
        }

        User user = passwordResetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        passwordResetTokenRepository.delete(passwordResetToken);
    }
}
