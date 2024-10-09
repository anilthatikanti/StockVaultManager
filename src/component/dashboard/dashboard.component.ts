import { Component, HostListener, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MenuItem } from 'primeng/api';
import { TabViewModule } from 'primeng/tabview';
import { StockService } from '../../shared/services/stock.service';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CardModule, ButtonModule, TabViewModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  nifty200: number[] = [];
  innerHeight: number = window.innerHeight;
  innerWidth: number = window.innerWidth;

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

  ngOnInit() {
    if (this.stockService.isLoaded) {
      this.stockService.connect();
    }
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
