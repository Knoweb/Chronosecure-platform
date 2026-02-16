package com.chronosecure.backend.dto;

import com.chronosecure.backend.model.enums.SubscriptionPlan;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class CompanyDetailResponse {
    private UUID id;
    private String name;
    private String subdomain;
    private String billingAddress;
    private boolean active;
    private SubscriptionPlan subscriptionPlan;
    private Instant createdAt;
    private List<AdminUserDTO> admins;

    @Data
    @Builder
    public static class AdminUserDTO {
        private UUID id;
        private String email;
        private String firstName;
        private String lastName;
    }
}
