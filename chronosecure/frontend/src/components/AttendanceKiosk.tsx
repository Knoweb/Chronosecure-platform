import { useEffect, useRef, useState } from 'react';
import { useLogAttendance, useNextState, AttendanceEventType } from '@/hooks/useAttendance';
import { Camera, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

// Mock IDs for demo purposes - In production, these come from the logged-in session/context
const COMPANY_ID = "c56a4180-65aa-42ec-a945-5fd21dec0538"; 
const EMPLOYEE_ID = "3fa85f64-5717-4562-b3fc-2c963f66afa6";

export default function AttendanceKiosk() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);

  // API Hooks
  const { data: nextEvent, isLoading: isLoadingState, refetch: refetchState } = useNextState(COMPANY_ID, EMPLOYEE_ID);
  const { mutate: logAttendance, isPending, isSuccess, error } = useLogAttendance();

  // 1. Initialize Camera on Mount
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 640, height: 480 } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Camera access is required for attendance logging.");
    }
  };

  const stopCamera = () => {
    stream?.getTracks().forEach(track => track.stop());
  };

  // 2. Capture Photo Logic
  const capturePhoto = (): string | null => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        // Draw current video frame to canvas
        context.drawImage(videoRef.current, 0, 0, 640, 480);
        // Convert to Base64
        const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8);
        setCapturedPhoto(dataUrl);
        return dataUrl;
      }
    }
    return null;
  };

  // 3. Handle Submit
  const handleAttendance = () => {
    const photo = capturePhoto();
    
    if (!nextEvent) return;

    logAttendance({
      companyId: COMPANY_ID,
      employeeId: EMPLOYEE_ID,
      eventType: nextEvent,
      deviceId: "KIOSK_01",
      photoBase64: photo || undefined,
      confidenceScore: 0.95 // Mock Liveness score
    }, {
      onSuccess: () => {
        // Reset after 3 seconds
        setTimeout(() => {
          setCapturedPhoto(null);
          refetchState(); // Get new state (e.g., switched from In -> Out)
        }, 3000);
      }
    });
  };

  // 4. Determine Button Label
  const getButtonLabel = (event: AttendanceEventType) => {
    switch (event) {
      case 'CLOCK_IN': return 'Clock In';
      case 'BREAK_START': return 'Start Break';
      case 'BREAK_END': return 'End Break';
      case 'CLOCK_OUT': return 'Clock Out';
      default: return 'Loading...';
    }
  };

  // UI Coloring based on action
  const getStatusColor = (event: AttendanceEventType) => {
    if (event === 'CLOCK_IN' || event === 'BREAK_END') return 'bg-green-600 hover:bg-green-700';
    return 'bg-red-600 hover:bg-red-700';
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-900 p-6 text-white text-center">
          <h1 className="text-2xl font-bold">ChronoSecure</h1>
          <p className="text-slate-400 text-sm">Employee Attendance Kiosk</p>
        </div>

        {/* Camera Feed Area */}
        <div className="relative h-64 bg-black flex items-center justify-center">
          {!capturedPhoto ? (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <img 
              src={capturedPhoto} 
              alt="Captured" 
              className="absolute inset-0 w-full h-full object-cover opacity-80" 
            />
          )}
          
          {/* Hidden Canvas for processing */}
          <canvas ref={canvasRef} width={640} height={480} className="hidden" />
          
          {/* Loading Overlay */}
          {isPending && (
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white z-10">
              <RefreshCw className="w-10 h-10 animate-spin mb-2" />
              <p>Verifying & Logging...</p>
            </div>
          )}

          {/* Success Overlay */}
          {isSuccess && (
            <div className="absolute inset-0 bg-green-500/90 flex flex-col items-center justify-center text-white z-10">
              <CheckCircle className="w-16 h-16 mb-2" />
              <p className="text-xl font-bold">Success!</p>
            </div>
          )}
        </div>

        {/* Action Area */}
        <div className="p-6 flex flex-col gap-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>Failed to log attendance. Please try again.</span>
            </div>
          )}

          <button
            onClick={handleAttendance}
            disabled={isLoadingState || isPending || isSuccess}
            className={`w-full py-4 text-lg font-semibold text-white rounded-lg shadow-md transition-all flex items-center justify-center gap-2
              ${isLoadingState ? 'bg-gray-400 cursor-not-allowed' : nextEvent ? getStatusColor(nextEvent) : 'bg-gray-400'}
            `}
          >
            <Camera className="w-6 h-6" />
            {isLoadingState ? 'Syncing...' : nextEvent ? getButtonLabel(nextEvent) : 'System Error'}
          </button>

          {/* Compliance Footer */}
          <p className="text-xs text-gray-400 text-center mt-2 px-4">
            By clicking above, you consent to the capture of your photo for identity verification purposes in accordance with our 
            <a href="#" className="underline ml-1">Privacy Policy</a>. Photos are securely stored and audit-logged.
          </p>
        </div>
      </div>
    </div>
  );
}

/*Key Features:

Live Camera Feed: Uses a <video> ref.

Photo Capture: Draws the video frame to a hidden <canvas> to generate a Base64 string.

Compliance Notice: Includes a mandatory privacy disclaimer (GDPR/BIPA). */
