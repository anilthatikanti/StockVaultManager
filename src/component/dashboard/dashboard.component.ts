import { Component, HostListener, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MenuItem, MessageService } from 'primeng/api';
import { TabViewModule } from 'primeng/tabview';
import {
  StockService,
  watchListData,
} from '../../shared/services/stock.service';
import { FormsModule } from '@angular/forms';
import { LiveData, Stock } from '../../shared/interface/stock.interface';
import { GetStockNamePipe } from '../../shared/pips/get-stock-name.pipe';
import { CommonModule, DecimalPipe } from '@angular/common';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { DividerModule } from 'primeng/divider';
import { WatchList } from '../../shared/interface/watchList.interface';
import { ToastModule } from 'primeng/toast';
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
    TabViewModule,
    FormsModule,
    ToastModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  nifty200: Stock[] = [];
  liveData: LiveData[] = [];
  innerHeight: number = window.innerHeight;
  innerWidth: number = window.innerWidth;
  watchListData: WatchList[] = watchListData;
  showAddButtonId!: number;
  activeTabViewIndex: number = 0;
  editWatchListId!: number | undefined;

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

  constructor(
    private stockService: StockService,
    private messageService: MessageService
  ) {}

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

  deleteWatchListItem(watchListId: number, token: number) {
    this.watchListData.forEach((watchList: WatchList) => {
      if (watchList._id === watchListId) {
        watchList.stocks = watchList.stocks.filter(
          (stock: Stock) => stock.instrument_token !== token
        );
      }
      return watchList;
    });
  }

  updateWatchList(op: any, $event: any, stock: Stock, watchListId: number) {
    this.watchListData.forEach((watchList: WatchList) => {
      if (watchList._id === watchListId) {
        let index = watchList.stocks.findIndex(
          (item: Stock) => item.instrument_token === stock.instrument_token
        );
        if (index == -1) {
          watchList.stocks.push(stock);
          this.messageService.add({
            severity: 'success',
            summary: `${watchList.watchListName} updated`,
            detail: `${stock.name} added into ${watchList.watchListName}`,
          });
        }
      }
    });
  }

  updateWatchListName(event: any) {
    if (event.target.value) {
      this.watchListData[this.activeTabViewIndex].watchListName =
        event.target.value;
    }
    this.editWatchListId = undefined;
  }
}
