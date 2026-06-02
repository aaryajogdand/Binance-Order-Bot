import { useGetOrderStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ActivitySquare, Hash, CheckCircle, AlertTriangle, ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function Stats() {
  const { data: stats, isLoading } = useGetOrderStats();

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 w-full max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48 mb-8" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const fillRate = stats.total > 0 ? Math.round((stats.filled / stats.total) * 100) : 0;

  return (
    <div className="p-6 md:p-8 w-full max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Analytics</h1>
        <p className="text-muted-foreground">Performance metrics and execution statistics.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Orders" 
          value={stats.total} 
          icon={<Hash className="h-4 w-4 text-muted-foreground" />} 
        />
        <StatCard 
          title="Filled Orders" 
          value={stats.filled} 
          icon={<CheckCircle className="h-4 w-4 text-green-500" />} 
          subtitle={`${fillRate}% fill rate`}
        />
        <StatCard 
          title="Pending (New)" 
          value={stats.new} 
          icon={<ActivitySquare className="h-4 w-4 text-yellow-500" />} 
        />
        <StatCard 
          title="Failed/Rejected" 
          value={stats.failed} 
          icon={<AlertTriangle className="h-4 w-4 text-red-500" />} 
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Volume by Side</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-[hsl(142,71%,45%,0.05)] border border-[hsl(142,71%,45%,0.2)]">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-[hsl(142,71%,45%,0.1)]">
                    <ArrowUpRight className="h-5 w-5 text-[hsl(142,71%,45%)]" />
                  </div>
                  <span className="font-bold text-foreground">Long / Buy</span>
                </div>
                <span className="text-2xl font-mono font-bold text-[hsl(142,71%,45%)]">{stats.bySide.BUY}</span>
              </div>
              
              <div className="flex items-center justify-between p-4 rounded-lg bg-[hsl(350,89%,60%,0.05)] border border-[hsl(350,89%,60%,0.2)]">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-[hsl(350,89%,60%,0.1)]">
                    <ArrowDownRight className="h-5 w-5 text-[hsl(350,89%,60%)]" />
                  </div>
                  <span className="font-bold text-foreground">Short / Sell</span>
                </div>
                <span className="text-2xl font-mono font-bold text-[hsl(350,89%,60%)]">{stats.bySide.SELL}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Distribution by Symbol</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.bySymbol.length > 0 ? (
                stats.bySymbol.map((item) => (
                  <div key={item.symbol} className="flex items-center justify-between p-3 rounded bg-muted/30">
                    <span className="font-bold font-mono">{item.symbol}</span>
                    <span className="font-mono text-muted-foreground">{item.count} orders</span>
                  </div>
                ))
              ) : (
                <div className="text-center p-8 text-muted-foreground">
                  No data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, subtitle }: { title: string; value: number | string; icon: React.ReactNode; subtitle?: string }) {
  return (
    <Card className="border-border hover:border-primary/50 transition-colors">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold font-mono">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1 font-mono">
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
