import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface RiskMeterProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function RiskMeter({ score, size = 'md', showLabel = true }: RiskMeterProps) {
  const clampedScore = Math.min(100, Math.max(0, score));
  const level = clampedScore <= 30 ? 'low' : clampedScore <= 60 ? 'medium' : 'high';

  const colors = {
    low: { bar: 'bg-primary', text: 'text-primary', label: 'Low Risk' },
    medium: { bar: 'bg-warning', text: 'text-warning', label: 'Medium Risk' },
    high: { bar: 'bg-destructive', text: 'text-destructive', label: 'High Risk' },
  };

  const heights = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' };

  return (
    <div className="space-y-1.5">
      {showLabel && (
        <div className="flex justify-between items-center">
          <span className={cn('text-xs font-medium', colors[level].text)}>{colors[level].label}</span>
          <span className="text-xs font-mono text-muted-foreground">{clampedScore}/100</span>
        </div>
      )}
      <div className={cn('w-full rounded-full bg-secondary overflow-hidden', heights[size])}>
        <motion.div
          className={cn('h-full rounded-full', colors[level].bar)}
          initial={{ width: 0 }}
          animate={{ width: `${clampedScore}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
