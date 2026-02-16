package com.chronosecure.backend.config;

import com.chronosecure.backend.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // 1. Enable CORS (Cross-Origin Resource Sharing)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // 2. Disable CSRF (Cross-Site Request Forgery) - Not needed for stateless APIs
                .csrf(AbstractHttpConfigurer::disable)

                // 3. Set Session Management to STATELESS (No JSESSIONID)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // 4. Define Endpoint Permissions
                .authorizeHttpRequests(auth -> auth
                        // Allow Swagger UI access (for development)
                        .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html",
                                "/swagger-ui/index.html")
                        .permitAll()

                        // Allow public authentication endpoints
                        .requestMatchers("/api/v1/auth/**").permitAll()

                        // Allow Attendance Logging Endpoints explicitly (for kiosk)
                        .requestMatchers("/api/v1/attendance/**").permitAll()

                        // Allow Biometric Verification (for kiosk public access)
                        .requestMatchers("/api/v1/biometric/verify").permitAll()

                        // Allow Fingerprint Launch (for enrollment)
                        .requestMatchers("/api/v1/fingerprint/**").permitAll()

                        // Allow root path redirect
                        .requestMatchers("/", "/error").permitAll()

                        // Lock down everything else
                        .anyRequest().authenticated())

                // 5. Add JWT filter before UsernamePasswordAuthenticationFilter
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // ALLOW FRONTEND ORIGIN (Using patterns allows credentials with wildcards)
        configuration.setAllowedOriginPatterns(List.of("*"));

        // ALLOW HTTP METHODS
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));

        // ALLOW HEADERS (Content-Type for JSON, Authorization for JWT, X-Company-Id for
        // multi-tenant)
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Requested-With", "X-Company-Id"));

        // Allow credentials (cookies/auth headers)
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
