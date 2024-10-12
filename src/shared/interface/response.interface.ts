import { Stock } from './stock.interface';

export type ApiResponse = {
  message: string;
  payload: Stock[];
  status: boolean;
};

export type HistoryData = {
  message: string;
  payload: Hystory[];
  status: boolean;
};

type Hystory = {
  close: number;
  date: string;
  high: number;
  low: number;
  open: number;
  volume: number;
};
