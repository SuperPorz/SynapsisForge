import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CartService, CartResponse } from './cart.service';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

describe('CartService', () => {
  let service: CartService;
  let httpMock: HttpTestingController;
  let authService: { isLoggedIn: ReturnType<typeof vi.fn> };

  const mockCart: CartResponse = {
    items: [
      { id: 'ci1', courseId: 'c1', title: 'Course 1', thumbnail_url: 't.jpg', price: 10, added_at: '2026-01-01' },
    ],
    total: 10,
    count: 1,
  };

  function configureModule() {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authService },
      ],
    });
  }

  beforeEach(() => {
    authService = { isLoggedIn: vi.fn().mockReturnValue(true) };
    configureModule();
    service = TestBed.inject(CartService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('loadCart', () => {
    it('should GET /cart and update signals', () => {
      service.loadCart();
      const req = httpMock.expectOne(`${environment.apiUrl}/cart`);
      expect(req.request.method).toBe('GET');
      req.flush(mockCart);

      expect(service.items()).toEqual(mockCart.items);
      expect(service.total()).toBe(10);
      expect(service.count()).toBe(1);
      expect(service.loading()).toBe(false);
      expect(service.isInCart('c1')).toBe(true);
    });

    it('should not call API when not logged in', () => {
      TestBed.resetTestingModule();
      authService = { isLoggedIn: vi.fn().mockReturnValue(false) };
      configureModule();
      service = TestBed.inject(CartService);
      httpMock = TestBed.inject(HttpTestingController);

      service.loadCart();
      httpMock.expectNone(`${environment.apiUrl}/cart`);
    });

    it('should handle error gracefully', () => {
      service.loadCart();
      const req = httpMock.expectOne(`${environment.apiUrl}/cart`);
      req.error(new ProgressEvent('error'));

      expect(service.loading()).toBe(false);
    });
  });

  describe('addItem', () => {
    it('should POST /cart and update signals', () => {
      service.addItem('c2').subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/cart`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ courseId: 'c2' });

      const newCart: CartResponse = {
        items: [
          ...mockCart.items,
          { id: 'ci2', courseId: 'c2', title: 'Course 2', thumbnail_url: 't2.jpg', price: 20, added_at: '2026-01-01' },
        ],
        total: 30,
        count: 2,
      };
      req.flush(newCart);

      expect(service.count()).toBe(2);
      expect(service.isInCart('c2')).toBe(true);
    });
  });

  describe('removeItem', () => {
    it('should DELETE /cart/:courseId and update signals', () => {
      service.removeItem('c1').subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/cart/c1`);
      expect(req.request.method).toBe('DELETE');

      req.flush(mockCart);
      expect(service.total()).toBe(10);
    });
  });

  describe('clearCart', () => {
    it('should DELETE /cart and reset signals', () => {
      service.clearCart().subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/cart`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true });

      expect(service.items()).toEqual([]);
      expect(service.total()).toBe(0);
      expect(service.count()).toBe(0);
      expect(service.isInCart('c1')).toBe(false);
    });
  });

  describe('checkout', () => {
    it('should POST /cart/checkout and reset signals', () => {
      service.checkout('fake-nonce', 30).subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/cart/checkout`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ nonce: 'fake-nonce', total: 30 });

      req.flush({ success: true, transactionId: 'tx1', itemCount: 2 });

      expect(service.items()).toEqual([]);
      expect(service.total()).toBe(0);
      expect(service.count()).toBe(0);
    });
  });

  describe('isInCart', () => {
    it('should return false for non-existing course', () => {
      expect(service.isInCart('nonexistent')).toBe(false);
    });
  });
});
