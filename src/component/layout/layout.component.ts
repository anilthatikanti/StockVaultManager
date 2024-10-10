import { Component } from '@angular/core';
import { AvatarModule } from 'primeng/avatar';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { RouterOutlet } from '@angular/router';
import { DividerModule } from 'primeng/divider';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { ToastModule } from 'primeng/toast';
import { StockService } from '../../shared/services/stock.service';
@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    AvatarModule,
    OverlayPanelModule,
    ButtonModule,
    MenuModule,
    RouterOutlet,
    DividerModule,
    ConfirmPopupModule,
    ToastModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css',
})
export class LayoutComponent {
  items: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: 'pi pi-home',
      routerLink: '/dashboard',
    },
    {
      label: 'Performance',
      icon: 'pi pi-chart-line',
      routerLink: '/performance',
    },
    {
      label: 'Storage',
      icon: 'pi pi-database',
      routerLink: '/storage',
    },
    {
      label: 'Support',
      icon: 'pi pi-headphones',
      routerLink: '/support',
    },
    {
      label: 'Settings',
      icon: 'pi pi-cog',
      routerLink: '/settings',
    },
  ];

  constructor(
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private stockService: StockService
  ) {}

  confirm2(event: Event) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Do you want to logout?',
      header: 'Logout Confirmation',
      icon: 'pi pi-info-circle',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      rejectButtonStyleClass: 'p-button-text p-button-text',
      acceptIcon: 'none',
      rejectIcon: 'none',

      accept: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Logout success',
          detail: 'Logout user',
        });
      },
      reject: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Logout cancel',
          detail: 'You have cancelled',
        });
      },
    });
  }
}
