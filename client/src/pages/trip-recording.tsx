import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useTelematics } from "@/hooks/useTelematics";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Play, Square, Pause, Navigation, Clock, Zap } from "lucide-react";

export default function TripRecording() {
  const [, setLocation] = useLocation();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [tripStartTime, setTripStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const telematics = useTelematics();
  const geolocation = useGeolocation({
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 1000
  });

  // Trip submission mutation
  const submitTripMutation = useMutation({
    mutationFn: async (tripData: any) => {
      const response = await apiRequest("POST", "/api/trips", tripData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Trip Saved",
        description: `Trip recorded with score: ${data.metrics.score}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      setLocation('/');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to save trip data",
        variant: "destructive",
      });
    }
  });

  // Update elapsed time
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRecording && !isPaused && tripStartTime) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - tripStartTime.getTime());
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording, isPaused, tripStartTime]);

  const startTrip = async () => {
    try {
      // Request permissions first
      await telematics.requestPermissions();
      
      // Start location watching
      geolocation.startWatching();
      
      // Start telematics collection
      await telematics.startCollection();
      
      setIsRecording(true);
      setIsPaused(false);
      setTripStartTime(new Date());
      setElapsedTime(0);
      
      toast({
        title: "Trip Started",
        description: "Recording your driving data",
      });
    } catch (error) {
      toast({
        title: "Permission Required",
        description: "Please enable location and motion sensors",
        variant: "destructive",
      });
    }
  };

  const pauseTrip = () => {
    setIsPaused(!isPaused);
    toast({
      title: isPaused ? "Trip Resumed" : "Trip Paused",
      description: isPaused ? "Continuing to record" : "Recording paused",
    });
  };

  const stopTrip = async () => {
    try {
      // Stop data collection
      const telematicsData = await telematics.stopCollection();
      geolocation.stopWatching();
      
      // Prepare trip data
      const tripData = {
        userId: 2, // Mock user ID
        startTime: tripStartTime?.toISOString(),
        endTime: new Date().toISOString(),
        startLocation: geolocation.position ? 
          `${geolocation.position.coords.latitude}, ${geolocation.position.coords.longitude}` : 
          'Unknown',
        endLocation: geolocation.position ? 
          `${geolocation.position.coords.latitude}, ${geolocation.position.coords.longitude}` : 
          'Unknown',
        telematicsData
      };
      
      // Submit trip
      submitTripMutation.mutate(tripData);
      
      // Reset state
      setIsRecording(false);
      setIsPaused(false);
      setTripStartTime(null);
      setElapsedTime(0);
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to stop trip recording",
        variant: "destructive",
      });
    }
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    }
    return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen text-white safe-area pt-20">
      <div className="px-4 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Trip Recording</h1>
          <button
            onClick={() => setLocation('/')}
            className="text-gray-400 hover:text-white"
          >
            Cancel
          </button>
        </div>

        {/* Status Card */}
        <div className="glass-morphism rounded-3xl p-6 mb-6">
          <div className="text-center">
            <div className={`w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center ${
              isRecording ? 'bg-red-500/20 border-2 border-red-500' : 'bg-gray-500/20 border-2 border-gray-500'
            }`}>
              {isRecording ? (
                isPaused ? <Pause className="w-8 h-8 text-red-500" /> : 
                <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
              ) : (
                <Play className="w-8 h-8 text-gray-400" />
              )}
            </div>
            
            <h2 className="text-xl font-semibold mb-2">
              {!isRecording ? 'Ready to Record' : 
               isPaused ? 'Trip Paused' : 'Recording Trip'}
            </h2>
            
            {isRecording && (
              <div className="text-3xl font-bold text-white mb-2">
                {formatTime(elapsedTime)}
              </div>
            )}
            
            <p className="text-gray-400 text-sm">
              {!isRecording ? 'Tap start to begin recording your trip' :
               isPaused ? 'Trip recording is paused' : 
               'Your driving data is being recorded'}
            </p>
          </div>
        </div>

        {/* Real-time Stats */}
        {isRecording && telematics.currentData && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="glass-card rounded-2xl p-4 text-center">
              <Navigation className="w-6 h-6 text-[#8B4513] mx-auto mb-2" />
              <div className="text-lg font-bold">{telematics.summary?.gpsPoints || 0}</div>
              <div className="text-xs text-gray-400">GPS Points</div>
            </div>
            
            <div className="glass-card rounded-2xl p-4 text-center">
              <Zap className="w-6 h-6 text-[#B87333] mx-auto mb-2" />
              <div className="text-lg font-bold">{telematics.summary?.accelerometerReadings || 0}</div>
              <div className="text-xs text-gray-400">Sensor Data</div>
            </div>
          </div>
        )}

        {/* Permissions Status */}
        <div className="glass-card rounded-2xl p-4 mb-6">
          <h3 className="font-semibold mb-3">Sensor Status</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Location Access</span>
              <div className={`w-3 h-3 rounded-full ${
                geolocation.position ? 'bg-green-500' : 'bg-red-500'
              }`} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Motion Sensors</span>
              <div className={`w-3 h-3 rounded-full ${
                telematics.isPermissionGranted ? 'bg-green-500' : 'bg-red-500'
              }`} />
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="space-y-4">
          {!isRecording ? (
            <Button 
              onClick={startTrip}
              className="w-full h-14 bg-gradient-to-r from-[#8B4513] to-[#B87333] hover:from-[#A0522D] hover:to-[#CD853F] text-white font-semibold rounded-2xl"
              disabled={!geolocation.position || !telematics.isPermissionGranted}
            >
              <Play className="w-5 h-5 mr-2" />
              Start Trip
            </Button>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <Button 
                onClick={pauseTrip}
                variant="outline"
                className="h-14 glass-card border-gray-600 text-white hover:bg-white/10 rounded-2xl"
              >
                {isPaused ? <Play className="w-5 h-5 mr-2" /> : <Pause className="w-5 h-5 mr-2" />}
                {isPaused ? 'Resume' : 'Pause'}
              </Button>
              
              <Button 
                onClick={stopTrip}
                className="h-14 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-2xl"
                disabled={submitTripMutation.isPending}
              >
                <Square className="w-5 h-5 mr-2" />
                {submitTripMutation.isPending ? 'Saving...' : 'Stop Trip'}
              </Button>
            </div>
          )}
        </div>

        {/* Error Display */}
        {(geolocation.error || telematics.error) && (
          <div className="mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-2xl">
            <h4 className="font-semibold text-red-400 mb-2">Sensor Error</h4>
            <p className="text-sm text-red-300">
              {geolocation.error?.message || telematics.error}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}