import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MoveFolderFileComponent } from './move-folder-file.component';

describe('MoveFolderFileComponent', () => {
  let component: MoveFolderFileComponent;
  let fixture: ComponentFixture<MoveFolderFileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MoveFolderFileComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MoveFolderFileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
