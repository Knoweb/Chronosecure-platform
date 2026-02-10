package com.chronosecure.backend.controller;

import com.chronosecure.backend.model.TimeOffRequest;
import com.chronosecure.backend.service.TimeOffService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/time-off")
@RequiredArgsConstructor
public class TimeOffController {

    private final TimeOffService timeOffService;

    @PostMapping
    public ResponseEntity<TimeOffRequest> createRequest(
            @RequestHeader("X-Company-Id") UUID companyId,
            @RequestBody TimeOffRequest request) {
        return ResponseEntity.ok(timeOffService.createRequest(companyId, request));
    }

    @GetMapping("/requests")
    public ResponseEntity<List<TimeOffRequest>> getRequests(@RequestHeader("X-Company-Id") UUID companyId) {
        return ResponseEntity.ok(timeOffService.getRequests(companyId));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<TimeOffRequest> updateStatus(
            @RequestHeader("X-Company-Id") UUID companyId,
            @PathVariable UUID id,
            @RequestParam com.chronosecure.backend.model.enums.TimeOffStatus status) {
        return ResponseEntity.ok(timeOffService.updateStatus(companyId, id, status));
    }
}
