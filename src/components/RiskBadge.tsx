import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { RiskLevel } from '@/types/gst';

interface RiskBadgeProps {
  level: RiskLevel;
  className?: string;
}

export default function RiskBadge({ level, className }: RiskBadgeProps) {
  const config = {
    low: { label: 'Low', classes: 'bg-primary/15 text-primary border-primary/30' },
    medium: { label: 'Medium', classes: 'bg-warning/15 text-warning border-warning/30' },
    high: { label: 'High', classes: 'bg-destructive/15 text-destructive border-destructive/30' },
  };

  return (
    <Badge variant="outline" className={cn('font-mono text-xs', config[level].classes, className)}>
      {config[level].label}
    </Badge>
  );
}
