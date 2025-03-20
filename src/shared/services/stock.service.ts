import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '../interface/response.interface';
import { IStockData, ITickerData } from '../interface/stock.interface';
import { firstValueFrom, Subject } from 'rxjs';
import { WatchList } from '../interface/watchList.interface';
import { Auth } from '@angular/fire/auth';
import { Y_SERVER_URL } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class StockService {
  nifty50Data: IStockData[] = [];
  liveData: Subject<ITickerData> = new Subject<ITickerData>();
  dataMap: Map<number, ITickerData> = new Map<number, ITickerData>();
  ws!: WebSocket;
  isTockensLoaded: boolean = false;

  constructor(private http: HttpClient, private firebaseAuth: Auth) {}

  async loadNifty50Tokens(): Promise<void> {
    try {
      const data = await firstValueFrom(
        this.http.get<ApiResponse>(`${Y_SERVER_URL}/nifty50`)
      );
      if (data.status) {
        this.nifty50Data = data.payload;
        this.isTockensLoaded = true;
      }
    } catch (error) {
      console.error('Error loading Nifty 50 tokens', error);
    }
  }

  async connect(nifty50InstrumentalTokens: string[]) {
    const jwtToken: any = await this.firebaseAuth.currentUser?.getIdToken();
    if (jwtToken) {
      this.ws = new WebSocket(`ws://127.0.0.1:8000/ws`, jwtToken);
      this.ws.onopen = () => {
        this.ws.send(JSON.stringify(nifty50InstrumentalTokens));
      };
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      this.ws.onclose = (event) => {
        console.warn('WebSocket closed:', event);
      };

      this.ws.onmessage = (event) => {
        const stocks = JSON.parse(event.data); // Convert JSON string to object
        if (Array.isArray(stocks)) {
          stocks.forEach(stock => this.liveData.next(stock)); // Emit each stock separately
        } else {
          this.liveData.next(stocks); // If it's a single object, emit directly
        }
      };
    }
  }

  disconnect() {
    if (this.ws) {
      console.log('🚫 Closing WebSocket...');
      this.ws.close();  // ✅ Properly close WebSocket   // ✅ Prevent reconnection issues
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
