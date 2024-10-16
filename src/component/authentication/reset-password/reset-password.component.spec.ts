import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResetPaswwordComponent } from './reset-password.component';

describe('ResetPaswwordComponent', () => {
  let component: ResetPaswwordComponent;
  let fixture: ComponentFixture<ResetPaswwordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResetPaswwordComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ResetPaswwordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
