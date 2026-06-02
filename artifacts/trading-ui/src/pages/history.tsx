import { useListOrders } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchX } from "lucide-react";

export default function History() {
  const { data: orders, isLoading } = useListOrders();

  return (
    <div className="p-6 md:p-8 w-full max-w-[1200px] mx-auto h-full flex flex-col">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Order History</h1>
        <p className="text-muted-foreground">Comprehensive log of all testnet order execution.</p>
      </div>

      <div className="flex-1 bg-card rounded-md border border-border shadow-lg overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <Table>
            <TableHeader className="bg-muted/50 sticky top-0 backdrop-blur-sm z-10">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="font-mono font-semibold">Time</TableHead>
                <TableHead className="font-mono font-semibold">Symbol</TableHead>
                <TableHead className="font-mono font-semibold">Side</TableHead>
                <TableHead className="font-mono font-semibold">Type</TableHead>
                <TableHead className="font-mono font-semibold text-right">Quantity</TableHead>
                <TableHead className="font-mono font-semibold text-right">Avg Price</TableHead>
                <TableHead className="font-mono font-semibold">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i} className="border-border">
                    <TableCell><Skeleton className="h-4 w-24 bg-muted" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16 bg-muted" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12 bg-muted" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16 bg-muted" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16 bg-muted ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16 bg-muted ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20 bg-muted" /></TableCell>
                  </TableRow>
                ))
              ) : orders && orders.length > 0 ? (
                orders.map((order) => (
                  <TableRow key={order.id} className="border-border hover:bg-muted/30 transition-colors">
                    <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(order.createdAt), "yyyy-MM-dd HH:mm:ss")}
                    </TableCell>
                    <TableCell className="font-bold text-foreground">{order.symbol}</TableCell>
                    <TableCell>
                      <span className={`font-bold text-xs ${order.side === 'BUY' ? 'text-[hsl(142,71%,45%)]' : 'text-[hsl(350,89%,60%)]'}`}>
                        {order.side}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs font-medium text-muted-foreground">{order.orderType}</TableCell>
                    <TableCell className="font-mono text-right">{order.quantity}</TableCell>
                    <TableCell className="font-mono text-right text-muted-foreground">
                      {order.avgPrice ? `$${Number(order.avgPrice).toFixed(2)}` : '-'}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={order.status} errorMessage={order.errorMessage} />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <SearchX className="h-8 w-8 mb-2 opacity-50" />
                      <p>No orders found</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status, errorMessage }: { status: string; errorMessage?: string | null }) {
  if (status === 'FILLED') {
    return <Badge className="bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20 font-mono text-[10px]">FILLED</Badge>;
  }
  if (status === 'NEW' || status === 'PENDING') {
    return <Badge variant="outline" className="text-yellow-500 border-yellow-500/50 font-mono text-[10px]">{status}</Badge>;
  }
  if (status === 'ERROR' || status === 'EXPIRED' || status === 'REJECTED') {
    return (
      <div className="flex flex-col gap-1 items-start">
        <Badge variant="destructive" className="font-mono text-[10px]">{status}</Badge>
        {errorMessage && <span className="text-[9px] text-destructive max-w-[150px] truncate" title={errorMessage}>{errorMessage}</span>}
      </div>
    );
  }
  return <Badge variant="secondary" className="font-mono text-[10px]">{status}</Badge>;
}
