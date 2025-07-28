import DashboardHeader from "@/components/DashboardHeader";
import BottomNavigation from "@/components/BottomNavigation";
import { Map } from "lucide-react";

interface Trip {
  id: number;
  userId: number;
  startLocation: string;
  endLocation: string;
  startTime: string;
  endTime: string;
  distance: string;
  duration: number;
  score: number;
  hardBrakingEvents: number;
  harshAcceleration: number;
  speedViolations: number;
}

export default function Trips() {
  // Static data for stable demo - no API calls
  const trips: Trip[] = [
    {
      id: 1,
      userId: 8,
      startLocation: "Home",
      endLocation: "Office",
      startTime: "2025-07-28T08:30:00Z",
      endTime: "2025-07-28T09:15:00Z",
      distance: "12.3",
      duration: 45,
      score: 92,
      hardBrakingEvents: 0,
      harshAcceleration: 1,
      speedViolations: 0
    },
    {
      id: 2,
      userId: 8,
      startLocation: "Office",
      endLocation: "Grocery Store",
      startTime: "2025-07-27T17:45:00Z",
      endTime: "2025-07-27T18:10:00Z",
      distance: "5.7",
      duration: 25,
      score: 88,
      hardBrakingEvents: 1,
      harshAcceleration: 0,
      speedViolations: 0
    }
  ];

  const user = {
    firstName: "Test",
    lastName: "Driver",
    username: "driiva1",
    email: "test@driiva.com",
    premiumAmount: "1840.00"
  };

  return (
    <div className="min-h-screen text-white bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <DashboardHeader user={user} />
      <main className="px-4 pb-20">
        <div className="pt-4">
          <h2 className="text-xl font-semibold mb-4">Recent Trips</h2>
          
          <div className="space-y-3">
            {trips.map((trip) => (
              <div key={trip.id} className="glass-morphism rounded-2xl p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                      <Map className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-medium">{trip.startLocation} → {trip.endLocation}</h3>
                      <p className="text-sm text-gray-400">
                        {new Date(trip.startTime).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-green-400">{trip.score}/100</div>
                    <div className="text-sm text-gray-400">{trip.distance} mi</div>
                  </div>
                </div>
                
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <div className="text-xs text-gray-400">Braking</div>
                    <div className="text-sm font-medium">{trip.hardBrakingEvents}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-400">Acceleration</div>
                    <div className="text-sm font-medium">{trip.harshAcceleration}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-400">Speed</div>
                    <div className="text-sm font-medium">{trip.speedViolations}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <BottomNavigation activeTab="trips" />
    </div>
  );
}