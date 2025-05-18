import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TvChartComponent } from './tv-chart.component';

describe('TvChartComponent', () => {
  let component: TvChartComponent;
  let fixture: ComponentFixture<TvChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TvChartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TvChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
