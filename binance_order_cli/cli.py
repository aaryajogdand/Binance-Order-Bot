#!/usr/bin/env python3
"""CLI entry point for the Binance Futures Testnet trading bot."""

import argparse
import sys

from dotenv import load_dotenv
from binance.exceptions import BinanceAPIException, BinanceRequestException

from bot.logging_config import setup_logging
from bot.client import get_client
from bot import validators
from bot.orders import place_market_order, place_limit_order, place_stop_limit_order

load_dotenv()
logger = setup_logging()


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Binance Futures Testnet order CLI",
        formatter_class=argparse.RawTextHelpFormatter,
    )
    parser.add_argument("--symbol", required=True, help="Trading pair symbol, e.g. BTCUSDT")
    parser.add_argument("--side", required=True, help="Order side: BUY or SELL")
    parser.add_argument(
        "--order_type",
        required=True,
        help="Order type: MARKET, LIMIT, or STOP_LIMIT",
    )
    parser.add_argument("--quantity", required=True, help="Order quantity")
    parser.add_argument("--price", required=False, help="Limit price (required for LIMIT and STOP_LIMIT)")
    parser.add_argument(
        "--stop_price",
        required=False,
        help="Stop trigger price (required for STOP_LIMIT)",
    )
    return parser


def print_order_summary(symbol: str, side: str, order_type: str, quantity, price=None, stop_price=None):
    print("\n--- Order Summary ---")
    print(f"  Symbol     : {symbol}")
    print(f"  Side       : {side}")
    print(f"  Type       : {order_type}")
    print(f"  Quantity   : {quantity}")
    if price is not None:
        print(f"  Price      : {price}")
    if stop_price is not None:
        print(f"  Stop Price : {stop_price}")
    print("---------------------")


def print_order_response(response: dict):
    print("\n--- Order Response ---")
    fields = [
        ("Order ID", "orderId"),
        ("Client Order ID", "clientOrderId"),
        ("Symbol", "symbol"),
        ("Status", "status"),
        ("Side", "side"),
        ("Type", "type"),
        ("Quantity", "origQty"),
        ("Price", "price"),
        ("Stop Price", "stopPrice"),
        ("Avg Fill Price", "avgPrice"),
        ("Time in Force", "timeInForce"),
    ]
    for label, key in fields:
        val = response.get(key)
        if val is not None and val != "":
            print(f"  {label:<16}: {val}")
    print("----------------------\n")


def main():
    parser = build_parser()
    args = parser.parse_args()

    # Validate all inputs upfront
    try:
        symbol = validators.validate_symbol(args.symbol)
        side = validators.validate_side(args.side)
        order_type = validators.validate_order_type(args.order_type)
        quantity = validators.validate_quantity(args.quantity)

        price = None
        stop_price = None

        if order_type in ("LIMIT", "STOP_LIMIT"):
            if not args.price:
                parser.error(f"--price is required for {order_type} orders.")
            price = validators.validate_price(args.price)

        if order_type == "STOP_LIMIT":
            if not args.stop_price:
                parser.error("--stop_price is required for STOP_LIMIT orders.")
            stop_price = validators.validate_stop_price(args.stop_price)

    except ValueError as e:
        logger.error("Validation error: %s", e)
        print(f"\nError: {e}")
        sys.exit(1)

    print_order_summary(symbol, side, order_type, quantity, price, stop_price)

    try:
        client = get_client()
    except EnvironmentError as e:
        logger.error("Configuration error: %s", e)
        print(f"\nError: {e}")
        sys.exit(1)

    try:
        if order_type == "MARKET":
            response = place_market_order(client, symbol, side, quantity)
        elif order_type == "LIMIT":
            response = place_limit_order(client, symbol, side, quantity, price)
        elif order_type == "STOP_LIMIT":
            response = place_stop_limit_order(client, symbol, side, quantity, price, stop_price)

        print_order_response(response)
        logger.info("Order submitted successfully — ID: %s", response.get("orderId"))
        print("✓ Order submitted successfully.")

    except BinanceAPIException as e:
        print(f"\n✗ Binance API error: {e.message} (code {e.code})")
        sys.exit(1)
    except BinanceRequestException as e:
        print(f"\n✗ Network error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
