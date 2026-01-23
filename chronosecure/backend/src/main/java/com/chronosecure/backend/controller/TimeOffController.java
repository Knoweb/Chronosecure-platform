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

    @GetMapping("/requests")
    public ResponseEntity<List<TimeOffRequest>> getRequests(@RequestHeader("X-Company-Id") UUID companyId) {
        return ResponseEntity.ok(timeOffService.getRequests(companyId));
    }
}
