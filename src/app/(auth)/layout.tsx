import { Zap } from 'lucide-react';
import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="mb-8">
        <Link href="/" className="flex items-center gap-2">
          <Zap className="h-8 w-8 text-blue-600" />
          <span className="text-2xl font-bold text-gray-900">RechnungsBlitz</span>
        </Link>
      </div>
      {children}
    </div>
  );
}
