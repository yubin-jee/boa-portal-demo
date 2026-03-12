import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ZelleTransferComponent } from './zelle-transfer.component';

describe('ZelleTransferComponent', () => {
  let component: ZelleTransferComponent;
  let fixture: ComponentFixture<ZelleTransferComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ZelleTransferComponent],
      imports: [ReactiveFormsModule, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ZelleTransferComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should be invalid when form is empty', () => {
    expect(component.form.invalid).toBeTrue();
  });

  it('should be valid with a correct email and amount', () => {
    component.form.setValue({ recipientHandle: 'test@example.com', amount: 100, note: '' });
    expect(component.form.valid).toBeTrue();
  });

  it('should reject amounts over $2,500', () => {
    component.form.setValue({ recipientHandle: 'test@example.com', amount: 2501, note: '' });
    expect(component.form.get('amount')?.invalid).toBeTrue();
  });
});
