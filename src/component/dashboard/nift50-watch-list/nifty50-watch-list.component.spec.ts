import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Nifty50WatchListComponent } from './nifty50-watch-list.component';

describe('Nifty50WatchListComponent', () => {
  let component: Nifty50WatchListComponent;
  let fixture: ComponentFixture<Nifty50WatchListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Nifty50WatchListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Nifty50WatchListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
