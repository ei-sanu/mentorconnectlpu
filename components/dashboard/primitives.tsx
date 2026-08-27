'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertCircle,
  RefreshCw,
  Inbox,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';

// ── Stat card ──────────────────────────────────────────────
export function StatCard({
  title,
  value,
  icon: Icon,
  sub,
  trend,
}: {
  title: string;
  value: string | number | null | undefined;
  icon: React.ComponentType<{ className?: string }>;
  sub?: string;
  trend?: number;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-lpu-text-muted" />
      </CardHeader>
      <CardContent>
        {value === null || value === undefined ? (
          <div className="h-8 w-20 bg-gray-100 rounded animate-pulse" />
        ) : (
          <>
            <div className="text-2xl font-bold text-lpu-text-primary">{typeof value === 'number' ? value.toLocaleString() : value}</div>
            {(trend !== undefined || sub) && (
              <p className="text-xs mt-1 flex items-center gap-1 text-lpu-text-secondary">
                {trend !== undefined && (
                  <>
                    {trend > 0 ? (
                      <TrendingUp className="h-3 w-3 text-emerald-600" />
                    ) : trend < 0 ? (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    ) : (
                      <Minus className="h-3 w-3 text-gray-400" />
                    )}
                    <span className={trend > 0 ? 'text-emerald-600' : trend < 0 ? 'text-red-500' : ''}>
                      {Math.abs(trend)}%
                    </span>
                  </>
                )}
                {sub}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ── Skeletons ──────────────────────────────────────────────
export function DashboardCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <div className="h-3 bg-gray-100 rounded-full w-1/2 animate-pulse" />
              <div className="h-4 w-4 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="h-8 bg-gray-100 rounded w-1/3 animate-pulse" />
          </CardContent>
        </Card>
      ))}
    </>
  );
}

export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div className="flex items-end gap-2 px-6 pb-6" style={{ height }}>
      {[45, 70, 35, 85, 60, 75, 50].map((h, i) => (
        <div
          key={i}
          className="flex-1 bg-gray-100 rounded-t-md animate-pulse"
          style={{ height: `${h}%`, animationDelay: `${i * 120}ms` }}
        />
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="px-6 pb-6 space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="h-9 w-9 rounded-full bg-gray-100 animate-pulse shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-gray-100 rounded-full w-1/3 animate-pulse" />
            <div className="h-3 bg-gray-100 rounded-full w-1/2 animate-pulse" />
          </div>
          <div className="h-6 w-16 bg-gray-100 rounded-full animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export function ActivitySkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-4 px-6 pb-6">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-lg bg-gray-100 animate-pulse shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-gray-100 rounded-full w-2/3 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
            <div className="h-3 bg-gray-100 rounded-full w-1/3 animate-pulse" style={{ animationDelay: `${i * 100 + 60}ms` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Empty / Error states ───────────────────────────────────
export function EmptyState({ message, hint }: { message: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="h-12 w-12 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center mb-3">
        <Inbox className="h-5 w-5 text-gray-400" />
      </div>
      <p className="text-sm font-medium text-lpu-text-primary">{message}</p>
      {hint && <p className="text-xs text-lpu-text-secondary mt-1">{hint}</p>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="h-12 w-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mb-3">
        <AlertCircle className="h-5 w-5 text-red-400" />
      </div>
      <p className="text-sm font-medium text-lpu-text-primary">Something went wrong</p>
      <p className="text-xs text-lpu-text-secondary mt-1 max-w-xs">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-4 rounded-xl">
          <RefreshCw className="h-3.5 w-3.5 mr-2" /> Retry
        </Button>
      )}
    </div>
  );
}

// ── Last updated + refresh bar ─────────────────────────────
function relativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

export function LastUpdatedBar({
  lastUpdated,
  onRefresh,
  refreshing,
}: {
  lastUpdated: Date | null;
  onRefresh: () => void;
  refreshing?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      {lastUpdated && (
        <span className="text-xs text-lpu-text-secondary">
          Updated {relativeTime(lastUpdated)}
        </span>
      )}
      <Button variant="outline" size="sm" onClick={onRefresh} disabled={refreshing} className="rounded-xl h-8">
        <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
        Refresh
      </Button>
    </div>
  );
}

/** Re-render helper so "updated Xs ago" stays honest without spamming fetches. */
export function useNowTick(intervalMs = 30000) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return tick;
}
