import driivaLogoPath from '@assets/driiva_logo_CLEAR_FINAL_1769213316951.png';

interface DriivaLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const DriivaLogo: React.FC<DriivaLogoProps> = ({ size = 'lg' }) => {
  const sizeConfig = {
    sm: { height: 32, containerHeight: 20 },
    md: { height: 48, containerHeight: 30 },
    lg: { height: 96, containerHeight: 60 },
    xl: { height: 140, containerHeight: 90 },
  };
  
  const config = sizeConfig[size];
  
  return (
    <div 
      className="flex items-center justify-center overflow-hidden"
      style={{ 
        height: config.containerHeight,
        marginTop: 16,
        marginBottom: 3,
      }}
    >
      <img 
        src={driivaLogoPath}
        alt="Driiva"
        style={{ 
          height: config.height,
          width: 'auto',
          objectFit: 'contain',
          objectPosition: 'center',
          transform: 'scale(1.85)',
        }}
      />
    </div>
  );
};
