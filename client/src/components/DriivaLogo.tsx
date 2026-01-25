import driivaLogoPath from '@assets/driiva_logo_CLEAR_FINAL_1769213316951.png';

interface DriivaLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const DriivaLogo: React.FC<DriivaLogoProps> = ({ size = 'lg' }) => {
  const sizeConfig = {
    sm: { width: 100, containerHeight: 28 },
    md: { width: 140, containerHeight: 36 },
    lg: { width: 180, containerHeight: 48 },
    xl: { width: 240, containerHeight: 56 },
  };
  
  const config = sizeConfig[size];
  
  return (
    <div 
      style={{ 
        marginTop: 28,
        marginBottom: 8,
        height: config.containerHeight,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <img 
        src={driivaLogoPath}
        alt="Driiva"
        style={{ 
          width: config.width,
          height: 'auto',
          objectFit: 'cover',
          objectPosition: 'center',
          transform: 'scale(1.6)',
        }}
      />
    </div>
  );
};
