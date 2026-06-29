import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let store: Record<string, string>;

  beforeEach(() => {
    store = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => store[key] ?? null),
      setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
      removeItem: vi.fn((key: string) => { delete store[key]; }),
      clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]); }),
      key: vi.fn((_i: number) => null),
      length: 0,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should default to stored value when localStorage has theme', () => {
    store['theme'] = 'dark';
    const service = TestBed.inject(ThemeService);
    expect(service.isDark()).toBe(true);
  });

  it('should default to light when stored theme is light', () => {
    store['theme'] = 'light';
    const service = TestBed.inject(ThemeService);
    expect(service.isDark()).toBe(false);
  });

  it('should toggle between dark and light', () => {
    store['theme'] = 'light';
    const service = TestBed.inject(ThemeService);
    expect(service.isDark()).toBe(false);

    service.toggle();
    expect(service.isDark()).toBe(true);

    service.toggle();
    expect(service.isDark()).toBe(false);
  });
});
