from decimal import Decimal, InvalidOperation

VALID_SIDES = {"BUY", "SELL"}
VALID_ORDER_TYPES = {"MARKET", "LIMIT", "STOP_LIMIT"}


def validate_side(side: str) -> str:
    s = side.upper()
    if s not in VALID_SIDES:
        raise ValueError(f"Invalid side '{side}'. Must be one of: {', '.join(VALID_SIDES)}")
    return s


def validate_order_type(order_type: str) -> str:
    ot = order_type.upper()
    if ot not in VALID_ORDER_TYPES:
        raise ValueError(
            f"Invalid order type '{order_type}'. Must be one of: {', '.join(VALID_ORDER_TYPES)}"
        )
    return ot


def validate_symbol(symbol: str) -> str:
    s = symbol.upper().strip()
    if not s:
        raise ValueError("Symbol cannot be empty.")
    return s


def validate_quantity(quantity: str) -> Decimal:
    try:
        q = Decimal(quantity)
    except InvalidOperation:
        raise ValueError(f"Invalid quantity '{quantity}'. Must be a positive number.")
    if q <= 0:
        raise ValueError(f"Quantity must be greater than 0, got {quantity}.")
    return q


def validate_price(price: str) -> Decimal:
    try:
        p = Decimal(price)
    except InvalidOperation:
        raise ValueError(f"Invalid price '{price}'. Must be a positive number.")
    if p <= 0:
        raise ValueError(f"Price must be greater than 0, got {price}.")
    return p


def validate_stop_price(stop_price: str) -> Decimal:
    try:
        sp = Decimal(stop_price)
    except InvalidOperation:
        raise ValueError(f"Invalid stop price '{stop_price}'. Must be a positive number.")
    if sp <= 0:
        raise ValueError(f"Stop price must be greater than 0, got {stop_price}.")
    return sp
