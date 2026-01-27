package com.chronosecure.backend.service;

import com.chronosecure.backend.model.AttendanceLog;
import com.chronosecure.backend.model.Employee;
import com.chronosecure.backend.model.TimeOffRequest;
import com.chronosecure.backend.model.enums.AttendanceEventType;
import com.chronosecure.backend.model.enums.TimeOffStatus;
import com.chronosecure.backend.repository.AttendanceLogRepository;
import com.chronosecure.backend.repository.EmployeeRepository;
import com.chronosecure.backend.repository.TimeOffRequestRepository;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.cloud.FirestoreClient;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class FirebaseSyncService {

    private final EmployeeRepository employeeRepository;
    private final AttendanceLogRepository attendanceLogRepository;
    private final TimeOffRequestRepository timeOffRequestRepository;
    private final com.chronosecure.backend.service.HoursCalculationService hoursCalculationService;

    private Firestore db;
    private long lastSyncedUnixTime = System.currentTimeMillis() / 1000 - 86400; // Last 24 hours

    @PostConstruct
    public void initAndStartSync() {
        try {
            if (FirebaseApp.getApps().isEmpty()) {
                log.info("Initializing Firebase App explicitly in Sync Service...");
                try (InputStream inputStream = new ClassPathResource("serviceAccountKey.json").getInputStream()) {
                    GoogleCredentials credentials = GoogleCredentials.fromStream(inputStream);
                    FirebaseOptions options = FirebaseOptions.builder()
                            .setCredentials(credentials)
                            .build();
                    FirebaseApp.initializeApp(options);
                }
            }

            db = FirestoreClient.getFirestore();
            startSyncTask();
        } catch (Exception e) {
            log.error("CRITICAL: Failed to initialize Firebase Sync Service: {}", e.getMessage());
        }
    }

    private void startSyncTask() {
        ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);
        scheduler.scheduleAtFixedRate(this::syncAttendance, 5, 5, TimeUnit.SECONDS);
        log.info("Firebase Sync Task started.");
    }

    private void syncAttendance() {
        if (db == null)
            return;

        try {
            List<QueryDocumentSnapshot> documents = db.collection("attendance")
                    .orderBy("unix")
                    .startAfter(lastSyncedUnixTime)
                    .limit(50)
                    .get()
                    .get()
                    .getDocuments();

            if (documents.isEmpty())
                return;

            log.info("Found {} new attendance logs in Firebase", documents.size());

            for (QueryDocumentSnapshot doc : documents) {
                Long unixTime = doc.getLong("unix");
                if (unixTime != null) {
                    this.lastSyncedUnixTime = unixTime;
                }

                String result = doc.getString("result");
                if (result == null || "NO_MATCH".equals(result)) {
                    continue; // Skip failed scans
                }

                String uid = doc.getString("uid"); // This maps to Employee Code
                if (uid == null)
                    continue;

                Optional<Employee> employeeOpt = employeeRepository.findByEmployeeCode(uid);
                if (employeeOpt.isEmpty()) {
                    log.warn("Skipping sync: Employee not found for UID/Code: {}", uid);
                    continue;
                }

                Employee employee = employeeOpt.get();
                String deviceId = doc.getString("device_id");
                Double score = doc.getDouble("score");

                // Handle TIME_OFF vs ATTENDANCE
                if ("TIME_OFF".equals(result)) {
                    Instant scanTime = Instant
                            .ofEpochSecond(unixTime != null ? unixTime : Instant.now().getEpochSecond());
                    LocalDate date = LocalDate.ofInstant(scanTime, ZoneId.systemDefault());
                    String timeStr = java.time.format.DateTimeFormatter.ofPattern("hh:mm a")
                            .withZone(ZoneId.systemDefault()).format(scanTime);

                    // 1. Create TimeOff Request
                    TimeOffRequest req = TimeOffRequest.builder()
                            .companyId(employee.getCompanyId())
                            .employeeId(employee.getId())
                            .startDate(date)
                            .endDate(date)
                            .reason("Fingerprint Scanned Out at " + timeStr)
                            .status(TimeOffStatus.APPROVED)
                            .build();
                    timeOffRequestRepository.save(req);

                    // 2. Also log as CLOCK_OUT for calculation
                    AttendanceLog logOut = AttendanceLog.builder()
                            .companyId(employee.getCompanyId())
                            .employee(employee)
                            .eventType(AttendanceEventType.CLOCK_OUT)
                            .eventTimestamp(scanTime)
                            .deviceId(deviceId)
                            .isOfflineSync(true)
                            .build();
                    attendanceLogRepository.save(logOut);

                    // 3. Trigger Hours Calculation
                    hoursCalculationService.calculateHoursForDate(employee.getCompanyId(), employee.getId(), date);

                    log.info("Synced Time Off & Calculated Hours for {}, Result: TIME_OFF", employee.getFirstName());
                } else {
                    // Default to Attendance Log for MATCH or others
                    AttendanceEventType eventType = AttendanceEventType.CLOCK_IN;
                    // Optional: You could infer CLOCK_OUT if we wanted, but we are using TIME_OFF
                    // table for that now.
                    // Keep existing event logic just in case useful
                    String eventTypeStr = doc.getString("event_type");
                    if (eventTypeStr != null) {
                        switch (eventTypeStr) {
                            case "CHECK_IN":
                                eventType = AttendanceEventType.CLOCK_IN;
                                break;
                            case "LUNCH_START":
                                eventType = AttendanceEventType.BREAK_START;
                                break;
                            case "LUNCH_END":
                                eventType = AttendanceEventType.BREAK_END;
                                break;
                            case "CHECK_OUT":
                                eventType = AttendanceEventType.CLOCK_OUT;
                                break;
                        }
                    }

                    AttendanceLog logEntry = AttendanceLog.builder()
                            .companyId(employee.getCompanyId())
                            .employee(employee)
                            .eventType(eventType)
                            .eventTimestamp(unixTime != null ? Instant.ofEpochSecond(unixTime) : Instant.now())
                            .deviceId(deviceId)
                            .confidenceScore(score != null ? BigDecimal.valueOf(score) : null)
                            .isOfflineSync(true)
                            .build();

                    attendanceLogRepository.save(logEntry);

                    // Invalidate conflicting time off requests for TODAY since they are present
                    this.invalidateConflictingRequests(employee);
                    log.info("Synced attendance for {}, Result: {}", employee.getFirstName(), result);
                }
            }
        } catch (Exception e) {
            if (e.getMessage() != null && !e.getMessage().contains("FirebaseApp with name [DEFAULT] doesn't exist")) {
                log.error("Error during Firebase synchronization: {}", e.getMessage());
            }
        }
    }

    private void invalidateConflictingRequests(Employee employee) {
        try {
            java.time.LocalDate today = java.time.LocalDate.now();
            List<com.chronosecure.backend.model.TimeOffRequest> allCompanyRequests = timeOffRequestRepository
                    .findByCompanyIdOrderByCreatedAtDesc(employee.getCompanyId());

            List<com.chronosecure.backend.model.TimeOffRequest> conflictingRequests = allCompanyRequests.stream()
                    .filter(req -> req.getEmployeeId().equals(employee.getId()))
                    .filter(req -> req.getStatus() == TimeOffStatus.PENDING
                            || req.getStatus() == TimeOffStatus.APPROVED)
                    .filter(req -> {
                        // Check overlap with Today OR Yesterday (to handle timezone slips)
                        java.time.LocalDate yesterday = today.minusDays(1);
                        return (req.getStartDate().isBefore(today) || req.getStartDate().equals(today)) &&
                                (req.getEndDate().isAfter(yesterday) || req.getEndDate().equals(yesterday));
                    })
                    .collect(java.util.stream.Collectors.toList());

            if (!conflictingRequests.isEmpty()) {
                log.info("Firebase Sync: Found {} conflicting time-off requests for employee {}. Auto-rejecting.",
                        conflictingRequests.size(), employee.getId());
                for (com.chronosecure.backend.model.TimeOffRequest req : conflictingRequests) {
                    req.setStatus(TimeOffStatus.REJECTED);
                    String currentReason = req.getReason() == null ? "" : req.getReason();
                    req.setReason(currentReason + " [Auto-rejected: Fingerprint Scan Synced]");
                    timeOffRequestRepository.save(req);
                }
            }
        } catch (Exception e) {
            log.error("Failed to auto-reject time off requests during Firebase sync for employee {}", employee.getId(),
                    e);
        }
    }
}