import { Stock } from './stock.interface';

export type ApiResponse = {
  message: string;
  payload: Stock[];
  status: boolean;
};

export type HistoryData = {
  message: string;
  payload: History[];
  status: boolean;
};

export type History = {
  close: number;
  date: string;
  high: number;
  low: number;
  open: number;
  volume: number;
};

export interface Response {
  success:boolean;
  data?: any;
  message?: string;
}