import React from 'react';
import { SimbaLogo } from './SimbaLogo';

interface AetraLogoProps {
  className?: string;
  variant?: 'full' | 'compact' | 'icon' | 'badge' | 'white' | 'header';
}

export const AetraLogo: React.FC<AetraLogoProps> = ({ className = 'h-10', variant = 'full' }) => {
  const simbaVariant = variant === 'white' ? 'full' : variant;
  return <SimbaLogo className={className} variant={simbaVariant} />;
};
