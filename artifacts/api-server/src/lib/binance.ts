import crypto from "crypto";
import axios from "axios";
import { logger } from "./logger";

const BASE_URL = "https://testnet.binancefuture.com";

function sign(queryString: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(queryString).digest("hex");
}

export interface OrderParams {
  symbol: string;
  side: string;
  type: string;
  quantity: string;
  price?: string;
  stopPrice?: string;
  timeInForce?: string;
}

export async function placeFuturesOrder(params: OrderParams): Promise<Record<string, unknown>> {
  const apiKey = process.env["BINANCE_API_KEY"];
  const apiSecret = process.env["BINANCE_API_SECRET"];

  if (!apiKey || !apiSecret) {
    throw new Error("BINANCE_API_KEY and BINANCE_API_SECRET must be set.");
  }

  const payload: Record<string, string> = {
    symbol: params.symbol,
    side: params.side,
    type: params.type,
    quantity: params.quantity,
    timestamp: Date.now().toString(),
  };

  if (params.price) payload["price"] = params.price;
  if (params.stopPrice) payload["stopPrice"] = params.stopPrice;
  if (params.timeInForce) payload["timeInForce"] = params.timeInForce;

  const queryString = new URLSearchParams(payload).toString();
  const signature = sign(queryString, apiSecret);
  const url = `${BASE_URL}/fapi/v1/order?${queryString}&signature=${signature}`;

  logger.info({ symbol: params.symbol, side: params.side, type: params.type }, "Placing Binance order");

  const response = await axios.post(url, null, {
    headers: { "X-MBX-APIKEY": apiKey },
    timeout: 10000,
  });

  logger.info({ orderId: response.data?.orderId, status: response.data?.status }, "Binance order response");

  return response.data as Record<string, unknown>;
}
