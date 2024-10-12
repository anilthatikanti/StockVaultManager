import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { negAuthGuard } from './neg-auth-gaurd.guard';

describe('negAuthGaurdGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => negAuthGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
