export interface Stock {
  exchange: string;
  exchange_token: number;
  instrument_token: number;
  instrument_type: string;
  name: string;
  segment: string;
  trading_symbol: string;
}

export interface LiveData {
  change: number;
  instrument_token: number;
  last_price: number;
  mode: string;
  ohlc: Ohlc;
  close: number;
  high: number;
  low: number;
  open: number;
  tradable: boolean;
}

interface Ohlc {
  open: number;
  high: number;
  low: number;
  close: number;
}
