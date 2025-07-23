import { Truck, TrendingUp, Gauge, Moon } from "lucide-react";

interface MetricsGridProps {
  profile: {
    hardBrakingScore: number;
    accelerationScore: number;
    speedAdherenceScore: number;
    nightDrivingScore: number;
  };
}

export default function MetricsGrid({ profile }: MetricsGridProps) {
  const getScoreColor = (score: number, isInverse: boolean = false) => {
    return 'text-white'; // Simplified to white for all scores
  };

  const metrics = [
    {
      icon: Truck,
      label: "Hard Braking",
      value: profile.hardBrakingScore,
      weight: "25% weight",
      color: "#EF4444",
      unit: "incidents this month",
      isInverse: true
    },
    {
      icon: TrendingUp,
      label: "Acceleration",
      value: profile.accelerationScore,
      weight: "20% weight",
      color: "#F59E0B",
      unit: "harsh events",
      isInverse: true
    },
    {
      icon: Gauge,
      label: "Speed",
      value: profile.speedAdherenceScore,
      weight: "20% weight",
      color: "#3B82F6",
      unit: "violations",
      isInverse: true
    },
    {
      icon: Moon,
      label: "Night Driving",
      value: profile.nightDrivingScore,
      weight: "15% weight",
      color: "#A855F7",
      unit: "night trips",
      isInverse: true
    }
  ];

  return (
    <section className="mb-6">
      <div className="grid grid-cols-2 gap-4">
        {metrics.map((metric, index) => (
          <div key={index} className="glass-card rounded-2xl p-4 transition-transform duration-200 hover:scale-105 hover:shadow-lg cursor-pointer">
            <div className="flex items-center space-x-3 mb-2">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${metric.color}20` }}
              >
                <metric.icon className="w-4 h-4" style={{ color: metric.color }} />
              </div>
              <div>
                <div className="text-sm font-medium text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]" style={{ 
                  textShadow: '1px 1px 2px rgba(0,0,0,0.6)',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: '500'
                }}>{metric.label}</div>
                <div className="text-xs text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]" style={{ 
                  textShadow: '1px 1px 1px rgba(0,0,0,0.5)',
                  fontFamily: 'Inter, sans-serif'
                }}>{metric.weight}</div>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-xl font-bold ${getScoreColor(metric.value, metric.isInverse)} drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]`} style={{ 
                textShadow: '2px 2px 4px rgba(0,0,0,0.9), -1px -1px 2px rgba(0,0,0,0.7)',
                fontFamily: 'Inter, sans-serif',
                fontWeight: '700'
              }}>
                {metric.value}
              </div>
              <div className="text-xs text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]" style={{ 
                textShadow: '1px 1px 1px rgba(0,0,0,0.5)',
                fontFamily: 'Inter, sans-serif'
              }}>{metric.unit}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
