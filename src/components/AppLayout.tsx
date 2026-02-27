import { Link, useLocation } from 'react-router-dom';
import { useGST } from '@/context/GSTContext';
import { UserRole } from '@/types/gst';
import { cn } from '@/lib/utils';
import { FileText, ShoppingCart, Shield, BarChart3, Network, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

const roleConfig: Record<UserRole, { label: string; icon: React.ReactNode; color: string }> = {
  seller: { label: 'Seller', icon: <FileText className="w-4 h-4" />, color: 'text-primary' },
  buyer: { label: 'Buyer', icon: <ShoppingCart className="w-4 h-4" />, color: 'text-accent' },
  admin: { label: 'Admin', icon: <Shield className="w-4 h-4" />, color: 'text-warning' },
};

const navItems = [
  { path: '/', label: 'Dashboard', icon: <BarChart3 className="w-4 h-4" /> },
  { path: '/seller', label: 'Seller Portal', icon: <FileText className="w-4 h-4" /> },
  { path: '/buyer', label: 'Buyer Portal', icon: <ShoppingCart className="w-4 h-4" /> },
  { path: '/graph', label: 'Knowledge Graph', icon: <Network className="w-4 h-4" /> },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { role, setRole, invoices, claims, reconciliations } = useGST();
  const location = useLocation();
  const currentRole = roleConfig[role];

  const highRiskCount = reconciliations.filter(r => r.riskLevel === 'high').length;

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between px-6 h-14">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Network className="w-5 h-5 text-primary" />
              </div>
              <span className="font-bold text-lg tracking-tight">GST Recon</span>
            </Link>
            <nav className="flex items-center gap-1">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors',
                    location.pathname === item.path
                      ? 'bg-secondary text-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                  )}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {highRiskCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-destructive animate-pulse-glow" />
                {highRiskCount} High Risk
              </div>
            )}

            <div className="text-xs text-muted-foreground font-mono">
              {invoices.length} INV · {claims.length} ITC · {reconciliations.length} REC
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  {currentRole.icon}
                  <span className={currentRole.color}>{currentRole.label}</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {(Object.keys(roleConfig) as UserRole[]).map(r => (
                  <DropdownMenuItem key={r} onClick={() => setRole(r)} className="gap-2">
                    {roleConfig[r].icon}
                    {roleConfig[r].label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-[1600px] mx-auto px-6 py-6">
        {children}
      </main>
    </div>
  );
}
