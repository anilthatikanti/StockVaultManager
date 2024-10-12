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
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { debounceTime, Subject } from 'rxjs';
import { DialogModule } from 'primeng/dialog';
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
    FloatLabelModule,
    InputTextModule,
    DialogModule,
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
  searchSubject: Subject<string> = new Subject();
  editWatchList!: WatchList | undefined;
  createWatchListDialogVisible: boolean = false;
  createWatchListName: string = '';

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
  ) {
    this.searchSubject.pipe(debounceTime(150)).subscribe((value) => {
      this.nifty200 = this.stockService.nifty200Data.filter((data: Stock) =>
        data.trading_symbol.includes(value.trim().toUpperCase())
      );
    });
  }

  async ngOnInit() {
    await this.stockService.loadNifty200Tokens();
    this.nifty200 = this.stockService.nifty200Data;
    let instrument_token = this.nifty200.map(
      (data: Stock) => data.instrument_token
    );
    this.stockService.connect(instrument_token);
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

  deleteWatchListItem(watchListItem: WatchList, stockItem: Stock) {
    this.watchListData.forEach((watchList: WatchList) => {
      if (watchList._id === watchListItem._id) {
        watchListItem = watchList;
        watchList.stocks = watchList.stocks.filter(
          (stock: Stock) =>
            stock.instrument_token !== stockItem.instrument_token
        );
      }
      return watchList;
    });
    this.messageService.add({
      severity: 'success',
      summary: `${watchListItem.watchListName} stock deleted.`,
      detail: `${stockItem.name} deleted from ${watchListItem.watchListName}.`,
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
            summary: `${watchList.watchListName} updated.`,
            detail: `${stock.name} added into ${watchList.watchListName}.`,
          });
        }
      }
    });
  }

  searchStock(event: any) {
    this.searchSubject.next(event.target.value);
  }
  getWatchListStocksCount() {
    return this.watchListData[this.activeTabViewIndex].stocks.length;
  }
  updatedWatchListName(watchListNewName: string) {
    this.watchListData.forEach((watchList: WatchList) => {
      if (watchList._id === this.editWatchList?._id) {
        this.messageService.add({
          severity: 'success',
          summary: `Watch list name updated`,
          detail: `${watchList.watchListName} is changed to ${watchListNewName}`,
        });
        watchList.watchListName = watchListNewName;
        this.editWatchList = undefined;
      }
      return watchList;
    });
  }
  createWatchList() {
    let index = this.watchListData.findIndex(
      (watchList) => watchList.watchListName === this.createWatchListName
    );
    if (index === -1) {
      this.watchListData.push({
        _id: Date.now(),
        watchListName: this.createWatchListName,
        stocks: [],
      });
      this.createWatchListDialogVisible = false;
      this.createWatchListName = '';
    } else {
      this.messageService.add({
        severity: 'warning',
        summary: `Watchlist create error`,
        detail: `${this.createWatchListName} is already exist.`,
      });
    }
  }
  cancelNewWatchList() {
    this.createWatchListName = '';
    this.createWatchListDialogVisible = false;
  }
}
