import { Routes } from '@angular/router';

import { DashboardComponent } from '../dashboard/dashboard.component';
import { LoginComponent } from '../authentication/login/login.component';

export const routes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () =>
      import('../dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
  },
  {
    path: 'storage/:id',
    loadComponent: () =>
      import('../storage/storage.component').then((m) => m.StorageComponent),
  },
  {
    path: 'performance',
    loadComponent: () =>
      import('../performance/performance.component').then(
        (m) => m.PerformanceComponent
      ),
  },
  {
    path: 'bin/:id',
    loadComponent: () =>
      import('../bin/bin.component').then((m) => m.BinComponent),
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('../settings/settings.component').then((m) => m.SettingsComponent),
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
];
