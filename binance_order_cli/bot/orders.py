import logging
from decimal import Decimal

from binance.client import Client

from bot.client import place_futures_order

logger = logging.getLogger("binance_bot")


def place_market_order(client: Client, symbol: str, side: str, quantity: Decimal) -> dict:
    logger.info("Creating MARKET order for %s", symbol)
    return place_futures_order(
        client,
        symbol=symbol,
        side=side,
        type="MARKET",
        quantity=str(quantity),
    )


def place_limit_order(
    client: Client, symbol: str, side: str, quantity: Decimal, price: Decimal
) -> dict:
    logger.info("Creating LIMIT order for %s at %s", symbol, price)
    return place_futures_order(
        client,
        symbol=symbol,
        side=side,
        type="LIMIT",
        quantity=str(quantity),
        price=str(price),
        timeInForce="GTC",
    )


def place_stop_limit_order(
    client: Client,
    symbol: str,
    side: str,
    quantity: Decimal,
    price: Decimal,
    stop_price: Decimal,
) -> dict:
    logger.info(
        "Creating STOP_LIMIT order for %s — stop: %s, limit: %s", symbol, stop_price, price
    )
    return place_futures_order(
        client,
        symbol=symbol,
        side=side,
        type="STOP",  # Binance futures uses STOP for stop-limit orders
        quantity=str(quantity),
        price=str(price),
        stopPrice=str(stop_price),
        timeInForce="GTC",
    )
