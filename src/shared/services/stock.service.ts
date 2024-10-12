import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '../interface/response.interface';
import { LiveData, Stock } from '../interface/stock.interface';
import { firstValueFrom, Subject } from 'rxjs';
import { WatchList } from '../interface/watchList.interface';

@Injectable({
  providedIn: 'root',
})
export class StockService {
  nifty200Data: Stock[] = [];
  liveData: Subject<LiveData> = new Subject<LiveData>();
  dataMap: Map<number, LiveData> = new Map<number, LiveData>();
  ws!: WebSocket;
  isTockensLoaded: boolean = false;

  constructor(private http: HttpClient) {}

  async loadNifty200Tokens(): Promise<void> {
    try {
      const data = await firstValueFrom(
        this.http.get<ApiResponse>(
          'https://api.investit.ai/go/assist_list?exchange=NSE&nifty_200=true'
        )
      );

      if (data.status) {
        this.nifty200Data = data.payload;
        this.isTockensLoaded = true;
      }
    } catch (error) {
      console.error('Error loading Nifty 200 tokens', error);
    }
  }

  connect(nifty200InstrumentalTockens: number[]) {
    this.ws = new WebSocket('wss://data.investit.ai');
    console.log('WebSocket connection established');
    this.ws.onopen = () => {
      const message = {
        a: 'subscribe',
        v: nifty200InstrumentalTockens,
      };
      // Send the message to the WebSocket server
      this.ws.send(JSON.stringify(message));
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
