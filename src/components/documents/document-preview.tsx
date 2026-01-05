'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface DocumentPreviewProps {
  children: React.ReactNode;
}

export function DocumentPreview({ children }: DocumentPreviewProps) {
  const [scale, setScale] = useState(0.5); // Start at 50% on mobile

  const zoomIn = () => setScale((s) => Math.min(s + 0.1, 1));
  const zoomOut = () => setScale((s) => Math.max(s - 0.1, 0.3));
  const resetZoom = () => setScale(0.5);

  return (
    <div className="relative">
      {/* Mobile Zoom Controls */}
      <div className="lg:hidden sticky top-14 z-20 bg-gray-950/90 backdrop-blur-sm border-b border-gray-800 px-4 py-2 flex items-center justify-between -mx-4 sm:-mx-6 mb-4">
        <span className="text-sm text-gray-400">
          {Math.round(scale * 100)}%
        </span>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={zoomOut}
            disabled={scale <= 0.3}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={resetZoom}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={zoomIn}
            disabled={scale >= 1}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Mobile: Scaled A4 Preview */}
      <div className="lg:hidden overflow-x-auto pb-4">
        <div
          className="origin-top-left transition-transform duration-200"
          style={{
            transform: `scale(${scale})`,
            width: `${100 / scale}%`,
          }}
        >
          <Card className="bg-white w-[210mm] min-h-[297mm] mx-auto shadow-2xl">
            <CardContent className="p-10 text-gray-900">
              {children}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Desktop: Normal A4 Preview */}
      <div className="hidden lg:block">
        <Card className="bg-white max-w-4xl">
          <CardContent className="p-10 text-gray-900">
            {children}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
