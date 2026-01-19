export const GradientMesh = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div 
        className="absolute top-[-50%] left-[-30%] w-[140%] h-[140%] 
                   bg-gradient-radial from-blue-500/20 via-purple-500/10 to-transparent 
                   blur-3xl animate-pulse" 
        style={{ animationDuration: '6s' }}
      />
      <div 
        className="absolute bottom-[-40%] right-[-20%] w-[100%] h-[100%] 
                   bg-gradient-radial from-emerald-400/15 via-cyan-500/5 to-transparent 
                   blur-3xl animate-pulse" 
        style={{ animationDuration: '8s', animationDelay: '1s' }}
      />
    </div>
  );
};
