import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types/gst';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Network, Shield, FileText, ShoppingCart, LogIn } from 'lucide-react';

const roleConfig: Record<UserRole, { title: string; subtitle: string; icon: React.ReactNode; color: string }> = {
  buyer: {
    title: 'Buyer Portal',
    subtitle: 'Claim ITC and track reconciliation',
    icon: <ShoppingCart className="w-8 h-8" />,
    color: 'text-accent',
  },
  seller: {
    title: 'Seller Portal',
    subtitle: 'Issue invoices and manage compliance',
    icon: <FileText className="w-8 h-8" />,
    color: 'text-primary',
  },
  admin: {
    title: 'Government GST Authority Portal',
    subtitle: 'Risk intelligence & fraud detection',
    icon: <Shield className="w-8 h-8" />,
    color: 'text-warning',
  },
};

export default function LoginPage() {
  const { role } = useParams<{ role: string }>();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gstin, setGstin] = useState('');
  const [govId, setGovId] = useState('');
  const [error, setError] = useState('');

  const userRole = (role as UserRole) || 'admin';
  const config = roleConfig[userRole] || roleConfig.admin;
  const needsGstin = userRole === 'buyer' || userRole === 'seller';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    if (needsGstin && !gstin) {
      setError('GSTIN is required');
      return;
    }
    const success = login(email, password, userRole, needsGstin ? gstin : undefined);
    if (success) {
      navigate(userRole === 'admin' ? '/' : `/${userRole}`);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center mx-auto mb-4">
            <Network className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">GST Recon AI</h1>
          <p className="text-sm text-muted-foreground mt-1">AI-Powered Graph-Based Fraud Detection</p>
        </div>

        <Card className="bg-card border-border p-8">
          <div className="text-center mb-6">
            <div className={`${config.color} mb-2 flex justify-center`}>{config.icon}</div>
            <h2 className="text-lg font-semibold">{config.title}</h2>
            <p className="text-xs text-muted-foreground">{config.subtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-xs">Email</Label>
              <Input type="email" placeholder="user@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label className="text-xs">Password</Label>
              <Input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            {needsGstin && (
              <div>
                <Label className="text-xs">GSTIN</Label>
                <Input placeholder="22AAAAA0000A1Z5" value={gstin} onChange={e => setGstin(e.target.value)} required />
              </div>
            )}
            {userRole === 'admin' && (
              <div>
                <Label className="text-xs">Government ID <span className="text-muted-foreground">(optional)</span></Label>
                <Input placeholder="GOV-XXXXXX" value={govId} onChange={e => setGovId(e.target.value)} />
              </div>
            )}
            {error && <p className="text-xs text-destructive">{error}</p>}
            <Button type="submit" className="w-full gap-2">
              <LogIn className="w-4 h-4" /> Sign In
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center mb-3">Switch portal:</p>
            <div className="flex gap-2 justify-center">
              {(['buyer', 'seller', 'admin'] as UserRole[]).filter(r => r !== userRole).map(r => (
                <Button key={r} variant="ghost" size="sm" className="text-xs" onClick={() => navigate(`/login/${r}`)}>
                  {roleConfig[r].icon && roleConfig[r].title.split(' ')[0]}
                </Button>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
