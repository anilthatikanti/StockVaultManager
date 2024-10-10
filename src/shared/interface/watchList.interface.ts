import { Stock } from './stock.interface';

export interface WatchList {
  _id: number;
  watchListName: string;
  stocks: Stock[];
}
