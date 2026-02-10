package com.chronosecure.backend.service;

import com.chronosecure.backend.model.TimeOffRequest;
import com.chronosecure.backend.model.enums.TimeOffStatus;
import java.util.List;
import java.util.UUID;

public interface TimeOffService {
    List<TimeOffRequest> getRequests(UUID companyId);

    TimeOffRequest createRequest(UUID companyId, TimeOffRequest request);

    TimeOffRequest updateStatus(UUID companyId, UUID id, TimeOffStatus status);
}
