export interface SellerInvoice {
  id: string;
  sellerGstin: string;
  buyerGstin: string;
  invoiceNumber: string;
  invoiceDate: string;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalValue: number;
  gstr1Filed: boolean;
  gstr3bFiled: boolean;
  taxPaid: boolean;
  createdAt: string;
}

export interface BuyerClaim {
  id: string;
  buyerGstin: string;
  sellerGstin: string;
  invoiceNumber: string;
  itcClaimedAmount: number;
  presentInGstr2b: boolean;
  createdAt: string;
}

export type RiskLevel = 'low' | 'medium' | 'high';

export interface ReconciliationResult {
  id: string;
  invoiceNumber: string;
  sellerGstin: string;
  buyerGstin: string;
  itcStatus: 'VALID' | 'AT_RISK' | 'INVALID';
  riskScore: number;
  riskLevel: RiskLevel;
  rootCause: string;
  explanation: string;
  sellerInvoice?: SellerInvoice;
  buyerClaim?: BuyerClaim;
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'buyer' | 'seller' | 'invoice' | 'gstr1' | 'gstr2b' | 'gstr3b' | 'payment';
  riskLevel?: RiskLevel;
}

export interface GraphEdge {
  source: string;
  target: string;
  label: string;
  riskLevel?: RiskLevel;
}

export type UserRole = 'seller' | 'buyer' | 'admin';
