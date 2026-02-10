import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';

// Types match your Java DTOs
export type AttendanceEventType = 'CLOCK_IN' | 'BREAK_START' | 'BREAK_END' | 'CLOCK_OUT';

interface AttendanceRequest {
  companyId: string;
  employeeId: string;
  eventType: AttendanceEventType;
  deviceId?: string;
  photoBase64?: string; // The captured image
  confidenceScore?: number;
}

// 1. Hook to Log Attendance (The Mutation)
export const useLogAttendance = () => {
  return useMutation({
    mutationFn: async (data: AttendanceRequest) => {
      const response = await api.post('/attendance/log', data);
      return response.data;
    },
  });
};

// 2. Hook to Get Next State (The Query)
// Decides if the button should say "Clock In" or "Clock Out"
export const useNextState = (companyId: string, employeeId: string) => {
  return useQuery({
    queryKey: ['attendanceState', companyId, employeeId],
    queryFn: async () => {
      const response = await api.get<AttendanceEventType>(`/attendance/next-state/${companyId}/${employeeId}`);
      return response.data;
    },
    enabled: !!companyId && !!employeeId, // Only run if IDs are present
  });
};
