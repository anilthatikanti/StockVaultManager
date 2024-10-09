import { Stock } from './stock.interface';

export type ApiResponse = {
  message: string;
  payload: Stock[];
  status: boolean;
};
