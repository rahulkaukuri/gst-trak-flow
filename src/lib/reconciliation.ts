import { SellerInvoice, BuyerClaim, ReconciliationResult, RiskLevel } from '@/types/gst';

export function reconcile(
  sellerInvoice: SellerInvoice | undefined,
  buyerClaim: BuyerClaim
): ReconciliationResult {
  const base = {
    id: `rec-${buyerClaim.invoiceNumber}`,
    invoiceNumber: buyerClaim.invoiceNumber,
    sellerGstin: buyerClaim.sellerGstin,
    buyerGstin: buyerClaim.buyerGstin,
    sellerInvoice,
    buyerClaim,
  };

  if (!sellerInvoice) {
    return {
      ...base,
      itcStatus: 'INVALID',
      riskScore: 90,
      riskLevel: 'high',
      rootCause: 'Invoice Not Found in Seller Records',
      explanation: `Invoice ${buyerClaim.invoiceNumber} claimed by buyer ${buyerClaim.buyerGstin} was not found in seller ${buyerClaim.sellerGstin} records. ITC claim is invalid.`,
    };
  }

  // Rule 1: All conditions met
  if (sellerInvoice.gstr1Filed && buyerClaim.presentInGstr2b && sellerInvoice.gstr3bFiled && sellerInvoice.taxPaid) {
    const score = Math.floor(Math.random() * 20);
    return {
      ...base,
      itcStatus: 'VALID',
      riskScore: score,
      riskLevel: 'low',
      rootCause: 'All Compliant',
      explanation: `Invoice ${buyerClaim.invoiceNumber} is fully compliant. Declared in GSTR-1, reflected in GSTR-2B, GSTR-3B filed, and tax paid. ITC claim of ₹${buyerClaim.itcClaimedAmount.toLocaleString()} is valid.`,
    };
  }

  // Rule 3: Tax not paid (highest priority)
  if (!sellerInvoice.taxPaid) {
    const score = 80 + Math.floor(Math.random() * 20);
    return {
      ...base,
      itcStatus: 'INVALID',
      riskScore: score,
      riskLevel: 'high',
      rootCause: 'Tax Not Paid',
      explanation: `Invoice ${buyerClaim.invoiceNumber} was declared in GSTR-1 but tax payment was not found. ITC claim is high risk. Suggested action: verify supplier tax payment.`,
    };
  }

  // Rule 2: GSTR-3B not filed
  if (sellerInvoice.gstr1Filed && !sellerInvoice.gstr3bFiled) {
    const score = 60 + Math.floor(Math.random() * 20);
    return {
      ...base,
      itcStatus: 'AT_RISK',
      riskScore: score,
      riskLevel: 'high',
      rootCause: 'Return Not Filed',
      explanation: `Invoice ${buyerClaim.invoiceNumber} was declared in GSTR-1 but GSTR-3B return was not filed by seller ${sellerInvoice.sellerGstin}. ITC is at risk until return is filed.`,
    };
  }

  // Rule 4: Not in GSTR-2B
  if (!buyerClaim.presentInGstr2b) {
    const score = 50 + Math.floor(Math.random() * 20);
    return {
      ...base,
      itcStatus: 'AT_RISK',
      riskScore: score,
      riskLevel: 'medium',
      rootCause: 'Invoice Not Reflected in GSTR-2B',
      explanation: `Invoice ${buyerClaim.invoiceNumber} was declared by seller but not yet reflected in buyer's GSTR-2B. ITC claim is medium risk. Wait for auto-population in next cycle.`,
    };
  }

  // Fallback
  const score = 40 + Math.floor(Math.random() * 20);
  return {
    ...base,
    itcStatus: 'AT_RISK',
    riskScore: score,
    riskLevel: 'medium',
    rootCause: 'Partial Compliance',
    explanation: `Invoice ${buyerClaim.invoiceNumber} has partial compliance issues. Review seller filing status.`,
  };
}

export function getRiskColor(level: RiskLevel): string {
  switch (level) {
    case 'low': return 'hsl(160, 84%, 39%)';
    case 'medium': return 'hsl(38, 92%, 50%)';
    case 'high': return 'hsl(0, 72%, 51%)';
  }
}

export function getVendorRiskLevel(invoices: ReconciliationResult[]): { level: RiskLevel; percentage: number } {
  if (invoices.length === 0) return { level: 'low', percentage: 0 };
  const highRisk = invoices.filter(i => i.riskLevel === 'high').length;
  const percentage = (highRisk / invoices.length) * 100;
  if (percentage > 50) return { level: 'high', percentage };
  if (percentage > 25) return { level: 'medium', percentage };
  return { level: 'low', percentage };
}
