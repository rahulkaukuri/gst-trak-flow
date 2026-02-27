import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { AlertTriangle, UserX, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { FraudEntity } from '@/lib/fraudDetectionEngine';
import RiskMeter from './RiskMeter';

interface FraudPanelProps {
  entities: FraudEntity[];
}

export default function FraudPanel({ entities }: FraudPanelProps) {
  const suspects = entities.filter(e => e.label === 'Fraud Suspect');
  const watchlist = entities.filter(e => e.label === 'Watchlist');

  return (
    <Card className="bg-card border-border p-6">
      <h2 className="text-sm font-semibold mb-4 uppercase tracking-wider text-muted-foreground flex items-center gap-2">
        <UserX className="w-4 h-4 text-destructive" />
        Fraud Detection Panel
      </h2>

      {suspects.length === 0 && watchlist.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-6">No fraud suspects detected yet.</p>
      ) : (
        <div className="space-y-3">
          {[...suspects, ...watchlist].map((entity, i) => (
            <motion.div
              key={entity.gstin}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-4 rounded-lg bg-secondary/50 border border-border space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={entity.label === 'Fraud Suspect'
                    ? 'bg-destructive/15 text-destructive border-destructive/30 animate-pulse'
                    : 'bg-warning/15 text-warning border-warning/30'
                  }>
                    {entity.label}
                  </Badge>
                  <span className="font-mono text-xs">{entity.gstin}</span>
                  <Badge variant="outline" className="text-xs">
                    {entity.type === 'seller' ? 'Seller' : 'Buyer'}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingUp className="w-3 h-3" />
                  Confidence: {entity.confidenceScore}%
                </div>
              </div>
              <RiskMeter score={entity.confidenceScore} size="sm" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{entity.invoiceCount} invoices · {entity.highRiskPct}% high-risk</span>
                <span>₹{entity.totalITCAtRisk.toLocaleString()} at risk</span>
              </div>
              <p className="text-xs text-muted-foreground">{entity.justification}</p>
            </motion.div>
          ))}
        </div>
      )}
    </Card>
  );
}
