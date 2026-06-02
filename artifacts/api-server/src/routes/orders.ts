import { Router } from "express";
import { eq, sql } from "drizzle-orm";
import { db, ordersTable } from "@workspace/db";
import { PlaceOrderBody } from "@workspace/api-zod";
import { placeFuturesOrder } from "../lib/binance";
import { logger } from "../lib/logger";
import axios from "axios";

const router = Router();

router.get("/orders", async (req, res) => {
  try {
    const orders = await db
      .select()
      .from(ordersTable)
      .orderBy(sql`${ordersTable.createdAt} desc`)
      .limit(100);
    res.json(orders);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch orders");
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

router.get("/orders/stats", async (req, res) => {
  try {
    const orders = await db.select().from(ordersTable);

    const total = orders.length;
    const filled = orders.filter((o) => o.status === "FILLED").length;
    const newOrders = orders.filter((o) => o.status === "NEW").length;
    const failed = orders.filter((o) => o.status === "ERROR").length;

    const symbolMap: Record<string, number> = {};
    let buyCount = 0;
    let sellCount = 0;

    for (const order of orders) {
      symbolMap[order.symbol] = (symbolMap[order.symbol] ?? 0) + 1;
      if (order.side === "BUY") buyCount++;
      else sellCount++;
    }

    const bySymbol = Object.entries(symbolMap).map(([symbol, count]) => ({ symbol, count }));

    res.json({ total, filled, new: newOrders, failed, bySymbol, bySide: { BUY: buyCount, SELL: sellCount } });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch order stats");
    res.status(500).json({ error: "Failed to fetch order stats" });
  }
});

router.post("/orders", async (req, res) => {
  const parsed = PlaceOrderBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.message });
  }

  const { symbol, side, orderType, quantity, price, stopPrice } = parsed.data;

  // Map UI orderType to Binance type
  const binanceType = orderType === "STOP_LIMIT" ? "STOP" : orderType;

  const needsPrice = orderType === "LIMIT" || orderType === "STOP_LIMIT";
  if (needsPrice && !price) {
    return res.status(400).json({ error: "price is required for LIMIT and STOP_LIMIT orders" });
  }
  if (orderType === "STOP_LIMIT" && !stopPrice) {
    return res.status(400).json({ error: "stopPrice is required for STOP_LIMIT orders" });
  }

  // Insert as PENDING first
  const [inserted] = await db
    .insert(ordersTable)
    .values({
      symbol: symbol.toUpperCase(),
      side,
      orderType,
      quantity,
      price: price ?? null,
      stopPrice: stopPrice ?? null,
      status: "PENDING",
    })
    .returning();

  try {
    const binanceResponse = await placeFuturesOrder({
      symbol: symbol.toUpperCase(),
      side,
      type: binanceType,
      quantity,
      price: price ?? undefined,
      stopPrice: stopPrice ?? undefined,
      timeInForce: needsPrice ? "GTC" : undefined,
    });

    const status = (binanceResponse["status"] as string) ?? "UNKNOWN";
    const binanceOrderId = String(binanceResponse["orderId"] ?? "");
    const avgPrice = binanceResponse["avgPrice"] != null ? String(binanceResponse["avgPrice"]) : null;

    const [updated] = await db
      .update(ordersTable)
      .set({ status, binanceOrderId, avgPrice })
      .where(eq(ordersTable.id, inserted.id))
      .returning();

    logger.info({ orderId: inserted.id, status }, "Order submitted successfully");
    return res.status(201).json(updated);
  } catch (err: unknown) {
    let errorMessage = "Unknown error";

    if (axios.isAxiosError(err)) {
      const data = err.response?.data as Record<string, unknown> | undefined;
      errorMessage = data?.["msg"] != null ? String(data["msg"]) : (err.message ?? "Binance API error");
      req.log.error({ err: errorMessage, code: data?.["code"] }, "Binance API error");
    } else if (err instanceof Error) {
      errorMessage = err.message;
      req.log.error({ err: errorMessage }, "Order placement failed");
    }

    const [updated] = await db
      .update(ordersTable)
      .set({ status: "ERROR", errorMessage })
      .where(eq(ordersTable.id, inserted.id))
      .returning();

    return res.status(502).json({ error: errorMessage, order: updated });
  }
});

export default router;
