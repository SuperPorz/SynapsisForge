import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Terms } from './terms';

describe('Terms', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Terms],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(Terms);
    expect(fixture).toBeTruthy();
  });

  it('should render the back link', () => {
    const fixture = TestBed.createComponent(Terms);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const backLink = compiled.querySelector('a[href="/"]');
    expect(backLink).toBeTruthy();
    expect(backLink?.textContent?.trim()).toContain('Back to Home');
  });

  it('should render the terms heading', () => {
    const fixture = TestBed.createComponent(Terms);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Terms & Conditions');
  });
});
