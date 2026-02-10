package com.chronosecure.backend.controller;

import com.chronosecure.backend.model.Location;
import com.chronosecure.backend.service.LocationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/locations")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class LocationController {

    private final LocationService locationService;

    @PostMapping
    public ResponseEntity<Location> createLocation(
            @RequestHeader("X-Company-Id") UUID companyId,
            @RequestBody Location location) {
        location.setCompanyId(companyId);
        return ResponseEntity.ok(locationService.createLocation(location));
    }

    @GetMapping
    public ResponseEntity<List<Location>> getAllLocations(
            @RequestHeader(value = "X-Company-Id") UUID companyId) {
        if (companyId == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(locationService.getLocationsByCompanyId(companyId));
    }
}
