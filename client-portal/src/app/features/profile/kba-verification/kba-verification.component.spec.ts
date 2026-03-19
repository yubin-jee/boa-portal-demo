import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { KbaVerificationComponent } from './kba-verification.component';

describe('KbaVerificationComponent', () => {
  let component: KbaVerificationComponent;
  let fixture: ComponentFixture<KbaVerificationComponent>;
  let httpMock: HttpTestingController;

  const mockQuestions = [
    { questionId: 'q1', questionText: "What was the name of your first pet?" },
    { questionId: 'q2', questionText: "What city were you born in?" },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KbaVerificationComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(KbaVerificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    httpMock = TestBed.inject(HttpTestingController);
    const req = httpMock.expectOne('/api/v2/profile/kba/questions');
    req.flush(mockQuestions);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('should create', () => expect(component).toBeTruthy());

  it('should render one input per KBA question', () => {
    expect(component.questions.length).toBe(2);
    expect(component.form.contains('q1')).toBeTrue();
    expect(component.form.contains('q2')).toBeTrue();
  });

  it('should be invalid when answers are blank', () => {
    expect(component.form.invalid).toBeTrue();
  });

  it('should set verified=true on successful verification', () => {
    component.form.setValue({ q1: 'Fluffy', q2: 'Chicago' });
    component.verify();

    const req = httpMock.expectOne('/api/v2/profile/kba/verify');
    req.flush({ verified: true, attemptsRemaining: 3 });

    expect(component.verified).toBeTrue();
  });

  it('should decrement attemptsRemaining on failure', () => {
    component.form.setValue({ q1: 'wrong', q2: 'wrong' });
    component.verify();

    const req = httpMock.expectOne('/api/v2/profile/kba/verify');
    req.flush({ verified: false, attemptsRemaining: 2 });

    expect(component.failed).toBeTrue();
    expect(component.attemptsRemaining).toBe(2);
  });
});
