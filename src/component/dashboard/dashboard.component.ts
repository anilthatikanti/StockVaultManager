import { Component } from '@angular/core';
import { AvatarModule } from 'primeng/avatar';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [AvatarModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {}
