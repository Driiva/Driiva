interface AnimatedBackgroundProps {
  variant?: "welcome" | "app";
}

export default function AnimatedBackground({ variant = "welcome" }: AnimatedBackgroundProps) {
  return (
    <div className="animated-bg-container">
      <div className="animated-bg-gradient" />
      
      <div className="animated-bg-orb animated-bg-orb-1" />
      <div className="animated-bg-orb animated-bg-orb-2" />
      <div className="animated-bg-orb animated-bg-orb-3" />
      
      <div className="animated-bg-vignette" />
    </div>
  );
}
