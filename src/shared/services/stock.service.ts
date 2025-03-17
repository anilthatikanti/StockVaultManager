import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '../interface/response.interface';
import { IStockData, ITickerData } from '../interface/stock.interface';
import { firstValueFrom, Subject } from 'rxjs';
import { WatchList } from '../interface/watchList.interface';
import { Auth } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root',
})
export class StockService {
  nifty200Data: IStockData[] = [];
  liveData: Subject<ITickerData> = new Subject<ITickerData>();
  dataMap: Map<number, ITickerData> = new Map<number, ITickerData>();
  ws!: WebSocket;
  isTockensLoaded: boolean = false;

  constructor(private http: HttpClient, private firebaseAuth: Auth) {}

  async loadNifty200Tokens(): Promise<void> {
    try {
      const data = await firstValueFrom(
        this.http.get<ApiResponse>('http://127.0.0.1:8000/nifty50')
      );
      if (data.status) {
        this.nifty200Data = data.payload;
        this.isTockensLoaded = true;
      }
    } catch (error) {
      console.error('Error loading Nifty 200 tokens', error);
    }
  }

  async connect(nifty200InstrumentalTokens: string[]) {
    const jwtToken: any = await this.firebaseAuth.currentUser?.getIdToken();
    if (jwtToken) {
      this.ws = new WebSocket(`ws://127.0.0.1:8000/ws`, jwtToken);
      console.log('WebSocket connection established');
      this.ws.onopen = () => {
        this.ws.send(JSON.stringify(nifty200InstrumentalTokens));
      };
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      this.ws.onclose = (event) => {
        console.warn('WebSocket closed:', event);
      };

      this.ws.onmessage = (event) => {
        this.liveData.next(JSON.parse(event.data));
      };
    }
  }
}

export const watchListData: WatchList[] = [
  {
    _id: 1,
    watchListName: 'watch_list_1',
    stocks: [],
  },
  {
    _id: 2,
    watchListName: 'watch_list_2',
    stocks: [],
  },
  {
    _id: 3,
    watchListName: 'watch_list_3',
    stocks: [],
  },
  {
    _id: 4,
    watchListName: 'watch_list_4',
    stocks: [],
  },
];
