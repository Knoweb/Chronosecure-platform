package com.chronosecure.backend.service;

import com.chronosecure.backend.dto.LoginRequest;
import com.chronosecure.backend.dto.LoginResponse;
import com.chronosecure.backend.dto.SignupRequest;

public interface AuthService {
    LoginResponse login(LoginRequest request);

    LoginResponse signup(SignupRequest request);

    void logout(String token);

    void forgotPassword(String email);

    void resetPassword(String token, String newPassword);
}
