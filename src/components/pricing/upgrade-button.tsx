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
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        setError(data.error);
        console.error('Checkout error:', data.error);
      }
    } catch (err) {
      setError('Verbindungsfehler');
      console.error('Checkout error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <Button onClick={handleClick} disabled={loading} variant={variant} className="w-full">
        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        {children}
      </Button>
      {error && <p className="text-red-400 text-xs mt-1 text-center">{error}</p>}
    </div>
  );
}
