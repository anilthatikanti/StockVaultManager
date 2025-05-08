import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '../interface/response.interface';
import { IStockData, ITickerData } from '../interface/stock.interface';
import { firstValueFrom, Subject } from 'rxjs';
import { WatchList } from '../interface/watchList.interface';
import { Auth } from '@angular/fire/auth';
import {  WEB_SOCKET, SERVER_URL } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class StockService {
  nifty50Data: IStockData[] = [];
  liveData: Subject<ITickerData> = new Subject<ITickerData>();
  dataMap: Map<number, ITickerData> = new Map<number, ITickerData>();
  ws!: WebSocket;
  isTockensLoaded: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private messageBuffer: ITickerData[] = [];
  private bufferSize: number = 10;
  private bufferTimeout: number = 100; // ms

  constructor(private http: HttpClient, private firebaseAuth: Auth) {}

  async loadNifty50Tokens(): Promise<void> {
    try {
      const data = await firstValueFrom(
        this.http.get<ApiResponse>(`${SERVER_URL}/stocks/nifty50`)
      );
      if (data.status) {
        this.nifty50Data = data.payload;
        this.isTockensLoaded = true;
      }
    } catch (error) {
      console.error('Error loading Nifty 50 tokens', error);
    }
  }

  private async connectWebSocket(nifty50InstrumentalTokens: string[]) {
    try {
      const jwtToken: any = await this.firebaseAuth.currentUser?.getIdToken();
      if (!jwtToken) {
        throw new Error('No authentication token available');
      }

      this.ws = new WebSocket(WEB_SOCKET, jwtToken);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.ws.send(JSON.stringify({
          "action": "subscribe",
          "variables": nifty50InstrumentalTokens,
          "type": "ltp"
        }));
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.handleReconnect(nifty50InstrumentalTokens);
      };

      this.ws.onclose = (event) => {
        console.warn('WebSocket closed:', event);
        this.handleReconnect(nifty50InstrumentalTokens);
      };

      this.ws.onmessage = (event) => {
        try {
          const stocks = JSON.parse(event.data);
          if (Array.isArray(stocks)) {
            this.bufferMessages(stocks);
          } else {
            this.bufferMessages([stocks]);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
    } catch (error) {
      console.error('Error establishing WebSocket connection:', error);
      this.handleReconnect(nifty50InstrumentalTokens);
    }
  }

  private handleReconnect(tokens: string[]) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      setTimeout(() => this.connectWebSocket(tokens), this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  private bufferMessages(messages: ITickerData[]) {
    this.messageBuffer.push(...messages);
    
    if (this.messageBuffer.length >= this.bufferSize) {
      this.flushBuffer();
    } else {
      setTimeout(() => this.flushBuffer(), this.bufferTimeout);
    }
  }

  private flushBuffer() {
    if (this.messageBuffer.length > 0) {
      this.messageBuffer.forEach(stock => this.liveData.next(stock));
      this.messageBuffer = [];
    }
  }

  async connect(nifty50InstrumentalTokens: string[]) {
    await this.connectWebSocket(nifty50InstrumentalTokens);
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
