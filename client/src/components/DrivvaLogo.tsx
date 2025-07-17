export default function DriivaLogo({ className = "", size = "default" }: { 
  className?: string; 
  size?: "small" | "default" | "large" 
}) {
  const sizeClasses = {
    small: "text-2xl tracking-wide",
    default: "text-4xl tracking-wide",
    large: "text-6xl tracking-wide"
  };

  return (
    <div className={`font-bold ${sizeClasses[size]} ${className}`} style={{ fontFamily: 'Inter, sans-serif' }}>
      <span className="text-white relative italic">
        Driiva
        <span className="absolute -top-1 -right-1 text-xs opacity-70 not-italic">®</span>
      </span>
    </div>
  );
}