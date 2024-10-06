import { Component } from '@angular/core';
import { provideRouter, RouterOutlet } from '@angular/router';
import { routes } from './auth.routes';

@Component({
  selector: 'app-authentication',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './authentication.component.html',
  styleUrl: './authentication.component.css',
})
export class AuthenticationComponent {}
