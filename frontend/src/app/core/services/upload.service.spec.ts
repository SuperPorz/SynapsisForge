import { TestBed } from '@angular/core/testing';
import { UploadService, UploadProgress } from './upload.service';

describe('UploadService', () => {
  let service: UploadService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UploadService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('uploadToS3', () => {
    let mockXhr: any;

    beforeEach(() => {
      mockXhr = {
        open: vi.fn(),
        setRequestHeader: vi.fn(),
        upload: { onprogress: null },
        onload: null,
        onerror: null,
        onabort: null,
        send: vi.fn(),
        status: 200,
      };
      function MockXHR() { return mockXhr; }
      vi.stubGlobal('XMLHttpRequest', MockXHR as unknown as typeof XMLHttpRequest);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    function trigger(event: 'load' | 'error' | 'abort') {
      const handler = mockXhr['on' + event] as () => void | null;
      if (handler) handler();
    }

    it('should resolve on successful upload', async () => {
      const promise = service.uploadToS3('https://s3.example.com/upload', new File([''], 'v.mp4', { type: 'video/mp4' }));
      expect(mockXhr.open).toHaveBeenCalledWith('PUT', 'https://s3.example.com/upload', true);
      expect(mockXhr.setRequestHeader).toHaveBeenCalledWith('Content-Type', 'video/mp4');

      trigger('load');
      await expect(promise).resolves.toBeUndefined();
    });

    it('should reject on HTTP error status', async () => {
      mockXhr.status = 403;
      const promise = service.uploadToS3('https://s3.example.com/upload', new File([''], 'v.mp4', { type: 'video/mp4' }));
      trigger('load');
      await expect(promise).rejects.toThrow('Upload failed with status 403');
    });

    it('should reject on network error', async () => {
      const promise = service.uploadToS3('https://s3.example.com/upload', new File([''], 'v.mp4'));
      trigger('error');
      await expect(promise).rejects.toThrow('Upload failed: network error');
    });

    it('should reject on upload abort', async () => {
      const promise = service.uploadToS3('https://s3.example.com/upload', new File([''], 'v.mp4'));
      trigger('abort');
      await expect(promise).rejects.toThrow('Upload aborted');
    });
  });
});
