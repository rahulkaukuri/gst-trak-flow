import { useState } from 'react';
import { useGST } from '@/context/GSTContext';
import { SellerInvoice } from '@/types/gst';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { FileText, Plus, CheckCircle2, AlertTriangle } from 'lucide-react';
import StatCard from '@/components/StatCard';
import RiskBadge from '@/components/RiskBadge';
import RiskMeter from '@/components/RiskMeter';

export default function SellerPage() {
  const { addInvoice, invoices, reconciliations } = useGST();
  const [form, setForm] = useState({
    sellerGstin: '',
    buyerGstin: '',
    invoiceNumber: '',
    invoiceDate: '',
    taxableAmount: '',
    cgst: '',
    sgst: '',
    igst: '',
    gstr1Filed: true,
    gstr3bFiled: true,
    taxPaid: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const taxable = parseFloat(form.taxableAmount) || 0;
    const cgst = parseFloat(form.cgst) || 0;
    const sgst = parseFloat(form.sgst) || 0;
    const igst = parseFloat(form.igst) || 0;

    const invoice: SellerInvoice = {
      id: `inv-${Date.now()}`,
      sellerGstin: form.sellerGstin,
      buyerGstin: form.buyerGstin,
      invoiceNumber: form.invoiceNumber,
      invoiceDate: form.invoiceDate,
      taxableAmount: taxable,
      cgst, sgst, igst,
      totalValue: taxable + cgst + sgst + igst,
      gstr1Filed: form.gstr1Filed,
      gstr3bFiled: form.gstr3bFiled,
      taxPaid: form.taxPaid,
      createdAt: new Date().toISOString(),
    };

    addInvoice(invoice);
    setForm({
      sellerGstin: form.sellerGstin,
      buyerGstin: '',
      invoiceNumber: '',
      invoiceDate: '',
      taxableAmount: '',
      cgst: '',
      sgst: '',
      igst: '',
      gstr1Filed: true,
      gstr3bFiled: true,
      taxPaid: true,
    });
  };

  const totalIssued = invoices.length;
  const filedCount = invoices.filter(i => i.gstr1Filed && i.gstr3bFiled).length;
  const compliancePct = totalIssued > 0 ? Math.round((filedCount / totalIssued) * 100) : 100;
  const pendingTax = invoices.filter(i => !i.taxPaid).reduce((sum, i) => sum + i.totalValue, 0);
  const sellerRecs = reconciliations.filter(r => invoices.some(i => i.sellerGstin === r.sellerGstin));
  const alerts = sellerRecs.filter(r => r.riskLevel === 'high').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <FileText className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Seller Portal</h1>
          <p className="text-sm text-muted-foreground">Issue invoices and manage compliance</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Invoices Issued" value={totalIssued} icon={FileText} variant="default" />
        <StatCard title="Filing Compliance" value={`${compliancePct}%`} icon={CheckCircle2} variant="success" />
        <StatCard title="Pending Tax" value={`₹${pendingTax.toLocaleString()}`} icon={AlertTriangle} variant={pendingTax > 0 ? 'warning' : 'success'} />
        <StatCard title="Risk Alerts" value={alerts} icon={AlertTriangle} variant={alerts > 0 ? 'danger' : 'success'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <Card className="bg-card border-border p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" /> Add Invoice
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Seller GSTIN</Label>
                <Input placeholder="22AAAAA0000A1Z5" value={form.sellerGstin} onChange={e => setForm(f => ({ ...f, sellerGstin: e.target.value }))} required />
              </div>
              <div>
                <Label className="text-xs">Buyer GSTIN</Label>
                <Input placeholder="27BBBBB0000B1Z3" value={form.buyerGstin} onChange={e => setForm(f => ({ ...f, buyerGstin: e.target.value }))} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Invoice Number</Label>
                <Input placeholder="INV-001" value={form.invoiceNumber} onChange={e => setForm(f => ({ ...f, invoiceNumber: e.target.value }))} required />
              </div>
              <div>
                <Label className="text-xs">Invoice Date</Label>
                <Input type="date" value={form.invoiceDate} onChange={e => setForm(f => ({ ...f, invoiceDate: e.target.value }))} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Taxable Amount (₹)</Label>
                <Input type="number" placeholder="100000" value={form.taxableAmount} onChange={e => setForm(f => ({ ...f, taxableAmount: e.target.value }))} required />
              </div>
              <div>
                <Label className="text-xs">IGST (₹)</Label>
                <Input type="number" placeholder="18000" value={form.igst} onChange={e => setForm(f => ({ ...f, igst: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">CGST (₹)</Label>
                <Input type="number" placeholder="9000" value={form.cgst} onChange={e => setForm(f => ({ ...f, cgst: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">SGST (₹)</Label>
                <Input type="number" placeholder="9000" value={form.sgst} onChange={e => setForm(f => ({ ...f, sgst: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="flex items-center gap-2">
                <Switch checked={form.gstr1Filed} onCheckedChange={v => setForm(f => ({ ...f, gstr1Filed: v }))} />
                <Label className="text-xs">GSTR-1 Filed</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.gstr3bFiled} onCheckedChange={v => setForm(f => ({ ...f, gstr3bFiled: v }))} />
                <Label className="text-xs">GSTR-3B Filed</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.taxPaid} onCheckedChange={v => setForm(f => ({ ...f, taxPaid: v }))} />
                <Label className="text-xs">Tax Paid</Label>
              </div>
            </div>

            <Button type="submit" className="w-full">Submit Invoice</Button>
          </form>
        </Card>

        {/* Invoice Table */}
        <Card className="bg-card border-border p-6 overflow-auto">
          <h2 className="text-lg font-semibold mb-4">Recent Invoices</h2>
          {invoices.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-10">No invoices yet. Add one to get started.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Buyer</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.slice().reverse().map((inv, i) => (
                  <motion.tr key={inv.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                    <td className="text-foreground">{inv.invoiceNumber}</td>
                    <td className="text-xs">{inv.buyerGstin.slice(0, 10)}…</td>
                    <td>₹{inv.totalValue.toLocaleString()}</td>
                    <td>
                      {inv.gstr1Filed && inv.gstr3bFiled && inv.taxPaid
                        ? <RiskBadge level="low" />
                        : inv.taxPaid
                          ? <RiskBadge level="medium" />
                          : <RiskBadge level="high" />
                      }
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
