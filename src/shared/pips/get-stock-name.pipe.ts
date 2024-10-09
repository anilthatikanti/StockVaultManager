import { Pipe, PipeTransform } from '@angular/core';
import { StockService } from '../services/stock.service';
import { Stock } from '../interface/stock.interface';

@Pipe({
  name: 'getStockName',
  standalone: true,
})
export class GetStockNamePipe implements PipeTransform {
  constructor(private stockService: StockService) {}
  transform(id: number): string {
    let item: Stock | string =
      this.stockService.nifty200Data.get(id)?.name ?? '';
    return item ?? '';
  }
}
