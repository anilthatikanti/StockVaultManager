export interface Stock {
  exchange: string;
  exchange_token: number;
  instrument_token: number;
  instrument_type: string;
  name: string;
  segment: string;
  trading_symbol: string;
}

export interface IStockData {
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  sector: string;
  industry: string;
  ohlc:{
    Open: number;
    High: number;
    Low: number;
    Close: number;
    Volume: number;
  };
}

export interface IHistoryData{
    Open: number;
    High: number;
    Low: number;
    Close: number;
    Volume: number;
    Dividends: number;
    "Stock Splits": number;
}
export interface ITickerData {
  id: string;
  exchange: string;
  quoteType: number;
  price: number;
  timestamp: number;
  marketHours: number;
  changePercent: number;
  dayVolume: number;
  change: number;
  priceHint: number;
}

export interface IClosed {
      action: string;
      message: string;
      type: string;
    }
