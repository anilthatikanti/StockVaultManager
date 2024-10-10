import { Component, HostListener, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MenuItem } from 'primeng/api';
import { TabViewModule } from 'primeng/tabview';
import {
  StockService,
  watchListData,
} from '../../shared/services/stock.service';
import { LiveData, Stock } from '../../shared/interface/stock.interface';
import { GetStockNamePipe } from '../../shared/pips/get-stock-name.pipe';
import { CommonModule, DecimalPipe } from '@angular/common';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { DividerModule } from 'primeng/divider';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CardModule,
    ButtonModule,
    TabViewModule,
    GetStockNamePipe,
    DecimalPipe,
    CommonModule,
    OverlayPanelModule,
    DividerModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  nifty200: Stock[] = [];
  liveData: LiveData[] = [];
  innerHeight: number = window.innerHeight;
  innerWidth: number = window.innerWidth;
  watchListData = watchListData;
  showAddButtonId!: number;

  watchList: any[] = [];
  items: MenuItem[] = [
    { label: 'Dashboard', icon: 'pi pi-home' },
    { label: 'Transactions', icon: 'pi pi-chart-line' },
    { label: 'Products', icon: 'pi pi-list' },
    { label: 'Messages', icon: 'pi pi-inbox' },
  ];
  @HostListener('window:resize', ['$event'])
  onWindowResize() {
    this.innerHeight = window.innerHeight;
    this.innerWidth = window.innerWidth;
  }

  constructor(private stockService: StockService) {}

  async ngOnInit() {
    await this.stockService.loadNifty200Tokens();
    this.nifty200 = this.stockService.nifty200Data;
    let instrument_token = this.nifty200.map(
      (data: Stock) => data.instrument_token
    );
    await this.stockService.connect(instrument_token);
    this.stockService.liveData.subscribe((data: LiveData) => {
      let index = this.liveData.findIndex(
        (stock) => stock.instrument_token === data.instrument_token
      );
      if (index === -1) {
        this.liveData.push(data);
      } else {
        this.liveData[index] = data;
      }
    });
  }

  getClosePrice(token: number) {}

  getLiveItem(token: number, type?: string): number {
    switch (type) {
      case 'close':
        return (
          this.liveData.find((item: LiveData) => {
            if (item.instrument_token === token) {
              return item;
            }
            return '';
          })?.ohlc.close ?? 0
        );
      case 'change':
        return (
          this.liveData.find((item: LiveData) => {
            if (item.instrument_token === token) {
              return item;
            }
            return '';
          })?.change ?? 0
        );
      default:
        return (
          this.liveData.find((item: LiveData) => {
            if (item.instrument_token === token) {
              return item;
            }
            return '';
          })?.last_price ?? 0
        );
    }
  }
  updateWatchList(data: Stock, _id: number) {
    this.watchListData.forEach((item) => {
      if (item._id === _id) {
        item.stocks.push(data);
      }
      return item;
    });
  }
}

const data = [
  {
    watchlistName: 'watch1',
    stocks: [
      {
        name: 'Acc',
        instrumentToken: '3329',
      },
      {
        name: 'Acc',
        instrumentToken: '3329',
      },
      {
        name: 'Acc',
        instrumentToken: '3329',
      },
    ],
  },
  {
    watchlistName: 'watch1',
    stocks: [
      {
        name: 'Acc',
        instrumentToken: '3329',
      },
    ],
  },
  {
    watchlistName: 'watch1',
    stocks: [
      {
        name: 'Acc',
        instrumentToken: '3329',
      },
    ],
  },
];
