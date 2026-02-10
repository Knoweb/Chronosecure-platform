package com.chronosecure.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/fingerprint")
@CrossOrigin(origins = "*")
public class FingerprintController {

        @PostMapping("/launch")
        public ResponseEntity<?> launchFingerprintApp(@RequestBody Map<String, String> request) {
                try {
                        String employeeCode = request.get("employeeCode");
                        String name = request.get("name");
                        String companyId = request.get("companyId");

                        System.out.println(
                                        "Generating fingerprint launch URL for: " + employeeCode + " - " + name
                                                        + " (Company: "
                                                        + companyId + ")");

                        // Build Custom Protocol URL
                        // Expected format: fingerprint://enroll?employeeCode=...&name=...&companyId=...
                        String url = String.format("fingerprint://enroll?employeeCode=%s&name=%s&companyId=%s",
                                        employeeCode,
                                        name.replace(" ", "%20"),
                                        companyId != null ? companyId : "");

                        // Return the URL to the frontend so the BROWSER can launch it
                        return ResponseEntity.ok(Map.of(
                                        "message", "Ready to launch fingerprint application",
                                        "launchUrl", url,
                                        "employeeCode", employeeCode,
                                        "name", name));
                } catch (Exception e) {
                        System.err.println("Error generating launch URL: " + e.getMessage());
                        return ResponseEntity.status(500).body(Map.of(
                                        "error", "Failed to generate fingerprint launch URL: " + e.getMessage()));
                }
        }
}
