import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '../interface/response.interface';
import { Stock } from '../interface/stock.interface';

@Injectable({
  providedIn: 'root',
})
export class StockService {
  nifty200InstrumentalTockens: number[] = [];
  ws!: WebSocket;
  isLoaded: boolean = false;
  constructor(private http: HttpClient) {
    if (!this.isLoaded) {
      this.http
        .get<ApiResponse>(
          'https://api.investit.ai/go/assist_list?exchange=NSE&nifty_200=true'
        )
        .subscribe((data: ApiResponse) => {
          if (data.status) {
            this.nifty200InstrumentalTockens = data.payload.map(
              (item: Stock) => item.instrument_token
            );
            this.isLoaded = true;
          }
        });
      console.log(
        'nifty200InstrumentalTockens',
        this.nifty200InstrumentalTockens
      );
      console.log('this.isLoaded', this.isLoaded);
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
    this.ws.onmessage = (event) => {
      console.log('event', event);
    };
  }
}
