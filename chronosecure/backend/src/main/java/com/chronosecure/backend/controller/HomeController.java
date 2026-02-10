package com.chronosecure.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * Home Controller
 * Handles root path requests
 */
@RestController
public class HomeController {

    @GetMapping("/")
    public ResponseEntity<Map<String, Object>> home() {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "ChronoSecure API");
        response.put("version", "1.0.0");
        response.put("documentation", "/swagger-ui/index.html");
        response.put("apiDocs", "/v3/api-docs");
        return ResponseEntity.ok(response);
    }
}


