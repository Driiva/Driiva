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
      unit: profile.hardBrakingScore === 1 ? "harsh event this month" : "harsh events this month",
      isInverse: true
    },
    {
      icon: TrendingUp,
      label: "Acceleration",
      value: profile.accelerationScore,
      weight: "20% weight",
      color: "#F59E0B",
      unit: profile.accelerationScore === 1 ? "harsh event this month" : "harsh events this month",
      isInverse: true
    },
    {
      icon: Gauge,
      label: "Speed",
      value: profile.speedAdherenceScore,
      weight: "20% weight",
      color: "#3B82F6",
      unit: profile.speedAdherenceScore === 1 ? "violation this month" : "violations this month",
      isInverse: true
    },
    {
      icon: Moon,
      label: "Night Driving",
      value: profile.nightDrivingScore,
      weight: "15% weight",
      color: "#A855F7",
      unit: profile.nightDrivingScore === 1 ? "night trip this month" : "night trips this month",
      isInverse: true
    }
  ];

  return (
    <section className="mb-2">
      <div className="grid grid-cols-2 gap-2">
        {metrics.map((metric, index) => (
          <button 
            key={index} 
            onClick={() => handleMetricClick(metric)} 
            className="glass-card glass-card-sm transition-all duration-200 hover:scale-[1.02] cursor-pointer w-full text-left" 
            style={{ 
              minHeight: '60px',
              padding: 'var(--card-padding-xs)',
              borderRadius: 'var(--radius-md)'
            }}
            data-testid={`metric-${metric.label.toLowerCase().replace(' ', '-')}`}
          >
            <div className="flex items-center space-x-2 mb-1">
              <div 
                className="w-5 h-5 rounded-md flex items-center justify-center"
                style={{ backgroundColor: `${metric.color}20` }}
              >
                <metric.icon className="w-3 h-3" style={{ color: metric.color }} />
              </div>
              <div className="flex-1">
                <div 
                  className="font-semibold text-white" 
                  style={{ 
                    fontSize: 'var(--font-xs)',
                    fontWeight: 'var(--font-semibold)',
                    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                    lineHeight: '1.2'
                  }}
                >
                  {metric.label}
                </div>
                <div 
                  className="text-white/70" 
                  style={{ 
                    fontSize: '9px',
                    fontWeight: 'var(--font-regular)',
                    textShadow: '0 1px 1px rgba(0,0,0,0.4)'
                  }}
                >
                  {metric.weight}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div 
                className="text-white font-semibold" 
                style={{ 
                  fontSize: 'var(--font-lg)',
                  fontWeight: 'var(--font-bold)',
                  textShadow: '0 1px 2px rgba(0,0,0,0.4)',
                  lineHeight: '1'
                }}
                data-testid={`metric-value-${metric.label.toLowerCase().replace(' ', '-')}`}
              >
                {metric.value}
              </div>
              <div 
                className="text-white/80 mt-0.5" 
                style={{ 
                  fontSize: '10px',
                  fontWeight: 'var(--font-regular)',
                  textShadow: '0 1px 1px rgba(0,0,0,0.3)',
                  lineHeight: '1.2'
                }}
              >
                {metric.unit}
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}