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

            System.out.println("Launching fingerprint app for: " + employeeCode + " - " + name);

            // Path to batch file
            String batchFile = "C:\\Users\\USER\\OneDrive - itum.mrt.ac.lk\\Desktop\\fingerprint project\\fingerprint01\\start_fingerprint.bat";

            // Build URL parameter
            String url = String.format("fingerprint://enroll?employeeCode=%s&name=%s",
                    employeeCode,
                    name.replace(" ", "%20"));

            // Use cmd to run the batch file
            ProcessBuilder processBuilder = new ProcessBuilder(
                    "cmd.exe",
                    "/c",
                    batchFile,
                    url);

            processBuilder.start();

            System.out.println("Fingerprint application launched successfully");

            return ResponseEntity.ok(Map.of(
                    "message", "Fingerprint application launched successfully",
                    "employeeCode", employeeCode,
                    "name", name));
        } catch (Exception e) {
            System.err.println("Error launching fingerprint app: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                    "error", "Failed to launch fingerprint application: " + e.getMessage()));
        }
    }
}
