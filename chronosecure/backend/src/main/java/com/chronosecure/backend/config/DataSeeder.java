package com.chronosecure.backend.config;

import com.chronosecure.backend.model.User;
import com.chronosecure.backend.model.enums.UserRole;
import com.chronosecure.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@RequiredArgsConstructor
public class DataSeeder {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Bean
    public CommandLineRunner initData() {
        return args -> {
            // Create Super Admin if not exists
            if (userRepository.findByEmail("admin@chronosecure.com").isEmpty()) {
                User superAdmin = User.builder()
                        .email("admin@chronosecure.com")
                        .passwordHash(passwordEncoder.encode("admin123"))
                        .firstName("Super")
                        .lastName("Admin")
                        .role(UserRole.SUPER_ADMIN)
                        .isActive(true)
                        .company(null) // Super Admin doesn't belong to a specific tenant company ideally, or create a dummy one.
                        // Assuming User.company is nullable or fetch logic handles null company.
                        .build();
                userRepository.save(superAdmin);
                System.out.println("SUPER ADMIN CREATED: admin@chronosecure.com / admin123");
            }
        };
    }
}
