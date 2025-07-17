export default function DriivaLogo({ className = "", size = "default" }: { 
  className?: string; 
  size?: "small" | "default" | "large" 
}) {
  const sizeClasses = {
    small: "text-2xl tracking-wider",
    default: "text-4xl tracking-wider",
    large: "text-6xl tracking-wider"
  };

  return (
    <div className={`font-bold ${sizeClasses[size]} ${className}`}>
      <span className="driiva-gradient relative">
        driiva
        <span className="absolute -top-1 -right-1 text-xs opacity-70">®</span>
      </span>
    </div>
  );
}