import { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import clsx from 'clsx';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: ReactNode;
  iconBg: string;
  accent?: string;
  suffix?: string;
}

export default function MetricCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  iconBg,
  accent = 'border-transparent',
  suffix,
}: MetricCardProps) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;

  return (
    <div className={clsx(
      'bg-white rounded-xl p-5 shadow-sm border-l-4 hover:shadow-md transition-shadow',
      accent
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className={clsx('p-2.5 rounded-lg', iconBg)}>
          {icon}
        </div>
        {change !== undefined && (
          <div className={clsx(
            'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full',
            isPositive ? 'bg-green-50 text-green-600' : isNegative ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-500'
          )}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : isNegative ? <TrendingDown className="w-3 h-3" /> : null}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-maersk-navy">
          {value}{suffix && <span className="text-base font-medium text-gray-400 ml-1">{suffix}</span>}
        </p>
        {changeLabel && (
          <p className="text-xs text-gray-400">{changeLabel}</p>
        )}
      </div>
    </div>
  );
}
