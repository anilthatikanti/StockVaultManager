import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ForgotPasswardComponent } from './forgot-passward.component';

describe('ForgotPasswardComponent', () => {
  let component: ForgotPasswardComponent;
  let fixture: ComponentFixture<ForgotPasswardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForgotPasswardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ForgotPasswardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
