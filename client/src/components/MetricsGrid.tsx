import { Truck, TrendingUp, Gauge, Moon, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MetricsGridProps {
  profile: {
    hardBrakingScore: number;
    accelerationScore: number;
    speedAdherenceScore: number;
    nightDrivingScore: number;
  };
}

export default function MetricsGrid({ profile }: MetricsGridProps) {
  const { toast } = useToast();
  
  const getScoreColor = (score: number, isInverse: boolean = false) => {
    return 'text-white'; // Simplified to white for all scores
  };

  const handleMetricClick = (metric: any) => {
    toast({
      title: `${metric.label} Details`,
      description: `Current value: ${metric.value} ${metric.unit}\nWeight in scoring: ${metric.weight}\nTip: ${getImprovementTip(metric.label)}`,
    });
  };

  const getImprovementTip = (label: string) => {
    switch (label) {
      case "Hard Braking": return "Maintain steady speeds and anticipate traffic changes";
      case "Acceleration": return "Gradually increase speed and avoid rapid acceleration";
      case "Speed": return "Stay within speed limits and follow traffic regulations";
      case "Night Driving": return "Limit night trips when possible for better safety scores";
      default: return "Continue safe driving practices";
    }
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
    <section className="mb-3">
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {metrics.map((metric, index) => (
          <button key={index} onClick={() => handleMetricClick(metric)} className="glass-morphism-subtle rounded-xl p-3 sm:p-3 transition-all duration-300 hover:scale-102 hover:shadow-lg cursor-pointer w-full text-left">
            <div className="flex items-center space-x-2 mb-2">
              <div 
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${metric.color}20` }}
              >
                <metric.icon className="w-3 h-3" style={{ color: metric.color }} />
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
              <div className={`text-lg font-bold ${getScoreColor(metric.value, metric.isInverse)} drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]`} style={{ 
                textShadow: '1px 1px 1px rgba(0,0,0,0.3)',
                fontFamily: 'Inter, sans-serif',
                fontWeight: '700'
              }}>
                {metric.value}
              </div>
              <div className="text-xs text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]" style={{ 
                textShadow: '1px 1px 1px rgba(0,0,0,0.3)',
                fontFamily: 'Inter, sans-serif'
              }}>{metric.unit}</div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}