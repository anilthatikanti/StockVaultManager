import { GetStockNamePipe } from '../pips/get-stock-name.pipe';

describe('GetStockNamePipe', () => {
  it('create an instance', () => {
    const pipe = new GetStockNamePipe();
    expect(pipe).toBeTruthy();
  });
});
