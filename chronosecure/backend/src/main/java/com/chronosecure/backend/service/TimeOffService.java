package com.chronosecure.backend.service;

import com.chronosecure.backend.model.TimeOffRequest;
import java.util.List;
import java.util.UUID;

public interface TimeOffService {
    List<TimeOffRequest> getRequests(UUID companyId);

    TimeOffRequest createRequest(UUID companyId, TimeOffRequest request);
}
