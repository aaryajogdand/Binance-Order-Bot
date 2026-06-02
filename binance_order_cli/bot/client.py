import os
import logging

from binance.client import Client
from binance.exceptions import BinanceAPIException, BinanceRequestException

logger = logging.getLogger("binance_bot")

TESTNET_BASE_URL = "https://testnet.binancefuture.com"


def get_client() -> Client:
    """Build and return a Binance Futures Testnet client."""
    api_key = os.environ.get("BINANCE_API_KEY")
    api_secret = os.environ.get("BINANCE_API_SECRET")

    if not api_key or not api_secret:
        raise EnvironmentError(
            "BINANCE_API_KEY and BINANCE_API_SECRET must be set in environment variables."
        )

    client = Client(api_key, api_secret, testnet=True)
    # Point to the futures testnet base URL
    client.FUTURES_URL = TESTNET_BASE_URL + "/fapi"
    return client


def place_futures_order(client: Client, **kwargs) -> dict:
    """Thin wrapper around futures_create_order with request/response logging."""
    logger.info("Sending order request: %s", kwargs)
    try:
        response = client.futures_create_order(**kwargs)
        logger.info("Order response: %s", response)
        return response
    except BinanceAPIException as e:
        logger.error("Binance API error: %s", e)
        raise
    except BinanceRequestException as e:
        logger.error("Network/request error: %s", e)
        raise
    except Exception as e:
        logger.error("Unexpected error during order placement: %s", e)
        raise
