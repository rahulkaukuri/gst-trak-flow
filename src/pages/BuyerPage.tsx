import { useState } from 'react';
import { useGST } from '@/context/GSTContext';
import { useAuth } from '@/context/AuthContext';
import { BuyerClaim } from '@/types/gst';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { ShoppingCart, Plus, DollarSign, ShieldAlert, ShieldCheck } from 'lucide-react';
import StatCard from '@/components/StatCard';
import { Badge } from '@/components/ui/badge';
import RiskMeter from '@/components/RiskMeter';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function BuyerPage() {
  const { addClaim, claims, reconciliations } = useGST();
  const { user } = useAuth();
  const [form, setForm] = useState({
    buyerGstin: user?.gstin || '',
    sellerGstin: '',
    invoiceNumber: '',
    itcClaimedAmount: '',
    presentInGstr2b: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const claim: BuyerClaim = {
      id: `claim-${Date.now()}`,
      buyerGstin: form.buyerGstin,
      sellerGstin: form.sellerGstin,
      invoiceNumber: form.invoiceNumber,
      itcClaimedAmount: parseFloat(form.itcClaimedAmount) || 0,
      presentInGstr2b: form.presentInGstr2b,
      createdAt: new Date().toISOString(),
    };
    addClaim(claim);
    setForm(f => ({ ...f, sellerGstin: '', invoiceNumber: '', itcClaimedAmount: '', presentInGstr2b: true }));
  };

  // Filter to buyer's own if GSTIN available
  const myRecs = user?.gstin ? reconciliations.filter(r => r.buyerGstin === user.gstin) : reconciliations;
  const totalClaimed = myRecs.reduce((s, r) => s + (r.buyerClaim?.itcClaimedAmount || 0), 0);
  const validITC = myRecs.filter(r => r.itcStatus === 'VALID').reduce((s, r) => s + (r.buyerClaim?.itcClaimedAmount || 0), 0);
  const riskITC = totalClaimed - validITC;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
          <ShoppingCart className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Buyer Portal</h1>
          <p className="text-sm text-muted-foreground">Claim ITC and track invoice status</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total ITC Claimed" value={`₹${totalClaimed.toLocaleString()}`} icon={DollarSign} />
        <StatCard title="Valid ITC" value={`₹${validITC.toLocaleString()}`} icon={ShieldCheck} variant="success" />
        <StatCard title="ITC at Risk" value={`₹${riskITC.toLocaleString()}`} icon={ShieldAlert} variant={riskITC > 0 ? 'danger' : 'success'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-accent" /> Claim ITC
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Buyer GSTIN</Label>
                <Input placeholder="27BBBBB0000B1Z3" value={form.buyerGstin} onChange={e => setForm(f => ({ ...f, buyerGstin: e.target.value }))} required />
              </div>
              <div>
                <Label className="text-xs">Seller GSTIN</Label>
                <Input placeholder="22AAAAA0000A1Z5" value={form.sellerGstin} onChange={e => setForm(f => ({ ...f, sellerGstin: e.target.value }))} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Invoice Number</Label>
                <Input placeholder="INV-001" value={form.invoiceNumber} onChange={e => setForm(f => ({ ...f, invoiceNumber: e.target.value }))} required />
              </div>
              <div>
                <Label className="text-xs">ITC Claimed Amount (₹)</Label>
                <Input type="number" placeholder="18000" value={form.itcClaimedAmount} onChange={e => setForm(f => ({ ...f, itcClaimedAmount: e.target.value }))} required />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.presentInGstr2b} onCheckedChange={v => setForm(f => ({ ...f, presentInGstr2b: v }))} />
              <Label className="text-xs">Invoice Present in GSTR-2B</Label>
            </div>
            <Button type="submit" className="w-full">Submit ITC Claim</Button>
          </form>
        </Card>

        <Card className="bg-card border-border p-6 overflow-auto">
          <h2 className="text-lg font-semibold mb-4">Invoice Status</h2>
          {myRecs.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-10">No claims yet.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {myRecs.slice().reverse().map((rec, i) => (
                  <motion.tr key={rec.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                    <td className="text-foreground">{rec.invoiceNumber}</td>
                    <td>₹{rec.buyerClaim?.itcClaimedAmount.toLocaleString()}</td>
                    <td>
                      <Badge variant="outline" className={
                        rec.itcStatus === 'VALID'
                          ? 'bg-primary/15 text-primary border-primary/30 text-xs'
                          : rec.itcStatus === 'AT_RISK'
                            ? 'bg-warning/15 text-warning border-warning/30 text-xs'
                            : 'bg-destructive/15 text-destructive border-destructive/30 text-xs'
                      }>
                        {rec.itcStatus}
                      </Badge>
                    </td>
                    <td>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-xs text-accent">View</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                          <DialogHeader>
                            <DialogTitle>Invoice {rec.invoiceNumber}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-3">
                            <div>
                              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Status</p>
                              <p className="text-sm font-medium">{rec.itcStatus}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Details</p>
                              <p className="text-sm leading-relaxed">{rec.explanation}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                              <div><span className="text-muted-foreground">Seller:</span> {rec.sellerGstin}</div>
                              <div><span className="text-muted-foreground">Buyer:</span> {rec.buyerGstin}</div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
}
