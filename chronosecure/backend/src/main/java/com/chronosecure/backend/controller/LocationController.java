package com.chronosecure.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/locations")
@CrossOrigin(origins = "http://localhost:5173")
public class LocationController {

    @GetMapping
    public ResponseEntity<List<Object>> getAllLocations(
            @RequestHeader(value = "X-Company-Id", required = false) UUID companyId) {
        return ResponseEntity.ok(Collections.emptyList());
    }
}
