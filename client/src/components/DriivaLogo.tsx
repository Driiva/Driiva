import driivaLogoPath from '@assets/driiva_logo_CLEAR_FINAL_1769213316951.png';

interface DriivaLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const DriivaLogo: React.FC<DriivaLogoProps> = ({ size = 'lg' }) => {
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-24',
    xl: 'h-32',
  };
  
  return (
    <div className="flex flex-col items-center mt-4 mb-2">
      <img 
        src={driivaLogoPath}
        alt="Driiva"
        className={`${sizeClasses[size]} w-auto`}
        style={{ 
          objectFit: 'contain',
          clipPath: 'inset(35% 5% 35% 5%)',
          transform: 'scale(1.6)',
        }}
      />
    </div>
  );
};
