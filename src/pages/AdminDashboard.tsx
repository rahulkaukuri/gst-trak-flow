import { useGST } from '@/context/GSTContext';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Users, FileText, ShieldAlert, AlertTriangle, Brain, Gauge } from 'lucide-react';
import StatCard from '@/components/StatCard';
import RiskMeter from '@/components/RiskMeter';
import RiskBadge from '@/components/RiskBadge';
import FraudPanel from '@/components/FraudPanel';
import GraphMLPanel from '@/components/GraphMLPanel';
import { Card } from '@/components/ui/card';
import { getVendorRiskLevel } from '@/lib/reconciliation';
import { runGraphSage } from '@/lib/graphSageSimulator';
import { runGAT } from '@/lib/gatSimulator';
import { detectFraud } from '@/lib/fraudDetectionEngine';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function AdminDashboard() {
  const { invoices, claims, reconciliations } = useGST();

  const uniqueBuyers = new Set(claims.map(c => c.buyerGstin)).size;
  const uniqueSellers = new Set(invoices.map(i => i.sellerGstin)).size;
  const totalITCClaimed = reconciliations.reduce((s, r) => s + (r.buyerClaim?.itcClaimedAmount || 0), 0);
  const validITC = reconciliations.filter(r => r.itcStatus === 'VALID').reduce((s, r) => s + (r.buyerClaim?.itcClaimedAmount || 0), 0);
  const totalITCAtRisk = totalITCClaimed - validITC;
  const highRiskITC = reconciliations.filter(r => r.riskLevel === 'high').reduce((s, r) => s + (r.buyerClaim?.itcClaimedAmount || 0), 0);
  const avgRisk = reconciliations.length > 0 ? Math.round(reconciliations.reduce((s, r) => s + r.riskScore, 0) / reconciliations.length) : 0;

  // AI simulation results
  const graphSageResults = useMemo(() => runGraphSage(reconciliations), [reconciliations]);
  const gatResults = useMemo(() => runGAT(reconciliations), [reconciliations]);
  const fraudEntities = useMemo(() => detectFraud(reconciliations, graphSageResults, gatResults), [reconciliations, graphSageResults, gatResults]);

  // Charts
  const riskDistribution = [
    { name: 'Low', value: reconciliations.filter(r => r.riskLevel === 'low').length, color: 'hsl(160, 84%, 39%)' },
    { name: 'Medium', value: reconciliations.filter(r => r.riskLevel === 'medium').length, color: 'hsl(38, 92%, 50%)' },
    { name: 'High', value: reconciliations.filter(r => r.riskLevel === 'high').length, color: 'hsl(0, 72%, 51%)' },
  ];

  const rootCauseData = reconciliations.reduce((acc, r) => {
    const existing = acc.find(a => a.name === r.rootCause);
    if (existing) existing.count++;
    else acc.push({ name: r.rootCause, count: 1 });
    return acc;
  }, [] as { name: string; count: number }[]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-warning" />
        </div>
        <div>
          <h1 className="text-xl font-bold">National ITC Risk Engine</h1>
          <p className="text-sm text-muted-foreground">Government GST Authority — Fraud Detection & Risk Intelligence</p>
        </div>
      </div>

      {/* National ITC Stats */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <StatCard title="Buyers" value={uniqueBuyers} icon={Users} />
        <StatCard title="Sellers" value={uniqueSellers} icon={Users} />
        <StatCard title="Total ITC Claimed" value={`₹${totalITCClaimed.toLocaleString()}`} icon={FileText} />
        <StatCard title="Valid ITC" value={`₹${validITC.toLocaleString()}`} icon={FileText} variant="success" />
        <StatCard title="ITC at Risk" value={`₹${totalITCAtRisk.toLocaleString()}`} icon={ShieldAlert} variant={totalITCAtRisk > 0 ? 'danger' : 'success'} />
        <div className="stat-card">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Fraud Probability</p>
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-destructive" />
            <span className="text-2xl font-bold font-mono">{avgRisk}</span>
            <span className="text-xs text-muted-foreground">/100</span>
          </div>
          <RiskMeter score={avgRisk} size="sm" showLabel={false} />
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-card border-border p-6">
          <h2 className="text-sm font-semibold mb-4 uppercase tracking-wider text-muted-foreground">Risk Distribution</h2>
          {reconciliations.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-10">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={riskDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                  {riskDistribution.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'hsl(222, 44%, 9%)', border: '1px solid hsl(222, 30%, 18%)', borderRadius: '8px', color: 'hsl(210, 20%, 92%)' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="flex justify-center gap-4 mt-2">
            {riskDistribution.map(d => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-muted-foreground">{d.name}: {d.value}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="bg-card border-border p-6 col-span-1 lg:col-span-2">
          <h2 className="text-sm font-semibold mb-4 uppercase tracking-wider text-muted-foreground">Root Cause Analysis</h2>
          {rootCauseData.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-10">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={rootCauseData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(215, 15%, 52%)' }} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(215, 15%, 52%)' }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(222, 44%, 9%)', border: '1px solid hsl(222, 30%, 18%)', borderRadius: '8px', color: 'hsl(210, 20%, 92%)' }} />
                <Bar dataKey="count" fill="hsl(187, 80%, 48%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Fraud Detection */}
      <FraudPanel entities={fraudEntities} />

      {/* Graph ML */}
      <GraphMLPanel graphSageResults={graphSageResults} gatResults={gatResults} />

      {/* ITC Risk Intelligence */}
      <Card className="bg-card border-border p-6 overflow-auto">
        <h2 className="text-sm font-semibold mb-4 uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Brain className="w-4 h-4 text-accent" />
          ITC Risk Intelligence — High Risk Invoices
        </h2>
        {reconciliations.filter(r => r.riskLevel === 'high').length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-6">No high-risk invoices detected.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Seller</th>
                <th>Buyer</th>
                <th>ITC Amount</th>
                <th>Risk Score</th>
                <th>Root Cause</th>
                <th>GAT Attention</th>
              </tr>
            </thead>
            <tbody>
              {reconciliations.filter(r => r.riskLevel === 'high').map((rec, i) => {
                const gat = gatResults.find(g => g.invoiceNumber === rec.invoiceNumber);
                return (
                  <motion.tr key={rec.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                    <td className="text-foreground">{rec.invoiceNumber}</td>
                    <td className="text-xs">{rec.sellerGstin.slice(0, 10)}…</td>
                    <td className="text-xs">{rec.buyerGstin.slice(0, 10)}…</td>
                    <td>₹{(rec.buyerClaim?.itcClaimedAmount || 0).toLocaleString()}</td>
                    <td><RiskBadge level={rec.riskLevel} /></td>
                    <td className="text-xs text-muted-foreground max-w-[180px] truncate">{rec.rootCause}</td>
                    <td className="font-mono text-xs" style={{ color: (gat?.attentionScore || 0) > 0.5 ? 'hsl(0, 72%, 51%)' : 'hsl(38, 92%, 50%)' }}>
                      {gat?.attentionScore || '—'}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      {/* All Reconciliations */}
      <Card className="bg-card border-border p-6 overflow-auto">
        <h2 className="text-sm font-semibold mb-4 uppercase tracking-wider text-muted-foreground">All Reconciliations</h2>
        {reconciliations.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-6">No reconciliation records.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Seller</th>
                <th>Buyer</th>
                <th>ITC Status</th>
                <th>Risk</th>
                <th>Root Cause</th>
              </tr>
            </thead>
            <tbody>
              {reconciliations.slice().reverse().map((rec, i) => (
                <motion.tr key={rec.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                  <td className="text-foreground">{rec.invoiceNumber}</td>
                  <td className="text-xs">{rec.sellerGstin.slice(0, 10)}…</td>
                  <td className="text-xs">{rec.buyerGstin.slice(0, 10)}…</td>
                  <td className="text-xs font-medium">{rec.itcStatus}</td>
                  <td><RiskBadge level={rec.riskLevel} /></td>
                  <td className="text-xs text-muted-foreground max-w-[200px] truncate">{rec.rootCause}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
