package com.chronosecure.backend.service.impl;

import com.chronosecure.backend.model.TimeOffRequest;
import com.chronosecure.backend.repository.TimeOffRequestRepository;
import com.chronosecure.backend.service.TimeOffService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TimeOffServiceImpl implements TimeOffService {

    private final TimeOffRequestRepository repository;

    @Override
    public List<TimeOffRequest> getRequests(UUID companyId) {
        return repository.findByCompanyIdOrderByCreatedAtDesc(companyId);
    }

    @Override
    public TimeOffRequest createRequest(UUID companyId, TimeOffRequest request) {
        request.setCompanyId(companyId);
        return repository.save(request);
    }

    @Override
    public TimeOffRequest updateStatus(UUID companyId, UUID id,
            com.chronosecure.backend.model.enums.TimeOffStatus status) {
        TimeOffRequest request = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if (!request.getCompanyId().equals(companyId)) {
            throw new RuntimeException("Unauthorized access to request");
        }

        request.setStatus(status);
        return repository.save(request);
    }
}
