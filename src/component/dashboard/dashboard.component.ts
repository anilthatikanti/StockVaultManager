import { AfterViewInit, Component, HostListener, OnInit } from '@angular/core';
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
import { debounceTime, firstValueFrom, Subject } from 'rxjs';
import { DialogModule } from 'primeng/dialog';
import { createChart, Time } from 'lightweight-charts';
import { HttpClient } from '@angular/common/http';
import {
  History,
  HistoryData,
} from '../../shared/interface/response.interface';
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
export class DashboardComponent implements OnInit, AfterViewInit {
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
  selectedStock: Stock = {
    exchange: 'NSE',
    exchange_token: 13,
    instrument_token: 3329,
    instrument_type: 'EQ',
    name: 'ABB INDIA',
    segment: '',
    trading_symbol: 'ABB',
  };
  chartTimeFrame = '5minute';
  ChartAreaSeries!: any;
  chart: any;
  selectedChartStatisticData!: History;
  stockHistoryData!: { time: Time; value: number }[];

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
    if (this.chart) {
      this.chart.resize(this.innerWidth - 250, this.innerHeight - 680);
    }
  }

  constructor(
    private stockService: StockService,
    private messageService: MessageService,
    private http: HttpClient
  ) {
    this.onWindowResize();
    this.searchSubject.pipe(debounceTime(150)).subscribe((value) => {
      this.nifty200 = this.stockService.nifty200Data.filter((data: Stock) =>
        data.trading_symbol.startsWith(value.trim().toUpperCase())
      );
    });
  }

  async ngOnInit() {
    await this.stockService.loadNifty200Tokens();
    this.nifty200 = this.stockService.nifty200Data;
    this.selectedStock = this.stockService.nifty200Data[0];
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
      this.upDateChartData(data);
    });
  }

  ngAfterViewInit(): void {
    let data = this.calculateDateRange(this.chartTimeFrame);
    this.displyChart();
    this.createChart();
  }

  createChart() {
    let chartDiv = document.getElementById('chart-container');

    const chartOptions = {
      height: this.innerHeight - 680,
      width: this.innerWidth - 300,
      layout: {
        textColor: 'black',
        background: { color: 'white' },
      },
    };
    this.chart = createChart('chart-container', chartOptions);
    this.ChartAreaSeries = this.chart.addAreaSeries({
      lineColor: '#2962FF',
      topColor: '#2962FF',
      bottomColor: 'rgba(41, 98, 255, 0.28)',
    });
    console.log('this.innerHeight', this.innerHeight);
    console.log(
      'this.innerHeight - (this.innerHeight - 700)',
      this.innerHeight / 2
    );
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

  updateWatchList(op: any, event: any, stock: Stock, watchListId: number) {
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
    op.toggle(event);
  }

  searchStock(event: any) {
    this.searchSubject.next(event.target.value);
  }
  getWatchListStocksCount() {
    return this.watchListData[this.activeTabViewIndex]?.stocks?.length ?? 0;
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
    if (this.watchListData.length < 6) {
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
    } else {
      this.messageService.add({
        severity: 'info',
        summary: `Maximum 6 watchlist allowed.`,
        detail: `Already reached to maximum watchlists.`,
      });
    }
    this.createWatchListDialogVisible = false;
  }
  cancelNewWatchList() {
    this.createWatchListName = '';
    this.createWatchListDialogVisible = false;
  }
  deleteWatchList() {
    this.watchListData = this.watchListData.filter(
      (watchList) => watchList._id !== this.editWatchList?._id
    );
    this.editWatchList = undefined;
  }

  selectingStock(stock: Stock) {
    this.selectedStock = stock;
    this.displyChart();
  }

  async displyChart() {
    let dataObject = this.calculateDateRange(this.chartTimeFrame);
    let historyData: HistoryData = await firstValueFrom(
      this.http.get<HistoryData>(
        `https://api.investit.ai/data/historical?instrument_token=${this.selectedStock.instrument_token}&interval=${this.chartTimeFrame}&from_date=${dataObject.startDate}&to_date=${dataObject.endDate}`
      )
    );
    if (historyData.status) {
      this.stockHistoryData = historyData.payload.map((item) => {
        return {
          time: (Date.parse(item.date) / 1000) as Time,
          value: item.close,
        };
      });
      this.selectedChartStatisticData =
        historyData.payload[historyData.payload.length - 1];
      this.ChartAreaSeries.setData(this.stockHistoryData);
    }
    console.log(
      'this.selectedChartStatisticData',
      this.selectedChartStatisticData
    );
  }

  calculateDateRange(interval: string): { startDate: string; endDate: string } {
    const currentDate = new Date();
    let startDate = new Date();

    switch (interval) {
      case '60minute':
        // Subtract 1 year
        startDate.setFullYear(currentDate.getFullYear() - 1);
        break;
      case '30minute':
        // Subtract 6 months
        startDate.setMonth(currentDate.getMonth() - 6);
        break;
      case '15minute':
        // Subtract 4 months
        startDate.setMonth(currentDate.getMonth() - 4);
        break;
      case '5minute':
        // Subtract 3 months
        startDate.setMonth(currentDate.getMonth() - 3);
        break;
      default:
        throw new Error('Invalid interval selected');
    }

    return {
      startDate: new Date(startDate).toLocaleString('sv', {
        timeZone: 'Asia/Kolkata',
      }),
      endDate: new Date(currentDate).toLocaleString('sv', {
        timeZone: 'Asia/Kolkata',
      }),
    };
  }
  upDateChartData(data: LiveData) {
    if (this.selectedStock.instrument_token === data.instrument_token) {
      let lastTimer = new Date(this.selectedChartStatisticData.date);

      let add5Time = lastTimer.setMinutes(
        new Date(this.selectedChartStatisticData.date).getMinutes() + 5
      );

      let add5TimeConvertToAsia = new Date(add5Time).toLocaleString('sv', {
        timeZone: 'Asia/Kolkata',
      });
      const now = new Date();
      const isWithinRestrictedTime =
        (now.getHours() >= 15 && now.getMinutes() >= 30) ||
        (now.getHours() < 9 && now.getMinutes() > 15);

      if (
        new Date().getTime() > new Date(add5Time).getTime() &&
        isWithinRestrictedTime
      ) {
        let object: { time: Time; value: number } = {
          time: (Date.parse(add5TimeConvertToAsia) / 1000) as Time,
          value: data.last_price,
        };
        this.selectedChartStatisticData.date = add5TimeConvertToAsia;
        this.stockHistoryData.push(object);
      } else {
        this.stockHistoryData[this.stockHistoryData.length - 1].value =
          data.last_price;
      }
      this.ChartAreaSeries.setData(this.stockHistoryData);
    }
  }
}
