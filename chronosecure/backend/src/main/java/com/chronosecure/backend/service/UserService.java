package com.chronosecure.backend.service;

import com.chronosecure.backend.dto.ChangePasswordRequest;
import com.chronosecure.backend.dto.UserRequest;
import com.chronosecure.backend.model.User;

import java.util.UUID;

public interface UserService {
    User updateUser(UUID userId, UserRequest request);

    void changePassword(UUID userId, ChangePasswordRequest request);
}
