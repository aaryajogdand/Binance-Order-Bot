# Binance Futures Testnet Order CLI

A simple command-line trading bot for Binance Futures Testnet (USDT-M). Supports MARKET, LIMIT, and STOP_LIMIT orders.

## Requirements

- Python 3.8+
- Binance Futures Testnet account with API credentials

## Setup

```bash
git clone <repo>
cd binance_order_cli

python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

pip install -r requirements.txt

cp .env.example .env
# Edit .env and add your testnet API key and secret
```

## Usage

```
python cli.py --symbol SYMBOL --side BUY|SELL --order_type TYPE --quantity QTY [--price PRICE] [--stop_price STOP]
```

**Arguments**

| Argument | Required | Description |
|---|---|---|
| `--symbol` | Yes | Futures symbol, e.g. `BTCUSDT` |
| `--side` | Yes | `BUY` or `SELL` |
| `--order_type` | Yes | `MARKET`, `LIMIT`, or `STOP_LIMIT` |
| `--quantity` | Yes | Order quantity |
| `--price` | For LIMIT / STOP_LIMIT | Limit price |
| `--stop_price` | For STOP_LIMIT | Stop trigger price |

## Examples

**MARKET order**
```bash
python cli.py --symbol BTCUSDT --side BUY --order_type MARKET --quantity 0.01
```

**LIMIT order**
```bash
python cli.py --symbol BTCUSDT --side SELL --order_type LIMIT --quantity 0.01 --price 95000
```

**STOP_LIMIT order**
```bash
python cli.py --symbol BTCUSDT --side SELL --order_type STOP_LIMIT --quantity 0.01 --price 94500 --stop_price 95000
```

---

### Example: MARKET order output

```
--- Order Summary ---
  Symbol     : BTCUSDT
  Side       : BUY
  Type       : MARKET
  Quantity   : 0.01
---------------------

--- Order Response ---
  Order ID        : 3951409608
  Client Order ID : x-abc123
  Symbol          : BTCUSDT
  Status          : FILLED
  Side            : BUY
  Type            : MARKET
  Quantity        : 0.01
  Avg Fill Price  : 96342.50
  Time in Force   : GTC
----------------------

✓ Order submitted successfully.
```

### Example: LIMIT order output

```
--- Order Summary ---
  Symbol     : BTCUSDT
  Side       : SELL
  Type       : LIMIT
  Quantity   : 0.01
  Price      : 95000
---------------------

--- Order Response ---
  Order ID        : 3951409712
  Client Order ID : x-def456
  Symbol          : BTCUSDT
  Status          : NEW
  Side            : SELL
  Type            : LIMIT
  Quantity        : 0.01
  Price           : 95000
  Time in Force   : GTC
----------------------

✓ Order submitted successfully.
```

### Example: STOP_LIMIT order output

```
--- Order Summary ---
  Symbol     : BTCUSDT
  Side       : SELL
  Type       : STOP_LIMIT
  Quantity   : 0.01
  Price      : 94500
  Stop Price : 95000
---------------------

--- Order Response ---
  Order ID        : 3951409820
  Client Order ID : x-ghi789
  Symbol          : BTCUSDT
  Status          : NEW
  Side            : SELL
  Type            : STOP
  Quantity        : 0.01
  Price           : 94500
  Stop Price      : 95000
  Time in Force   : GTC
----------------------

✓ Order submitted successfully.
```

### Example: log file entries (`logs/bot.log`)

```
2025-06-02 14:23:01 - INFO - Creating MARKET order for BTCUSDT
2025-06-02 14:23:01 - INFO - Sending order request: {'symbol': 'BTCUSDT', 'side': 'BUY', 'type': 'MARKET', 'quantity': '0.01'}
2025-06-02 14:23:02 - INFO - Order response: {'orderId': 3951409608, 'symbol': 'BTCUSDT', 'status': 'FILLED', ...}
2025-06-02 14:23:02 - INFO - Order submitted successfully — ID: 3951409608

2025-06-02 14:25:14 - INFO - Creating LIMIT order for BTCUSDT at 95000
2025-06-02 14:25:14 - INFO - Sending order request: {'symbol': 'BTCUSDT', 'side': 'SELL', 'type': 'LIMIT', 'quantity': '0.01', 'price': '95000', 'timeInForce': 'GTC'}
2025-06-02 14:25:15 - INFO - Order response: {'orderId': 3951409712, 'status': 'NEW', ...}
2025-06-02 14:25:15 - INFO - Order submitted successfully — ID: 3951409712

2025-06-02 14:27:33 - ERROR - Binance API error: APIError(code=-1121): Invalid symbol.
2025-06-02 14:28:01 - ERROR - Validation error: Invalid side 'BUUY'. Must be one of: BUY, SELL
```

## Assumptions

- You already have a Binance Futures Testnet account at https://testnet.binancefuture.com
- You have generated API credentials from the testnet dashboard
- Symbols are assumed to be valid Binance futures pairs (e.g. `BTCUSDT`, `ETHUSDT`); the API will return an error for invalid ones
- Quantity and price precision must match what Binance expects for the given symbol — the API will reject orders that don't conform
- STOP_LIMIT orders use Binance's `STOP` type with `timeInForce=GTC`

## Project Structure

```
binance_order_cli/
├── bot/
│   ├── __init__.py
│   ├── client.py        # Binance client setup and raw order call
│   ├── orders.py        # Order type functions (MARKET, LIMIT, STOP_LIMIT)
│   ├── validators.py    # Input validation
│   └── logging_config.py
├── logs/                # Log files written here
├── cli.py               # Argparse entry point
├── .env.example
├── requirements.txt
└── README.md
```
