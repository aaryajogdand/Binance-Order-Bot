import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { usePlaceOrder, getListOrdersQueryKey, getGetOrderStatsQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";

const formSchema = z.object({
  symbol: z.string().min(1, "Symbol is required").toUpperCase(),
  side: z.enum(["BUY", "SELL"]),
  orderType: z.enum(["MARKET", "LIMIT", "STOP_LIMIT"]),
  quantity: z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, "Quantity must be a positive number"),
  price: z.string().optional(),
  stopPrice: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.orderType === "LIMIT" || data.orderType === "STOP_LIMIT") {
    if (!data.price || isNaN(Number(data.price)) || Number(data.price) <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Price is required and must be positive for limit orders",
        path: ["price"]
      });
    }
  }
  if (data.orderType === "STOP_LIMIT") {
    if (!data.stopPrice || isNaN(Number(data.stopPrice)) || Number(data.stopPrice) <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Stop Price is required and must be positive for stop limit orders",
        path: ["stopPrice"]
      });
    }
  }
});

type FormValues = z.infer<typeof formSchema>;

export default function Home() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const placeOrder = usePlaceOrder();
  
  const [lastOrder, setLastOrder] = useState<{ id: number; status: string; symbol: string; side: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      symbol: "BTCUSDT",
      side: "BUY",
      orderType: "MARKET",
      quantity: "",
      price: "",
      stopPrice: "",
    },
  });

  const orderType = form.watch("orderType");
  const side = form.watch("side");

  const onSubmit = (data: FormValues) => {
    setErrorMsg(null);
    setLastOrder(null);

    placeOrder.mutate({ data: {
      symbol: data.symbol,
      side: data.side,
      orderType: data.orderType,
      quantity: data.quantity,
      price: data.orderType === "MARKET" ? undefined : data.price,
      stopPrice: data.orderType === "STOP_LIMIT" ? data.stopPrice : undefined,
    }}, {
      onSuccess: (order) => {
        if (order.status === "ERROR" || order.errorMessage) {
          setErrorMsg(order.errorMessage || "Order failed to place");
        } else {
          setLastOrder({ id: order.id, status: order.status, symbol: order.symbol, side: order.side });
          toast({ title: "Order Placed", description: `Order #${order.id} placed successfully.` });
          form.reset({
            symbol: data.symbol,
            side: data.side,
            orderType: data.orderType,
            quantity: "",
            price: "",
            stopPrice: "",
          });
        }
        queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetOrderStatsQueryKey() });
      },
      onError: (err: any) => {
        const msg = err?.error || err?.message || "An unexpected error occurred";
        setErrorMsg(msg);
      }
    });
  };

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Terminal</h1>
        <p className="text-muted-foreground">Place execution orders directly to Binance Futures Testnet.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="md:col-span-2 border-border shadow-lg">
          <CardHeader className="border-b border-border pb-4 bg-muted/20">
            <CardTitle className="font-mono flex items-center gap-2">
              <span className="text-primary">▶</span> NEW_ORDER
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            
            {errorMsg && (
              <Alert variant="destructive" className="mb-6 border-red-500/50 bg-red-500/10">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Order Rejected</AlertTitle>
                <AlertDescription className="font-mono text-xs mt-1">{errorMsg}</AlertDescription>
              </Alert>
            )}

            {lastOrder && (
              <Alert className="mb-6 border-green-500/50 bg-green-500/10 text-green-500">
                <CheckCircle2 className="h-4 w-4" color="currentColor" />
                <AlertTitle>Order Transmitted</AlertTitle>
                <AlertDescription className="font-mono text-xs mt-1 text-green-500/80">
                  ID: {lastOrder.id} | {lastOrder.side} {lastOrder.symbol} | Status: {lastOrder.status}
                </AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="symbol"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Symbol</FormLabel>
                        <FormControl>
                          <Input placeholder="BTCUSDT" className="font-mono uppercase" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="orderType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="font-mono">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="MARKET">MARKET</SelectItem>
                            <SelectItem value="LIMIT">LIMIT</SelectItem>
                            <SelectItem value="STOP_LIMIT">STOP_LIMIT</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="side"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Side</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-2 gap-4">
                          <button
                            type="button"
                            onClick={() => field.onChange("BUY")}
                            className={`py-3 rounded-md font-bold transition-all border-2 ${field.value === "BUY" ? 'bg-[hsl(142,71%,45%,0.1)] border-[hsl(142,71%,45%)] text-[hsl(142,71%,45%)] shadow-[0_0_15px_hsl(142,71%,45%,0.2)]' : 'border-transparent bg-muted text-muted-foreground hover:bg-muted/80'}`}
                          >
                            LONG / BUY
                          </button>
                          <button
                            type="button"
                            onClick={() => field.onChange("SELL")}
                            className={`py-3 rounded-md font-bold transition-all border-2 ${field.value === "SELL" ? 'bg-[hsl(350,89%,60%,0.1)] border-[hsl(350,89%,60%)] text-[hsl(350,89%,60%)] shadow-[0_0_15px_hsl(350,89%,60%,0.2)]' : 'border-transparent bg-muted text-muted-foreground hover:bg-muted/80'}`}
                          >
                            SHORT / SELL
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <Input placeholder="0.00" type="text" className="font-mono" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {orderType !== "MARKET" && (
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Limit Price</FormLabel>
                          <FormControl>
                            <Input placeholder="0.00" type="text" className="font-mono" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {orderType === "STOP_LIMIT" && (
                    <FormField
                      control={form.control}
                      name="stopPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stop Price</FormLabel>
                          <FormControl>
                            <Input placeholder="0.00" type="text" className="font-mono" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <Button 
                  type="submit" 
                  className={`w-full h-14 text-lg font-bold font-mono tracking-widest ${side === 'BUY' ? 'bg-[hsl(142,71%,45%)] hover:bg-[hsl(142,71%,35%)] text-black' : 'bg-[hsl(350,89%,60%)] hover:bg-[hsl(350,89%,50%)] text-white'}`}
                  disabled={placeOrder.isPending}
                >
                  {placeOrder.isPending ? "TRANSMITTING..." : `EXECUTE ${side}`}
                </Button>
              </form>
            </Form>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
