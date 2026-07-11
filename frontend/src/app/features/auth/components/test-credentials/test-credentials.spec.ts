import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TestCredentials } from './test-credentials';

describe('TestCredentials', () => {
  let component: TestCredentials;
  let fixture: ComponentFixture<TestCredentials>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestCredentials],
    }).compileComponents();

    fixture = TestBed.createComponent(TestCredentials);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display 3 test accounts', () => {
    const cards = fixture.nativeElement.querySelectorAll('div.rounded-xl');
    expect(cards.length).toBe(3);
  });

  it('should display admin email', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('admin@example.com');
  });

  it('should display student email', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('alice@example.com');
  });

  it('should display instructor email', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('james.carter@synapsis.dev');
  });

  it('should not show use button by default', () => {
    const btn = fixture.nativeElement.querySelector('button');
    expect(btn).toBeNull();
  });

  it('should show use button when showUseButton is true', () => {
    fixture.componentRef.setInput('showUseButton', true);
    fixture.detectChanges();
    const btns = fixture.nativeElement.querySelectorAll('button');
    expect(btns.length).toBe(3);
    expect(btns[0].textContent).toContain('Use this');
  });

  it('should emit account on button click', () => {
    fixture.componentRef.setInput('showUseButton', true);
    fixture.detectChanges();
    const spy = vi.fn();
    component.useAccount.subscribe(spy);

    const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    btn.click();

    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ email: 'admin@example.com', password: 'Password123!' }));
  });
});
