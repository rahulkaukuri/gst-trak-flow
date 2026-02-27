import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Zap } from 'lucide-react';
import { GraphSageResult } from '@/lib/graphSageSimulator';
import { GATEdgeResult } from '@/lib/gatSimulator';
import { motion } from 'framer-motion';

interface GraphMLPanelProps {
  graphSageResults: GraphSageResult[];
  gatResults: GATEdgeResult[];
}

export default function GraphMLPanel({ graphSageResults, gatResults }: GraphMLPanelProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* GraphSAGE */}
      <Card className="bg-card border-border p-6">
        <h2 className="text-sm font-semibold mb-4 uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Brain className="w-4 h-4 text-accent" />
          GraphSAGE Node Classification
        </h2>
        {graphSageResults.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-6">No data for analysis</p>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {graphSageResults.map((r, i) => (
              <motion.div
                key={r.gstin}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/30"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs">{r.gstin.slice(0, 12)}…</span>
                    <Badge variant="outline" className="text-[10px]">{r.type}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Neighbor avg risk: {r.neighborAvgRisk}</p>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className={
                    r.classification === 'Fraud Suspect'
                      ? 'bg-destructive/15 text-destructive border-destructive/30'
                      : r.classification === 'Watchlist'
                        ? 'bg-warning/15 text-warning border-warning/30'
                        : 'bg-primary/15 text-primary border-primary/30'
                  }>
                    {r.classification}
                  </Badge>
                  <p className="text-xs font-mono mt-1">Score: {r.fraudScore}%</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Card>

      {/* GAT */}
      <Card className="bg-card border-border p-6">
        <h2 className="text-sm font-semibold mb-4 uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Zap className="w-4 h-4 text-warning" />
          GAT Edge Attention Scores
        </h2>
        {gatResults.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-6">No data for analysis</p>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {gatResults.map((r, i) => (
              <motion.div
                key={r.invoiceNumber}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/30"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs">{r.invoiceNumber}</span>
                    {r.isSuspicious && (
                      <Badge variant="outline" className="bg-destructive/15 text-destructive border-destructive/30 text-[10px]">
                        Suspicious
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 max-w-[250px] truncate">{r.explanation}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm font-bold" style={{
                    color: r.attentionScore > 0.7 ? 'hsl(0, 72%, 51%)' : r.attentionScore > 0.3 ? 'hsl(38, 92%, 50%)' : 'hsl(160, 84%, 39%)'
                  }}>
                    {r.attentionScore}
                  </p>
                  <p className="text-[10px] text-muted-foreground">attention</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
