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
import {
  IStockData,
  ITickerData,
} from '../../shared/interface/stock.interface';
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
  IHistoryData,
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
  nifty200: IStockData[] = [];
  liveData: ITickerData[] = [];
  innerHeight: number = window.innerHeight;
  innerWidth: number = window.innerWidth;
  watchListData: WatchList[] = watchListData;
  showAddButtonId!: number;
  activeTabViewIndex: number = 0;
  searchSubject: Subject<string> = new Subject();
  editWatchList!: WatchList | undefined;
  createWatchListDialogVisible: boolean = false;
  createWatchListName: string = '';
  selectedStock: IStockData =  {
    "symbol": "RELIANCE.NS",
    "name": "RELIANCE INDUSTRIES LTD",
    "current_price": 1238.85,
    "market_cap": 16764613165056,
    "sector": "Energy",
    "industry": "Oil & Gas Refining & Marketing",
    "ohlc": {
        "Open": 1242.1500244140625,
        "High": 1257.4000244140625,
        "Low": 1233.0999755859375,
        "Close": 1238.8499755859375,
        "Volume": 16635512.0
    }
}
  chartTimeFrame = '5minute';
  ChartAreaSeries!: any;
  chart: any;
  selectedChartStatisticData!: any;
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
      this.nifty200 = this.stockService.nifty200Data.filter(
        (data: IStockData) => data.name.startsWith(value.trim().toUpperCase())
      );
    });
  }

  async ngOnInit() {
    await this.stockService.loadNifty200Tokens();
    this.nifty200 = this.stockService.nifty200Data;
    this.selectedStock = this.stockService.nifty200Data[0];
    let symbols = this.nifty200.map((data: IStockData) => data.symbol);
    this.stockService.connect(symbols);
    this.stockService.liveData.subscribe((data: ITickerData) => {

      let index = this.liveData.findIndex((stock) => stock.id === data.id);
      if (index === -1) {
  
        this.liveData.push(data);
      } else {
        this.liveData[index] = data;
      }
      this.upDateChartData(data);
    });
  }

  ngAfterViewInit(): void {
    this.displayChart();
    this.createChart();
  }

  createChart() {
    const chartOptions = {
      height: this.innerHeight - 680,
      width: this.innerWidth - 300,
      layout: {
        textColor: 'black',
        background: { color: 'white' },
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { visible: false },
      },
    };
    this.chart = createChart('chart-container', chartOptions);
    this.ChartAreaSeries = this.chart.addAreaSeries({
      lineColor: '#2962FF',
      topColor: '#2962FF',
      bottomColor: 'rgba(41, 98, 255, 0.28)',
    });
  }

   getLiveItem(token: string, type?: string) {
    let closePrice = this.nifty200.find(item => item.symbol===token);
    let stock = this.liveData.find((item: ITickerData) => {
      if (item.id === token) {
        return item;
      }
    return 0})
    if(stock){
      switch (type) {
        case 'change':
          return stock?.change ?? 0;
        case 'percentage':
          return stock?.changePercent ?? 0;
        case 'current':
          return stock?.price ?? 0;
        default:
          return closePrice?.ohlc?.Close?? 0;
      }
    }
    return 0
  }

  deleteWatchListItem(watchListItem: WatchList, stockItem: IStockData) {
    this.watchListData.forEach((watchList: WatchList) => {
      if (watchList._id === watchListItem._id) {
        watchListItem = watchList;
        watchList.stocks = watchList.stocks.filter(
          (stock: IStockData) =>
            stock.symbol !== stockItem.symbol
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

  updateWatchList(op: any, event: any, stock: IStockData, watchListId: number) {
    this.watchListData.forEach((watchList: WatchList) => {
      if (watchList._id === watchListId) {
        let index = watchList.stocks.findIndex(
          (item: IStockData) => item.symbol === stock.symbol
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
    // this.searchSubject.next(event.target.value);
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

  selectingStock(stock: IStockData) {
    this.selectedStock = stock;
    this.displayChart();
  }

  async displayChart() {
    let historyData: HistoryData = await firstValueFrom(
      this.http.get<HistoryData>(
        `http://127.0.0.1:8000/history?ticker=${this.selectedStock.symbol}&interval=5m&period=7d`
      )
    );
    if (historyData.status) {
      this.stockHistoryData = historyData.payload.map((item) => {
        return {
          time: Math.floor(new Date(item.Datetime).getTime() / 1000) as Time,
          value: item.Close, // Use uppercase keys as per your backend response
        };
      });

      const lastOHLC =  this.nifty200.find(item=>item.symbol===this.selectedStock.symbol)
      if(lastOHLC){

        this.selectedChartStatisticData =
        {...historyData.payload[historyData.payload.length - 1], ...lastOHLC['ohlc']};
      }
      this.ChartAreaSeries.setData(this.stockHistoryData);
    }
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

  upDateChartData(data: ITickerData) {
    if (this.selectedStock.symbol === data.id) {
      let lastTimer = new Date(this.selectedChartStatisticData.Datetime);
      let add5Time = lastTimer.setMinutes(
        new Date(this.selectedChartStatisticData.Datetime).getMinutes() + 5
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
          value: data.price,
        };
        this.selectedChartStatisticData.Datetime = add5TimeConvertToAsia;
        this.stockHistoryData.push(object);
      } else {
        this.stockHistoryData[this.stockHistoryData.length - 1].value =
          data.price;
      }
      console.log('this.stockHistoryData', this.stockHistoryData)
      this.ChartAreaSeries.setData(this.stockHistoryData);
    }
  }
  ngOnDestroy() {
    this.stockService.liveData.unsubscribe()
    this.stockService.disconnect();
  }
}
