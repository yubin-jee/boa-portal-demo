import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ZelleTransferComponent } from './zelle-transfer.component';

describe('ZelleTransferComponent', () => {
  let component: ZelleTransferComponent;
  let fixture: ComponentFixture<ZelleTransferComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ZelleTransferComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ZelleTransferComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    httpMock = TestBed.inject(HttpTestingController);
    // Flush the contacts request made during ngOnInit
    const req = httpMock.match('/api/v2/zelle/contacts');
    if (req.length) {
      req[0].flush([]);
    }
  });

  afterEach(() => httpMock.verify());

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
