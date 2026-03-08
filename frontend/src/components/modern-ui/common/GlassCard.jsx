import React from 'react';
import PropTypes from 'prop-types';

/**
 * GlassCard - Card component with glass-morphism effect
 * Based on Stitch AI Design System
 */
const GlassCard = ({ 
  children, 
  className = '', 
  hover = false,
  glow = null, // 'green' | 'cyan' | null
  gradient = null, // 'green' | 'cyan' | 'red' | null
  onClick,
  ...props 
}) => {
  const baseClasses = 'glass-card';
  const hoverClasses = hover ? 'glass-card-hover' : '';
  const glowClasses = glow ? `glass-card-glow-${glow}` : '';
  const gradientClasses = gradient ? `gradient-bg-${gradient}` : '';
  
  const combinedClasses = [
    baseClasses,
    hoverClasses,
    glowClasses,
    gradientClasses,
    className
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={combinedClasses}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

GlassCard.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  hover: PropTypes.bool,
  glow: PropTypes.oneOf(['green', 'cyan', null]),
  gradient: PropTypes.oneOf(['green', 'cyan', 'red', null]),
  onClick: PropTypes.func,
};

export default GlassCard;
