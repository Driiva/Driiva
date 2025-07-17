import { useState, useCallback, useRef, useEffect } from 'react';
import { telematicsCollector, TelematicsData, DeviceMotionPermission } from '@/lib/telematics';
import { drivingScorer, DrivingMetrics } from '@/lib/scoring';
import { useToast } from '@/hooks/use-toast';

export interface TelematicsState {
  isCollecting: boolean;
  isPermissionGranted: boolean;
  currentData: TelematicsData | null;
  metrics: DrivingMetrics | null;
  error: string | null;
  summary: {
    gpsPoints: number;
    accelerometerReadings: number;
    gyroscopeReadings: number;
    speedReadings: number;
    duration: number;
  } | null;
}

export interface TelematicsActions {
  requestPermissions: () => Promise<DeviceMotionPermission>;
  startCollection: () => Promise<void>;
  stopCollection: () => Promise<TelematicsData>;
  clearError: () => void;
  simulateHapticFeedback: (type?: 'light' | 'medium' | 'heavy') => void;
}

export function useTelematics(): TelematicsState & TelematicsActions {
  const { toast } = useToast();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [state, setState] = useState<TelematicsState>({
    isCollecting: false,
    isPermissionGranted: false,
    currentData: null,
    metrics: null,
    error: null,
    summary: null
  });

  // Update summary periodically while collecting
  useEffect(() => {
    if (state.isCollecting) {
      intervalRef.current = setInterval(() => {
        const summary = telematicsCollector.getDataSummary();
        setState(prev => ({ ...prev, summary }));
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.isCollecting]);

  const requestPermissions = useCallback(async (): Promise<DeviceMotionPermission> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      const permission = await telematicsCollector.requestPermissions();
      
      setState(prev => ({ 
        ...prev, 
        isPermissionGranted: permission.granted,
        error: permission.granted ? null : 'Device motion permission denied'
      }));

      if (!permission.granted) {
        toast({
          title: "Permission Required",
          description: "Device motion and location permissions are required for trip tracking.",
          variant: "destructive"
        });
      }

      return permission;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to request permissions';
      setState(prev => ({ ...prev, error: errorMessage }));
      
      toast({
        title: "Permission Error",
        description: errorMessage,
        variant: "destructive"
      });
      
      return { granted: false, permission: 'denied' };
    }
  }, [toast]);

  const startCollection = useCallback(async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      await telematicsCollector.startCollection();
      
      setState(prev => ({ 
        ...prev, 
        isCollecting: true,
        isPermissionGranted: true,
        currentData: null,
        metrics: null
      }));

      toast({
        title: "Trip Started",
        description: "Telematics collection is now active. Drive safely!",
      });

      // Simulate haptic feedback
      telematicsCollector.simulateHapticFeedback('medium');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start collection';
      setState(prev => ({ ...prev, error: errorMessage }));
      
      toast({
        title: "Collection Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  }, [toast]);

  const stopCollection = useCallback(async (): Promise<TelematicsData> => {
    try {
      const data = telematicsCollector.stopCollection();
      
      // Calculate driving metrics
      const metrics = drivingScorer.calculateDrivingMetrics(data);
      
      setState(prev => ({ 
        ...prev, 
        isCollecting: false,
        currentData: data,
        metrics,
        summary: null
      }));

      toast({
        title: "Trip Completed",
        description: `Trip score: ${metrics.score}/100. Distance: ${metrics.distance.toFixed(1)} miles.`,
      });

      // Simulate haptic feedback
      telematicsCollector.simulateHapticFeedback('heavy');
      
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to stop collection';
      setState(prev => ({ ...prev, error: errorMessage }));
      
      toast({
        title: "Collection Error",
        description: errorMessage,
        variant: "destructive"
      });
      
      // Return empty data on error
      return {
        gpsPoints: [],
        accelerometerData: [],
        gyroscopeData: [],
        speedData: [],
        timestamp: Date.now()
      };
    }
  }, [toast]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const simulateHapticFeedback = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    telematicsCollector.simulateHapticFeedback(type);
  }, []);

  return {
    ...state,
    requestPermissions,
    startCollection,
    stopCollection,
    clearError,
    simulateHapticFeedback
  };
}
