import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { CardModule } from 'primeng/card';
import {
  IStockData,
  ITickerData,
} from '../../../shared/interface/stock.interface';
import { CommonModule } from '@angular/common';
import { createChart, Time } from 'lightweight-charts';
import { firstValueFrom } from 'rxjs';
import { HistoryData } from '../../../shared/interface/response.interface';
import { MessageService } from 'primeng/api';
import { HttpClient } from '@angular/common/http';
import { SERVER_URL } from '../../../environments/environment';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-tv-chart',
  standalone: true,
  imports: [
    CardModule,
    CommonModule,
    ProgressSpinnerModule,
    DropdownModule,
    FormsModule,
  ],
  templateUrl: './tv-chart.component.html',
  styleUrl: './tv-chart.component.css',
})
export class TvChartComponent implements AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('chartContainer') chartContainerRef: ElementRef | undefined;
  @Input() isParentLoading: boolean = true;
  @Input() liveDataMap: { [symbol: string]: ITickerData } = {};
  @Input() selectedStock!: IStockData;
  @Input() chartData!: ITickerData;
  innerHeight: number = window.innerHeight;
  innerWidth: number = window.innerWidth;
  ChartAreaSeries!: any;
  selectedChartStatisticData!: any;
  chart: any;
  stockHistoryData!: { time: Time; value: number }[];
  // private isChartInitialized: boolean = false;
  
  private lastChartUpdate: number = 0;
  private chartUpdateThrottle: number = 100; // ms
  private chartDataLimit: number = 1000;
  private chartUpdateTimeout: any;
  isChartLoading: boolean = false;
  
  interval: { name: string; code: string } = { name: '1 Min', code: '1m' };
  timeIntervalOptions: { name: string; code: string }[] = [
    { name: '1 Min', code: '1m' },
    { name: '2 Min', code: '2m' },
    { name: '5 Min', code: '5m' },
    { name: '15 Min', code: '15m' },
    { name: '30 Min', code: '30m' },
    { name: '1 Hr', code: '1h' },
    { name: '1 Day', code: '1d' },
    { name: '5 Day', code: '5d' },
    { name: '1 week', code: '1wk' },
    { name: '1 Month', code: '1mo' },
    { name: '3 Months', code: '3mo' }
  ];
  timePeriod: { name: string; code: string } = { name: '7 Days', code: '7d' };
  timePeriodOptions: { name: string; code: string }[] = [
    { name: '1 Day', code: '1d' },
    { name: '7 Days', code: '7d' },
    { name: '1 Month', code: '1m' },
    { name: '3 Months', code: '3m' },
    { name: '6 Months', code: '6m' },
    { name: '1 Year', code: '1y' }
  ];
  @HostListener('window:resize', ['$event'])
  onWindowResize() {
    this.innerHeight = window.innerHeight;
    this.innerWidth = window.innerWidth;
    if (this.chart) {
      const { height, width } = this.getResponsiveChartSize(8);
      this.chart.resize(width, height - 275);
    }
  }
  constructor(
    private messageService: MessageService,
    private http: HttpClient
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    // console.log('selectedStock', this.selectedChartStatisticData)
    if (
      changes['selectedStock']?.previousValue !==
      changes['selectedStock']?.currentValue
    ) {
      this.displayChart(changes['selectedStock'].currentValue);
    } else if (
      changes['chartData']?.previousValue !== changes['chartData']?.currentValue
    ) {
      this.upDateChartData(changes['chartData'].currentValue);
    }
  }
  ngAfterViewInit(): void {
    // Initialize chart after view is ready
    setTimeout(() => this.initializeChart(), 0);
  }
  getResponsiveChartSize(rem: number = 8) {
    const vh = window.innerHeight;
    const vw = parseFloat(
      getComputedStyle(this.chartContainerRef?.nativeElement).width
    );
    const height = vh;
    const width = vw; // tweak as per sidebar/padding
    return { height, width };
  }

  getFormattedChange(symbol: string): string {
    const data = this.liveDataMap[symbol];
    if (!data) return '0.00 (0.00%)';
    else if (
      !this.isChartLoading &&
      data.price > this.selectedChartStatisticData?.High
    )
      this.selectedChartStatisticData.High = data.price;
    else if (
      !this.isChartLoading &&
      data.price < this.selectedChartStatisticData?.Low
    )
      this.selectedChartStatisticData.Low = data.price;
    const ch = (data?.change ?? 0).toFixed(2);
    const chp = (data?.changePercent ?? 0).toFixed(2);
    return `${data?.change >= 0 ? '+ ' : ''}${ch} (${
      data?.changePercent >= 0 ? '+ ' : ''
    }${chp}%)`;
  }

  private async initializeChart() {
    try {
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
      // this.isChartInitialized = true;

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
    }
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

        this.chart = createChart(
          this.chartContainerRef.nativeElement,
          chartOptions
        );
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

  async displayChart(stock: IStockData = this.selectedStock) {
    if (!this.ChartAreaSeries) {
      console.warn('Chart not initialized yet');
      return;
    }

    this.isChartLoading = true;
    try {
      const historyData: HistoryData = await firstValueFrom(
        this.http.get<HistoryData>(
          `${SERVER_URL}/stocks/history?symbol=${stock.symbol}&interval=${this.interval.code}&period=${this.timePeriod.code}`
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
    }
  }

  upDateChartData(data: ITickerData) {
    if (
      // !this.isChartInitialized ||
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
  private parseIntervalToMs(intervalCode: string): number {
  const match = intervalCode.match(/^(\d+)([a-zA-Z]+)$/);
  if (!match) return 0;

  const [, valueStr, unit] = match;
  const value = parseInt(valueStr);

  const multipliers: Record<string, number> = {
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    wk: 7 * 24 * 60 * 60 * 1000,
    mo: 30 * 24 * 60 * 60 * 1000, // rough month
  };

  return multipliers[unit] ? value * multipliers[unit] : 0;
}

private updateChartWithData(data: ITickerData) {
  if (this.isChartLoading) return;
  else if (
    !this.ChartAreaSeries ||
    !this.selectedChartStatisticData ||
    !this.stockHistoryData
  ) {
    return;
  }

  try {
    const intervalMs = this.parseIntervalToMs(this.interval.code);
    if (!intervalMs) return;

    const lastTimer = new Date(this.selectedChartStatisticData.Datetime);
    const nextExpectedTime = new Date(lastTimer.getTime() + intervalMs);
    const nextTimeInAsia = nextExpectedTime.toLocaleString('sv', {
      timeZone: 'Asia/Kolkata',
    });

    const now = new Date();

    let sameValue =
      this.stockHistoryData[this.stockHistoryData.length - 1].value !==
      data.price;
    let sameTime =
      Date.parse(nextTimeInAsia) / 1000 !==
      this.stockHistoryData[this.stockHistoryData.length - 1].time;

    const isWithinRestrictedTime =
      (now.getHours() >= 15 && now.getMinutes() >= 30) ||
      (now.getHours() < 9 && now.getMinutes() > 15);

    if (
      new Date().getTime() > nextExpectedTime.getTime() &&
      isWithinRestrictedTime &&
      sameValue &&
      sameTime
    ) {
      const object: { time: Time; value: number } = {
        time: (Date.parse(nextTimeInAsia) / 1000) as Time,
        value: data.price,
      };

      this.selectedChartStatisticData.Datetime = nextTimeInAsia;
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

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.remove();
    }
    if (this.chartUpdateTimeout) {
      clearTimeout(this.chartUpdateTimeout);
    }
  }
}
