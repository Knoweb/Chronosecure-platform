package com.chronosecure.backend.service;

/**
 * Liveness Detection Service
 * Prevents photo spoofing by detecting if a live person is present
 * 
 * Implementation can use:
 * - Face detection and movement analysis
 * - Blink detection
 * - Head movement tracking
 * - 3D depth analysis (if available)
 */
public interface LivenessDetectionService {
    /**
     * Analyze a photo/video frame for liveness indicators
     * 
     * @param photoBase64 Base64 encoded image
     * @return Confidence score (0.0 to 1.0) indicating likelihood of live person
     */
    double detectLiveness(String photoBase64);
    
    /**
     * Check if liveness detection is available
     * @return true if liveness detection can be performed
     */
    boolean isAvailable();
}

