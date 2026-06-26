import { Component, computed, inject, input, output, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { LessonsService } from '../../../core/services/lessons.service';
import { UploadService, UploadProgress } from '../../../core/services/upload.service';

@Component({
  selector: 'app-video-upload',
  imports: [],
  templateUrl: './video-upload.html',
  styleUrl: './video-upload.css',
})
export class VideoUpload {
  private lessonsService = inject(LessonsService);
  private uploadService = inject(UploadService);

  courseId = input<string>('');
  lessonId = input<string>('');
  currentVideoUrl = input<string>('');

  uploaded = output<string>();

  canUpload = computed(() => !!this.courseId() && !!this.lessonId());

  uploading = signal(false);
  progress = signal<UploadProgress | null>(null);
  error = signal<string | null>(null);
  uploadedKey = signal<string | null>(null);
  dragOver = signal(false);

  async onFileSelected(file: File | undefined) {
    if (!file || !this.canUpload()) return;
    if (!file.type.startsWith('video/')) {
      this.error.set('Only video files are accepted.');
      return;
    }

    this.uploading.set(true);
    this.error.set(null);
    this.progress.set(null);

    try {
      const { uploadUrl, key, publicUrl } = await firstValueFrom(
        this.lessonsService.getPresignedUrl(file.name, file.type),
      );

      await this.uploadService.uploadToS3(uploadUrl, file, (p) => {
        this.progress.set(p);
      });

      await firstValueFrom(
        this.lessonsService.updateS3Key(this.courseId(), this.lessonId(), key),
      );

      this.uploadedKey.set(key);
      this.uploaded.emit(publicUrl);
    } catch {
      this.error.set('Upload failed. Please try again.');
    } finally {
      this.uploading.set(false);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.dragOver.set(true);
  }

  onDragLeave() {
    this.dragOver.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.dragOver.set(false);
    const file = event.dataTransfer?.files?.[0];
    this.onFileSelected(file);
  }
}

