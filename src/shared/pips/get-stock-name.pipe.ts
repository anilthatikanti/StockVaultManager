import { Pipe, PipeTransform } from '@angular/core';
import { StockService } from '../services/stock.service';
import { LiveData, Stock } from '../interface/stock.interface';

@Pipe({
  name: 'getStockName',
  standalone: true,
})
export class GetStockNamePipe implements PipeTransform {
  constructor(private stockService: StockService) {}
  transform(id: number): number {
    let value: number = 0;

    console.log('value', value);
    return value;
  }
}
