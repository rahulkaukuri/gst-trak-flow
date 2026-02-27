import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGST } from '@/context/GSTContext';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { FileText, ShoppingCart, Shield, BarChart3, Network, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { invoices, claims, reconciliations } = useGST();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const role = user?.role || 'admin';

  // Role-based nav filtering
  const allNavItems = [
    { path: '/', label: 'Dashboard', icon: <BarChart3 className="w-4 h-4" />, roles: ['admin'] },
    { path: '/seller', label: 'Seller Portal', icon: <FileText className="w-4 h-4" />, roles: ['seller', 'admin'] },
    { path: '/buyer', label: 'Buyer Portal', icon: <ShoppingCart className="w-4 h-4" />, roles: ['buyer', 'admin'] },
    { path: '/graph', label: 'Knowledge Graph', icon: <Network className="w-4 h-4" />, roles: ['admin', 'buyer', 'seller'] },
  ];

  const navItems = allNavItems.filter(item => item.roles.includes(role));

  const highRiskCount = reconciliations.filter(r => r.riskLevel === 'high').length;

  const handleLogout = () => {
    logout();
    navigate('/login/admin');
  };

  const roleLabels = { admin: 'Admin', buyer: 'Buyer', seller: 'Seller' };
  const roleColors = { admin: 'text-warning', buyer: 'text-accent', seller: 'text-primary' };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between px-6 h-14">
          <div className="flex items-center gap-8">
            <Link to={role === 'admin' ? '/' : `/${role}`} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Network className="w-5 h-5 text-primary" />
              </div>
              <span className="font-bold text-lg tracking-tight">GST Recon AI</span>
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
            {role === 'admin' && highRiskCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                {highRiskCount} High Risk
              </div>
            )}

            <div className="text-xs text-muted-foreground font-mono">
              {invoices.length} INV · {claims.length} ITC
            </div>

            <div className="flex items-center gap-2">
              <span className={cn('text-xs font-medium', roleColors[role])}>
                {roleLabels[role]}
              </span>
              {user?.email && <span className="text-xs text-muted-foreground">{user.email}</span>}
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-6">
        {children}
      </main>
    </div>
  );
}
