import React from 'react';
import PropTypes from 'prop-types';
import GlassCard from './GlassCard';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * StatCard - Tarjeta de estadística con diseño moderno
 */
const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend = null, // 'up' | 'down' | 'neutral' | null
  trendValue,
  color = 'green', // 'green' | 'cyan' | 'red' | 'yellow'
  className = '',
  onClick
}) => {
  const colorClasses = {
    green: 'text-[var(--accent-green)]',
    cyan: 'text-[var(--accent-cyan)]',
    red: 'text-[var(--accent-red)]',
    yellow: 'text-[var(--accent-yellow)]'
  };

  const trendIcons = {
    up: TrendingUp,
    down: TrendingDown,
    neutral: Minus
  };

  const trendColors = {
    up: 'text-green-500',
    down: 'text-red-500',
    neutral: 'text-gray-500'
  };

  const TrendIcon = trend ? trendIcons[trend] : null;

  return (
    <GlassCard 
      className={`p-6 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      hover={!!onClick}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-[var(--text-secondary)] font-medium mb-1">
            {title}
          </p>
          <h3 className={`text-3xl font-bold ${colorClasses[color]} mb-1`}>
            {value}
          </h3>
          {subtitle && (
            <p className="text-xs text-[var(--text-secondary)]">
              {subtitle}
            </p>
          )}
          {trendValue && TrendIcon && (
            <div className={`flex items-center gap-1 mt-2 ${trendColors[trend]}`}>
              <TrendIcon className="w-4 h-4" />
              <span className="text-sm font-medium">{trendValue}</span>
            </div>
          )}
        </div>
        
        {Icon && (
          <div className={`p-3 rounded-xl ${colorClasses[color]} bg-opacity-10`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </GlassCard>
  );
};

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  subtitle: PropTypes.string,
  icon: PropTypes.elementType,
  trend: PropTypes.oneOf(['up', 'down', 'neutral', null]),
  trendValue: PropTypes.string,
  color: PropTypes.oneOf(['green', 'cyan', 'red', 'yellow']),
  className: PropTypes.string,
  onClick: PropTypes.func,
};

export default StatCard;
