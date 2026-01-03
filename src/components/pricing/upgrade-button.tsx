'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface UpgradeButtonProps {
  plan: 'lifetime' | 'monthly';
  children: React.ReactNode;
  variant?: 'primary' | 'outline';
}

export function UpgradeButton({ plan, children, variant = 'primary' }: UpgradeButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleClick} disabled={loading} variant={variant} className="w-full">
      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
      {children}
    </Button>
  );
}
