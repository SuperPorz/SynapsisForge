import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VideoUpload } from './video-upload';
import { LessonsService } from '../../../core/services/lessons.service';
import { UploadService } from '../../../core/services/upload.service';

describe('VideoUpload', () => {
  let component: VideoUpload;
  let fixture: ComponentFixture<VideoUpload>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VideoUpload],
      providers: [
        { provide: LessonsService, useValue: {} },
        { provide: UploadService, useValue: { uploadVideo: vi.fn(() => ({ subscribe: vi.fn() })) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VideoUpload);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
