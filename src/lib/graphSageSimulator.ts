import { ReconciliationResult } from '@/types/gst';

export interface GraphSageResult {
  gstin: string;
  type: 'buyer' | 'seller';
  fraudScore: number;
  confidence: number;
  neighborAvgRisk: number;
  classification: 'Safe' | 'Watchlist' | 'Fraud Suspect';
}

/**
 * Simulates GraphSAGE node classification by aggregating neighbor risk scores.
 * In production, this would use actual graph neural network inference.
 */
export function runGraphSage(
  reconciliations: ReconciliationResult[]
): GraphSageResult[] {
  const results: GraphSageResult[] = [];
  
  // Aggregate by seller
  const sellerMap = new Map<string, ReconciliationResult[]>();
  const buyerMap = new Map<string, ReconciliationResult[]>();
  
  reconciliations.forEach(r => {
    const sArr = sellerMap.get(r.sellerGstin) || [];
    sArr.push(r);
    sellerMap.set(r.sellerGstin, sArr);
    
    const bArr = buyerMap.get(r.buyerGstin) || [];
    bArr.push(r);
    buyerMap.set(r.buyerGstin, bArr);
  });

  // Seller node classification
  sellerMap.forEach((recs, gstin) => {
    const avgRisk = recs.reduce((s, r) => s + r.riskScore, 0) / recs.length;
    const highRiskPct = recs.filter(r => r.riskLevel === 'high').length / recs.length;
    
    // Simulated GraphSAGE: aggregate neighbors + self features
    const fraudScore = Math.min(100, Math.round(avgRisk * 0.6 + highRiskPct * 100 * 0.4));
    const confidence = Math.min(99, 50 + recs.length * 5 + highRiskPct * 30);
    
    results.push({
      gstin,
      type: 'seller',
      fraudScore,
      confidence: Math.round(confidence),
      neighborAvgRisk: Math.round(avgRisk),
      classification: fraudScore > 70 ? 'Fraud Suspect' : fraudScore > 40 ? 'Watchlist' : 'Safe',
    });
  });

  // Buyer node classification
  buyerMap.forEach((recs, gstin) => {
    const claimsWithoutFiling = recs.filter(r => r.rootCause === 'Invoice Not Found in Seller Records').length;
    const avgRisk = recs.reduce((s, r) => s + r.riskScore, 0) / recs.length;
    const fraudPct = claimsWithoutFiling / recs.length;
    
    const fraudScore = Math.min(100, Math.round(avgRisk * 0.4 + fraudPct * 100 * 0.6));
    const confidence = Math.min(99, 45 + recs.length * 4 + fraudPct * 35);
    
    results.push({
      gstin,
      type: 'buyer',
      fraudScore,
      confidence: Math.round(confidence),
      neighborAvgRisk: Math.round(avgRisk),
      classification: fraudScore > 70 ? 'Fraud Suspect' : fraudScore > 40 ? 'Watchlist' : 'Safe',
    });
  });

  return results.sort((a, b) => b.fraudScore - a.fraudScore);
}
