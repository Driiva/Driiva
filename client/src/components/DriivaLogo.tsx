import driivaLogoPath from '@assets/driiva_logo_CLEAR_FINAL_1769213316951.png';

interface DriivaLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const DriivaLogo: React.FC<DriivaLogoProps> = ({ size = 'lg' }) => {
  const sizeConfig = {
    sm: { width: 100 },
    md: { width: 140 },
    lg: { width: 180 },
    xl: { width: 220 },
  };
  
  const config = sizeConfig[size];
  
  return (
    <div 
      className="flex items-center justify-center"
      style={{ 
        marginTop: 32,
        marginBottom: 14,
        display: 'block',
        lineHeight: 0,
      }}
    >
      <img 
        src={driivaLogoPath}
        alt="Driiva"
        style={{ 
          width: config.width,
          height: 'auto',
          objectFit: 'contain',
          display: 'block',
        }}
      />
    </div>
  );
};
