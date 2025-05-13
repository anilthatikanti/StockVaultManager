import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
} from '@angular/core';
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
import { SERVER_URL } from '../../environments/environment';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
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
    ProgressSpinnerModule,
    DialogModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit, AfterViewInit {
 @ViewChild('chartContainer') chartContainerRef: ElementRef | undefined;

  nifty50: IStockData[] = [];
  liveDataMap: { [symbol: string]: ITickerData } = {};
  innerHeight: number = window.innerHeight;
  innerWidth: number = window.innerWidth;
  watchListData: WatchList[] = watchListData;
  showAddButtonId!: number;
  activeTabViewIndex: number = 0;
  searchSubject: Subject<string> = new Subject();
  editWatchList?: WatchList;
  createWatchListDialogVisible: boolean = false;
  createWatchListName: string = '';
  selectedStock: IStockData = {
    symbol: 'ADANIENT.NS',
    name: 'Adani Enterprises Limited',
    current_price: 0,
    market_cap: 0,
    ohlc: {
      Open: 0,
      High: 0,
      Low: 0,
      Close: 0,
      Volume: 0,
    },
  };
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
  private chartUpdateThrottle: number = 100; // ms
  private lastChartUpdate: number = 0;
  private chartDataLimit: number = 1000; // Maximum number of data points to keep
  private chartUpdateTimeout: any;
  isLoading: boolean = true;
  isChartLoading: boolean = true;
  isStocksLoading: boolean = true;
  loadingMessage: string = 'Loading dashboard...';
  private isChartInitialized: boolean = false;
  isChartReady: boolean = false;
  isMarketClosed = false;

  @HostListener('window:resize', ['$event'])
  onWindowResize() {
    this.innerHeight = window.innerHeight;
    this.innerWidth = window.innerWidth;
    if (this.chart) {
      const { height, width } = this.getResponsiveChartSize(8);
      this.chart.resize( width,height - 275);
    }
  }

  constructor(
    private stockService: StockService,
    private messageService: MessageService,
    private http: HttpClient
  ) {
    this.onWindowResize();
    this.searchSubject.pipe(debounceTime(150)).subscribe((value) => {
      this.nifty50 = this.stockService.nifty50Data.filter((data: IStockData) =>{
        return data.name.toUpperCase().startsWith(value.trim().toUpperCase())}
      );
    });
  }

  async ngOnInit() {
    try {
      this.isLoading = true;
      this.loadingMessage = 'Loading Nifty 50 stocks...';

      // Load Nifty 50 data first
      await this.stockService.loadNifty50Tokens();
      this.nifty50 = this.stockService.nifty50Data;
      this.selectedStock = this.nifty50[0];
      await this.initializeWebSocket();
      this.isStocksLoading = false;
    } catch (error) {
      console.error('Error initializing dashboard:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to initialize dashboard. Please refresh the page.',
      });
    } finally {
      this.isLoading = false;
    }
  }

  ngAfterViewInit(): void {
    // Initialize chart after view is ready
    this.initializeChart();
  }

  async initializeWebSocket() {
    // Initialize WebSocket connection
    this.loadingMessage = 'Connecting to live data...';
    const symbols = this.nifty50.map((data: IStockData) => data.symbol);
    await this.stockService.connect(symbols);

    // Subscribe to live data
    this.stockService.liveData$.subscribe((data: ITickerData | any) => {
      if (data.type === 'closed') {
        this.isMarketClosed = true;
        this.loadingMessage = data.message;
        return;
      }
      this.liveDataMap[data.id] = data;
      this.isMarketClosed = false;
      if (this.isChartInitialized && this.ChartAreaSeries) {
        this.upDateChartData(data);
      }
    });
  }

  private async initializeChart() {
    try {
      this.isChartLoading = true;
      this.isChartReady = false;
      if (!this.chartContainerRef) {
        throw new Error('Chart container not found');
      }

      // Ensure container has dimensions
      if (
        this.chartContainerRef.nativeElement.offsetHeight === 0 ||
        this.chartContainerRef.nativeElement.offsetWidth === 0
      ) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        if (
          this.chartContainerRef.nativeElement.offsetHeight === 0 ||
          this.chartContainerRef.nativeElement.offsetWidth === 0
        ) {
          throw new Error('Chart container has no dimensions');
        }
      }

      await this.createChart();
      this.isChartInitialized = true;

      // Load initial chart data after initialization
      if (this.selectedStock) {
        await this.displayChart(this.selectedStock);
      }
    } catch (error) {
      console.error('Error initializing chart:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to initialize chart. Please try again.',
      });
    } finally {
      this.isChartLoading = false;
      this.isChartReady = true;
    }
  }

  getResponsiveChartSize(rem: number = 8) {
    const vh = window.innerHeight;
  const vw = parseFloat(getComputedStyle(this.chartContainerRef?.nativeElement).width);
  const height = vh;
  const width = vw ; // tweak as per sidebar/padding

  return { height, width };
}

  private async createChart() {
    return new Promise<void>((resolve, reject) => {
      try {
        if (!this.chartContainerRef) {
          reject(new Error('Chart container not found'));
          return;
        }
        const { height, width } = this.getResponsiveChartSize(8);

        const chartOptions = {
          // width:this.innerWidth - 610,height: this.innerHeight - 278,
          width: width,
          height: height - 275,
          layout: {
            textColor: 'black',
            background: { color: 'white' },
          },
          grid: {
            vertLines: { visible: false },
            horzLines: { visible: false },
          },
          timeScale: {
            timeVisible: true,
            secondsVisible: false,
            fixLeftEdge: true,
            fixRightEdge: true,
            lockVisibleTimeRangeOnResize: true,
          },
          rightPriceScale: {
            borderVisible: false,
          },
          handleScroll: {
            mouseWheel: true,
            pressedMouseMove: true,
            horzTouchDrag: true,
            vertTouchDrag: true,
          },
        };

        this.chart = createChart(this.chartContainerRef.nativeElement, chartOptions);
        this.ChartAreaSeries = this.chart.addAreaSeries({
          lineColor: '#2962FF',
          topColor: '#2962FF',
          bottomColor: 'rgba(41, 98, 255, 0.28)',
          priceFormat: {
            type: 'price',
            precision: 2,
            minMove: 0.01,
          },
        });
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

//   getLiveItem(token: string, type?: string): number {
//   const stock = this.liveDataMap[token];
//   if (!stock) return 0;

//   switch (type) {
//     case 'change':
//       return stock.change ?? 0;
//     case 'percentage':
//       return stock.changePercent ?? 0;
//     case 'current':
//       return stock.price ?? 0;
//     default:
//       return this.nifty50.find((item) => item.symbol === token)?.ohlc?.Close ?? 0;
//   }
// }

getFormattedChange(symbol: string): string {
  const data = this.liveDataMap[symbol];
  if (!data) return '0.00 (0.00%)';
  else if(data.price>this.selectedChartStatisticData.High) this.selectedChartStatisticData.High = data.price;
  else if(data.price<this.selectedChartStatisticData.Low) this.selectedChartStatisticData.Low = data.price;
  const ch = (data?.change??0).toFixed(2);
  const chp = (data?.changePercent??0).toFixed(2);
  return `${data?.change >= 0 ? '+ ' : '-'}${ch} (${data?.changePercent >= 0 ? '+ ' : '-'}${chp}%)`;
}


  deleteWatchListItem(watchListItem: WatchList, stockItem: IStockData) {
    this.watchListData.forEach((watchList: WatchList) => {
      if (watchList._id === watchListItem._id) {
        watchListItem = watchList;
        watchList.stocks = watchList.stocks.filter(
          (stock: IStockData) => stock.symbol !== stockItem.symbol
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

  selectingStock(stock: IStockData) {
    this.displayChart(stock);
  }

  async displayChart(stock: IStockData = this.selectedStock) {
    if (!this.ChartAreaSeries) {
      console.warn('Chart not initialized yet');
      return;
    }

    this.isChartLoading = true;
    this.isChartReady = false;
    try {
      const historyData: HistoryData = await firstValueFrom(
        this.http.get<HistoryData>(
          `${SERVER_URL}/stocks/history?symbol=${stock.symbol}&interval=5m&period=7d`
        )
      );

      if (historyData.status) {
        this.stockHistoryData = historyData.payload
          .slice(-this.chartDataLimit)
          .map((item) => ({
            time: Math.floor(new Date(item.Datetime).getTime() / 1000) as Time,
            value: item.Close,
          }));

        this.selectedChartStatisticData =
          historyData.payload[historyData.payload.length - 1];
        this.ChartAreaSeries.setData(this.stockHistoryData);
        this.chart.timeScale().fitContent();
        this.selectedStock = stock;
      }
    } catch (error) {
      console.error('Error fetching history data:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to fetch stock history data.',
      });
    } finally {
      this.isChartLoading = false;
      this.isChartReady = true;
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
    if (
      !this.isChartInitialized ||
      !this.ChartAreaSeries ||
      !this.selectedStock ||
      !this.selectedChartStatisticData
    ) {
      return;
    }

    if (this.selectedStock.symbol === data.id) {
      const now = Date.now();
      if (now - this.lastChartUpdate < this.chartUpdateThrottle) {
        clearTimeout(this.chartUpdateTimeout);
        this.chartUpdateTimeout = setTimeout(
          () => this.updateChartWithData(data),
          this.chartUpdateThrottle
        );
        return;
      }
      this.updateChartWithData(data);
      this.lastChartUpdate = now;
    }
  }

  private updateChartWithData(data: ITickerData) {
    if (
      !this.ChartAreaSeries ||
      !this.selectedChartStatisticData ||
      !this.stockHistoryData
    ) {
      return;
    }

    try {
      const lastTimer = new Date(this.selectedChartStatisticData.Datetime);
      const add5Time = lastTimer.setMinutes(
        new Date(this.selectedChartStatisticData.Datetime).getMinutes() + 5
      );
      const add5TimeConvertToAsia = new Date(add5Time).toLocaleString('sv', {
        timeZone: 'Asia/Kolkata',
      });
      const now = new Date();
      let sameValue = this.stockHistoryData[this.stockHistoryData.length - 1].value!==data.price;
      let sameTime =(Date.parse(add5TimeConvertToAsia) / 1000) !==this.stockHistoryData[this.stockHistoryData.length - 1].time
      const isWithinRestrictedTime =
        (now.getHours() >= 15 && now.getMinutes() >= 30) ||
        (now.getHours() < 9 && now.getMinutes() > 15);

      if (
        new Date().getTime() > new Date(add5Time).getTime() &&
        isWithinRestrictedTime && sameValue && sameTime
      ) {
        const object: { time: Time; value: number } = {
          time: (Date.parse(add5TimeConvertToAsia) / 1000) as Time,
          value: data.price,
        };
        this.selectedChartStatisticData.Datetime = add5TimeConvertToAsia;
        this.stockHistoryData.push(object);

        if (this.stockHistoryData.length > this.chartDataLimit) {
          this.stockHistoryData = this.stockHistoryData.slice(
            -this.chartDataLimit
          );
        }
      } else {
        this.stockHistoryData[this.stockHistoryData.length - 1].value =
          data.price;
      }

      this.ChartAreaSeries.setData(this.stockHistoryData);
    } catch (error) {
      console.error('Error updating chart data:', error);
    }
  }

  ngOnDestroy() {
    if (this.chartUpdateTimeout) {
      clearTimeout(this.chartUpdateTimeout);
    }
    this.stockService.disconnect();
    this.stockService.liveData$.unsubscribe();
    if (this.chart) {
      this.chart.remove();
    }
    this.isChartInitialized = false;
  }
}
