import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  messageService?: MessageService;
  constructor() {}
  showToast() {
    this.messageService!.add({
      severity: 'success',
      summary: 'Test',
      detail: 'This toast is for testing',
    });
  }
}
