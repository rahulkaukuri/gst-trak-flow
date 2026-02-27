import { ReconciliationResult } from '@/types/gst';

export interface GATEdgeResult {
  invoiceNumber: string;
  sellerGstin: string;
  buyerGstin: string;
  attentionScore: number;
  isSuspicious: boolean;
  edgeType: string;
  explanation: string;
}

/**
 * Simulates Graph Attention Network edge classification.
 * Assigns attention weights to transaction edges based on completeness of invoice chain.
 */
export function runGAT(reconciliations: ReconciliationResult[]): GATEdgeResult[] {
  return reconciliations.map(r => {
    let attentionScore = 0;
    const factors: string[] = [];

    // Missing GSTR-1 filing
    if (r.sellerInvoice && !r.sellerInvoice.gstr1Filed) {
      attentionScore += 0.3;
      factors.push('GSTR-1 not filed');
    }

    // Missing GSTR-3B
    if (r.sellerInvoice && !r.sellerInvoice.gstr3bFiled) {
      attentionScore += 0.25;
      factors.push('GSTR-3B not filed');
    }

    // Tax not paid
    if (r.sellerInvoice && !r.sellerInvoice.taxPaid) {
      attentionScore += 0.3;
      factors.push('Tax payment missing');
    }

    // Not in GSTR-2B
    if (r.buyerClaim && !r.buyerClaim.presentInGstr2b) {
      attentionScore += 0.2;
      factors.push('Not reflected in GSTR-2B');
    }

    // No matching invoice
    if (!r.sellerInvoice) {
      attentionScore = 0.95;
      factors.push('No matching seller invoice found');
    }

    // Amount mismatch detection
    if (r.sellerInvoice && r.buyerClaim) {
      const totalTax = r.sellerInvoice.cgst + r.sellerInvoice.sgst + r.sellerInvoice.igst;
      if (r.buyerClaim.itcClaimedAmount > totalTax * 1.1) {
        attentionScore += 0.15;
        factors.push('ITC claim exceeds tax amount');
      }
    }

    attentionScore = Math.min(1, attentionScore);

    return {
      invoiceNumber: r.invoiceNumber,
      sellerGstin: r.sellerGstin,
      buyerGstin: r.buyerGstin,
      attentionScore: Math.round(attentionScore * 100) / 100,
      isSuspicious: attentionScore > 0.5,
      edgeType: r.itcStatus === 'VALID' ? 'CLAIMS_ITC' : 'SUSPICIOUS_CLAIM',
      explanation: factors.length > 0
        ? `GAT flags: ${factors.join(', ')}. Attention weight indicates ${attentionScore > 0.7 ? 'high' : 'moderate'} suspicion.`
        : 'All chain links verified. Low attention weight.',
    };
  }).sort((a, b) => b.attentionScore - a.attentionScore);
}
