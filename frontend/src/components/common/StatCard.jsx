import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

export const StatCard = ({ title, value, subtitle, comparison, sparklineData = null }) => {
  const secondaryLine = comparison ? comparison.text : subtitle;
  const secondaryClass = comparison
    ? comparison.isNeutral
      ? 'stat-meta'
      : comparison.isPositive
        ? 'stat-meta stat-meta-positive'
        : 'stat-meta stat-meta-negative'
    : 'stat-meta';

  const hasSparkline = Array.isArray(sparklineData) && sparklineData.length > 0;

  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <div className="stat-card-main">
          <div className="stat-title">{title}</div>
          <div className="stat-value tabular-nums">{value}</div>
        </div>
        {hasSparkline && (
          <div className="stat-sparkline" aria-hidden="true">
            <ResponsiveContainer width="100%" height={36}>
              <LineChart data={sparklineData}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="var(--accent)"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      {secondaryLine && (
        <div className={secondaryClass} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          {comparison && !comparison.isNeutral && (
            comparison.isPositive
              ? <ArrowUp size={13} aria-hidden="true" />
              : <ArrowDown size={13} aria-hidden="true" />
          )}
          <span>{secondaryLine}</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
