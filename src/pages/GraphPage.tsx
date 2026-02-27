import { useGST } from '@/context/GSTContext';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Network } from 'lucide-react';
import { getRiskColor } from '@/lib/reconciliation';
import { GraphNode, GraphEdge, RiskLevel } from '@/types/gst';
import { useMemo, useState } from 'react';
import RiskBadge from '@/components/RiskBadge';
import RiskMeter from '@/components/RiskMeter';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';

// Simple force-graph using SVG instead of external dependency
function SimpleGraph({ nodes, edges, onNodeClick }: {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeClick: (id: string) => void;
}) {
  // Layout nodes in a circle
  const cx = 400, cy = 300, radius = 220;
  const positions = useMemo(() => {
    const map: Record<string, { x: number; y: number }> = {};
    nodes.forEach((n, i) => {
      const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2;
      map[n.id] = { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
    });
    return map;
  }, [nodes]);

  const typeColors: Record<string, string> = {
    buyer: 'hsl(187, 80%, 48%)',
    seller: 'hsl(160, 84%, 39%)',
    invoice: 'hsl(210, 20%, 92%)',
    gstr1: 'hsl(270, 60%, 55%)',
    gstr2b: 'hsl(38, 92%, 50%)',
    gstr3b: 'hsl(0, 72%, 51%)',
    payment: 'hsl(160, 84%, 39%)',
  };

  const typeShapes: Record<string, number> = {
    buyer: 14,
    seller: 14,
    invoice: 10,
    gstr1: 8,
    gstr2b: 8,
    gstr3b: 8,
    payment: 8,
  };

  return (
    <svg viewBox="0 0 800 600" className="w-full h-full">
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Edges */}
      {edges.map((edge, i) => {
        const from = positions[edge.source];
        const to = positions[edge.target];
        if (!from || !to) return null;
        const color = edge.riskLevel ? getRiskColor(edge.riskLevel) : 'hsl(222, 30%, 25%)';
        return (
          <g key={i}>
            <motion.line
              x1={from.x} y1={from.y} x2={to.x} y2={to.y}
              stroke={color}
              strokeWidth={edge.riskLevel === 'high' ? 2 : 1}
              opacity={0.6}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: i * 0.03 }}
            />
            <text
              x={(from.x + to.x) / 2}
              y={(from.y + to.y) / 2 - 5}
              fill="hsl(215, 15%, 52%)"
              fontSize="7"
              textAnchor="middle"
            >
              {edge.label}
            </text>
          </g>
        );
      })}

      {/* Nodes */}
      {nodes.map((node) => {
        const pos = positions[node.id];
        if (!pos) return null;
        const color = node.riskLevel ? getRiskColor(node.riskLevel) : typeColors[node.type];
        const r = typeShapes[node.type] || 10;
        return (
          <g key={node.id} onClick={() => onNodeClick(node.id)} className="cursor-pointer">
            <motion.circle
              cx={pos.x} cy={pos.y} r={r}
              fill={color}
              opacity={0.8}
              filter="url(#glow)"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.5 }}
              whileHover={{ scale: 1.3 }}
            />
            <text
              x={pos.x}
              y={pos.y + r + 12}
              fill="hsl(210, 20%, 75%)"
              fontSize="8"
              textAnchor="middle"
              fontFamily="'JetBrains Mono', monospace"
            >
              {node.label.length > 15 ? node.label.slice(0, 15) + '…' : node.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function GraphPage() {
  const { invoices, claims, reconciliations } = useGST();
  const [filter, setFilter] = useState('');
  const [selectedRec, setSelectedRec] = useState<string | null>(null);
  const [highRiskOnly, setHighRiskOnly] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const { nodes, edges } = useMemo(() => {
    const nodeMap = new Map<string, GraphNode>();
    const edgeList: GraphEdge[] = [];

    const filteredInvoices = invoices.filter(i => {
      const matchesFilter = !filter || i.invoiceNumber.toLowerCase().includes(filter.toLowerCase());
      if (!matchesFilter) return false;
      if (highRiskOnly) {
        const rec = reconciliations.find(r => r.invoiceNumber === i.invoiceNumber);
        return rec?.riskLevel === 'high';
      }
      return true;
    });

    filteredInvoices.forEach(inv => {
      const rec = reconciliations.find(r => r.invoiceNumber === inv.invoiceNumber);
      const risk = rec?.riskLevel;

      if (!nodeMap.has(inv.sellerGstin))
        nodeMap.set(inv.sellerGstin, { id: inv.sellerGstin, label: `Seller: ${inv.sellerGstin.slice(0, 8)}`, type: 'seller' });
      if (!nodeMap.has(inv.buyerGstin))
        nodeMap.set(inv.buyerGstin, { id: inv.buyerGstin, label: `Buyer: ${inv.buyerGstin.slice(0, 8)}`, type: 'buyer' });

      const invId = `inv-${inv.invoiceNumber}`;
      nodeMap.set(invId, { id: invId, label: inv.invoiceNumber, type: 'invoice', riskLevel: risk });
      edgeList.push({ source: inv.sellerGstin, target: invId, label: 'ISSUED_BY', riskLevel: risk });

      if (inv.gstr1Filed) {
        const gstr1Id = `gstr1-${inv.invoiceNumber}`;
        nodeMap.set(gstr1Id, { id: gstr1Id, label: 'GSTR-1', type: 'gstr1' });
        edgeList.push({ source: invId, target: gstr1Id, label: 'DECLARED_IN' });
      }

      if (inv.gstr3bFiled) {
        const gstr3bId = `gstr3b-${inv.invoiceNumber}`;
        nodeMap.set(gstr3bId, { id: gstr3bId, label: 'GSTR-3B', type: 'gstr3b' });
        edgeList.push({ source: invId, target: gstr3bId, label: 'FILED_IN' });
      }

      if (inv.taxPaid) {
        const payId = `pay-${inv.invoiceNumber}`;
        nodeMap.set(payId, { id: payId, label: 'Tax Paid ✓', type: 'payment' });
        edgeList.push({ source: invId, target: payId, label: 'TAX_PAID_FOR' });
      }

      // Buyer claim
      const claim = claims.find(c => c.invoiceNumber === inv.invoiceNumber);
      if (claim) {
        edgeList.push({ source: inv.buyerGstin, target: invId, label: 'CLAIMED_BY', riskLevel: risk });
        if (claim.presentInGstr2b) {
          const gstr2bId = `gstr2b-${inv.invoiceNumber}`;
          nodeMap.set(gstr2bId, { id: gstr2bId, label: 'GSTR-2B', type: 'gstr2b' });
          edgeList.push({ source: invId, target: gstr2bId, label: 'REFLECTED_IN' });
        }
      }
    });

    return { nodes: Array.from(nodeMap.values()), edges: edgeList };
  }, [invoices, claims, reconciliations, filter, highRiskOnly]);

  const handleNodeClick = (id: string) => {
    const invNum = id.replace('inv-', '');
    const rec = reconciliations.find(r => r.invoiceNumber === invNum);
    if (rec) setSelectedRec(rec.id);
  };

  const selectedRecData = reconciliations.find(r => r.id === selectedRec);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <Network className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Knowledge Graph</h1>
            <p className="text-sm text-muted-foreground">Real-time GST transaction network visualization</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {isAdmin && (
            <div className="flex items-center gap-2">
              <Switch id="high-risk" checked={highRiskOnly} onCheckedChange={setHighRiskOnly} />
              <Label htmlFor="high-risk" className="text-xs text-muted-foreground cursor-pointer">Show High Risk Only</Label>
            </div>
          )}
          <Input
            placeholder="Filter by invoice number…"
            className="w-64"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
        </div>
      </div>

      <Card className="bg-card border-border p-2 min-h-[500px]">
        {nodes.length === 0 ? (
          <div className="flex items-center justify-center h-[500px] text-muted-foreground text-sm">
            No graph data yet. Add invoices and claims to see the knowledge graph.
          </div>
        ) : (
          <SimpleGraph nodes={nodes} edges={edges} onNodeClick={handleNodeClick} />
        )}
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs">
        {[
          { type: 'seller', label: 'Seller', color: 'hsl(160, 84%, 39%)' },
          { type: 'buyer', label: 'Buyer', color: 'hsl(187, 80%, 48%)' },
          { type: 'invoice', label: 'Invoice', color: 'hsl(210, 20%, 92%)' },
          { type: 'gstr1', label: 'GSTR-1', color: 'hsl(270, 60%, 55%)' },
          { type: 'gstr2b', label: 'GSTR-2B', color: 'hsl(38, 92%, 50%)' },
          { type: 'gstr3b', label: 'GSTR-3B', color: 'hsl(0, 72%, 51%)' },
          { type: 'payment', label: 'Payment', color: 'hsl(160, 84%, 39%)' },
        ].map(item => (
          <div key={item.type} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Audit Dialog */}
      <Dialog open={!!selectedRecData} onOpenChange={() => setSelectedRec(null)}>
        <DialogContent className="max-w-lg">
          {selectedRecData && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  Audit Trail — {selectedRecData.invoiceNumber}
                  <RiskBadge level={selectedRecData.riskLevel} />
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <RiskMeter score={selectedRecData.riskScore} size="lg" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Root Cause</p>
                  <p className="text-sm font-medium">{selectedRecData.rootCause}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Explanation</p>
                  <p className="text-sm leading-relaxed">{selectedRecData.explanation}</p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
