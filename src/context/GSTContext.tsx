import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SellerInvoice, BuyerClaim, ReconciliationResult, UserRole } from '@/types/gst';
import { reconcile } from '@/lib/reconciliation';
import { toast } from 'sonner';

interface GSTContextType {
  invoices: SellerInvoice[];
  claims: BuyerClaim[];
  reconciliations: ReconciliationResult[];
  role: UserRole;
  setRole: (role: UserRole) => void;
  addInvoice: (invoice: SellerInvoice) => void;
  addClaim: (claim: BuyerClaim) => void;
}

const GSTContext = createContext<GSTContextType | null>(null);

const STORAGE_KEYS = {
  invoices: 'gst_invoices',
  claims: 'gst_claims',
  role: 'gst_role',
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function GSTProvider({ children }: { children: React.ReactNode }) {
  const [invoices, setInvoices] = useState<SellerInvoice[]>(() => loadFromStorage(STORAGE_KEYS.invoices, []));
  const [claims, setClaims] = useState<BuyerClaim[]>(() => loadFromStorage(STORAGE_KEYS.claims, []));
  const [role, setRole] = useState<UserRole>(() => loadFromStorage(STORAGE_KEYS.role, 'admin'));
  const [reconciliations, setReconciliations] = useState<ReconciliationResult[]>([]);

  // Persist to localStorage
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.invoices, JSON.stringify(invoices)); }, [invoices]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.claims, JSON.stringify(claims)); }, [claims]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.role, JSON.stringify(role)); }, [role]);

  // Reconcile whenever invoices or claims change
  const runReconciliation = useCallback(() => {
    const results: ReconciliationResult[] = claims.map(claim => {
      const matchingInvoice = invoices.find(
        inv => inv.invoiceNumber === claim.invoiceNumber && inv.sellerGstin === claim.sellerGstin
      );
      return reconcile(matchingInvoice, claim);
    });
    setReconciliations(results);
  }, [invoices, claims]);

  useEffect(() => { runReconciliation(); }, [runReconciliation]);

  const addInvoice = (invoice: SellerInvoice) => {
    setInvoices(prev => [...prev, invoice]);
    toast.success('Invoice Added', {
      description: `Invoice ${invoice.invoiceNumber} recorded successfully.`,
    });
  };

  const addClaim = (claim: BuyerClaim) => {
    setClaims(prev => [...prev, claim]);
    const matchingInvoice = invoices.find(
      inv => inv.invoiceNumber === claim.invoiceNumber && inv.sellerGstin === claim.sellerGstin
    );
    const result = reconcile(matchingInvoice, claim);
    toast(result.riskLevel === 'low' ? 'Invoice Reconciled Successfully' : 'Reconciliation Alert', {
      description: result.rootCause,
    });
  };

  return (
    <GSTContext.Provider value={{ invoices, claims, reconciliations, role, setRole, addInvoice, addClaim }}>
      {children}
    </GSTContext.Provider>
  );
}

export function useGST() {
  const ctx = useContext(GSTContext);
  if (!ctx) throw new Error('useGST must be used within GSTProvider');
  return ctx;
}
