import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '../interface/response.interface';
import { LiveData, Stock } from '../interface/stock.interface';
import { firstValueFrom, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class StockService {
  nifty200InstrumentalTockens: number[] = [];
  liveData: Subject<LiveData[]> = new Subject<LiveData[]>();
  dataMap: Map<number, LiveData> = new Map<number, LiveData>();
  ws!: WebSocket;
  nifty200Data: Map<number, Stock> = new Map<number, Stock>();

  constructor(private http: HttpClient) {}

  async loadNifty200Tokens(): Promise<void> {
    try {
      const data = await firstValueFrom(
        this.http.get<ApiResponse>(
          'https://api.investit.ai/go/assist_list?exchange=NSE&nifty_200=true'
        )
      );

      if (data.status) {
        data.payload.map((item: Stock) => {
          this.nifty200InstrumentalTockens.push(item.instrument_token);
          let data = this.nifty200Data.get(item.instrument_token);
          if (data) {
            Object.assign(data, item);
          } else {
            this.nifty200Data.set(item.instrument_token, item);
          }
        });
      }
    } catch (error) {
      console.error('Error loading Nifty 200 tokens', error);
    }
  }

  connect() {
    this.ws = new WebSocket('wss://data.investit.ai');
    this.ws.onopen = () => {
      console.log('WebSocket connection established');
      const message = {
        a: 'subscribe',
        v: this.nifty200InstrumentalTockens,
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
      this.updateData(JSON.parse(event.data));
    };
  }

  updateData(data: LiveData) {
    //this is way better than findIndex
    let test = this.dataMap.get(data.instrument_token);
    if (test) {
      Object.assign(test, data);
    } else {
      this.dataMap.set(data.instrument_token, data);
    }
    this.liveData.next(Array.from(this.dataMap.values()));
  }
}
