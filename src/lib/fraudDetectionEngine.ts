import { ReconciliationResult } from '@/types/gst';
import { GraphSageResult } from './graphSageSimulator';
import { GATEdgeResult } from './gatSimulator';

export interface FraudEntity {
  gstin: string;
  type: 'buyer' | 'seller';
  label: 'Fraud Suspect' | 'Watchlist' | 'Clean';
  confidenceScore: number;
  totalITCAtRisk: number;
  invoiceCount: number;
  highRiskPct: number;
  justification: string;
}

export function detectFraud(
  reconciliations: ReconciliationResult[],
  graphSageResults: GraphSageResult[],
  gatResults: GATEdgeResult[]
): FraudEntity[] {
  const entities: FraudEntity[] = [];

  // Seller fraud detection
  const sellerMap = new Map<string, ReconciliationResult[]>();
  reconciliations.forEach(r => {
    const arr = sellerMap.get(r.sellerGstin) || [];
    arr.push(r);
    sellerMap.set(r.sellerGstin, arr);
  });

  sellerMap.forEach((recs, gstin) => {
    const highRisk = recs.filter(r => r.riskLevel === 'high').length;
    const highRiskPct = (highRisk / recs.length) * 100;
    const totalITCAtRisk = recs.filter(r => r.riskLevel !== 'low').reduce((s, r) => s + (r.buyerClaim?.itcClaimedAmount || 0), 0);
    const gsResult = graphSageResults.find(g => g.gstin === gstin);

    const isFraud = highRiskPct > 50 || (gsResult && gsResult.fraudScore > 70);
    const isWatchlist = highRiskPct > 25 || (gsResult && gsResult.fraudScore > 40);

    const justifications: string[] = [];
    if (highRiskPct > 50) justifications.push(`${Math.round(highRiskPct)}% invoices are high-risk`);
    if (totalITCAtRisk > 0) justifications.push(`₹${totalITCAtRisk.toLocaleString()} ITC at risk`);
    if (gsResult && gsResult.fraudScore > 70) justifications.push(`GraphSAGE score: ${gsResult.fraudScore}%`);

    entities.push({
      gstin,
      type: 'seller',
      label: isFraud ? 'Fraud Suspect' : isWatchlist ? 'Watchlist' : 'Clean',
      confidenceScore: gsResult?.confidence || Math.round(50 + highRiskPct * 0.5),
      totalITCAtRisk,
      invoiceCount: recs.length,
      highRiskPct: Math.round(highRiskPct),
      justification: justifications.join('. ') || 'No anomalies detected.',
    });
  });

  // Buyer fraud detection
  const buyerMap = new Map<string, ReconciliationResult[]>();
  reconciliations.forEach(r => {
    const arr = buyerMap.get(r.buyerGstin) || [];
    arr.push(r);
    buyerMap.set(r.buyerGstin, arr);
  });

  buyerMap.forEach((recs, gstin) => {
    const noSupplierFiling = recs.filter(r => r.rootCause === 'Invoice Not Found in Seller Records').length;
    const fraudPct = (noSupplierFiling / recs.length) * 100;
    const totalClaimed = recs.reduce((s, r) => s + (r.buyerClaim?.itcClaimedAmount || 0), 0);
    const gsResult = graphSageResults.find(g => g.gstin === gstin);

    const isFraud = fraudPct > 50 || (gsResult && gsResult.fraudScore > 70);
    const isWatchlist = fraudPct > 20 || (gsResult && gsResult.fraudScore > 40);

    const justifications: string[] = [];
    if (noSupplierFiling > 0) justifications.push(`${noSupplierFiling} claims without supplier filing`);
    if (gsResult && gsResult.fraudScore > 40) justifications.push(`GraphSAGE score: ${gsResult.fraudScore}%`);

    entities.push({
      gstin,
      type: 'buyer',
      label: isFraud ? 'Fraud Suspect' : isWatchlist ? 'Watchlist' : 'Clean',
      confidenceScore: gsResult?.confidence || Math.round(40 + fraudPct * 0.6),
      totalITCAtRisk: totalClaimed,
      invoiceCount: recs.length,
      highRiskPct: Math.round(fraudPct),
      justification: justifications.join('. ') || 'No anomalies detected.',
    });
  });

  return entities.sort((a, b) => b.confidenceScore - a.confidenceScore);
}
