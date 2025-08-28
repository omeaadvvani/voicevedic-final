import React from 'react';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 'medium', className = '' }) => {
  const sizeClasses = {
    small: 'w-24 h-24',      // Increased from w-20 h-20 (80px to 96px)
    medium: 'w-32 h-32',     // Increased from w-28 h-28 (112px to 128px)
    large: 'w-40 h-40'       // Increased from w-36 h-36 (144px to 160px)
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Logo Icon - Using actual image (includes text) */}
      <div className={`${sizeClasses[size]} relative`}>
        <img 
          src="/src/assets/logo.png" 
          alt="VoiceVedic Logo"
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  );
};

export default Logo;
