import { Component, EventEmitter, Input, Output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ReviewService } from '../../../core/services/review.service';

@Component({
  selector: 'app-write-review-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './write-review-modal.component.html',
  styleUrl: './write-review-modal.component.scss',
})
export class WriteReviewModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly reviewService = inject(ReviewService);

  @Input({ required: true }) placeId!: string;
  @Output() close = new EventEmitter<void>();
  @Output() submitted = new EventEmitter<void>();

  currentStep = signal(1); // 1: Ratings, 2: Content, 3: Media
  isSubmitting = signal(false);
  errorMessage = signal('');
  success = signal(false);

  // Ratings
  ratingOverall = signal(0);
  ratingCleanliness = signal(0);
  ratingService = signal(0);

  // Hover ratings
  hoverOverall = signal(0);
  hoverCleanliness = signal(0);
  hoverService = signal(0);

  // Review Form
  reviewForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    content: ['', [Validators.required, Validators.minLength(10)]],
  });

  // Media files
  selectedFiles = signal<{ file: File; preview: string; isVideo: boolean }[]>([]);

  setRating(category: 'overall' | 'cleanliness' | 'service', val: number) {
    if (category === 'overall') this.ratingOverall.set(val);
    if (category === 'cleanliness') this.ratingCleanliness.set(val);
    if (category === 'service') this.ratingService.set(val);
  }

  setHover(category: 'overall' | 'cleanliness' | 'service', val: number) {
    if (category === 'overall') this.hoverOverall.set(val);
    if (category === 'cleanliness') this.hoverCleanliness.set(val);
    if (category === 'service') this.hoverService.set(val);
  }

  nextStep() {
    if (this.currentStep() === 1) {
      if (this.ratingOverall() === 0 || this.ratingCleanliness() === 0 || this.ratingService() === 0) {
        this.errorMessage.set('Vui lòng chọn số sao đánh giá cho tất cả các tiêu chí.');
        return;
      }
      this.errorMessage.set('');
    }
    if (this.currentStep() === 2) {
      if (this.reviewForm.invalid) {
        this.reviewForm.markAllAsTouched();
        return;
      }
    }
    this.currentStep.update(s => s + 1);
  }

  prevStep() {
    this.currentStep.update(s => s - 1);
    this.errorMessage.set('');
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.addFiles(input.files);
    }
  }

  onFileDropped(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer?.files) {
      this.addFiles(event.dataTransfer.files);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  private addFiles(fileList: FileList) {
    const arr = Array.from(fileList);
    arr.forEach(file => {
      // Limit to 10MB
      if (file.size > 10 * 1024 * 1024) {
        this.errorMessage.set(`File ${file.name} vượt quá kích thước 10MB cho phép.`);
        return;
      }

      const isVideo = file.type.startsWith('video/');
      const preview = URL.createObjectURL(file);
      
      this.selectedFiles.update(files => [...files, { file, preview, isVideo }]);
    });
  }

  removeFile(index: number) {
    this.selectedFiles.update(files => {
      const updated = [...files];
      const removed = updated.splice(index, 1)[0];
      if (removed) {
        URL.revokeObjectURL(removed.preview);
      }
      return updated;
    });
  }

  onSubmit() {
    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const formData = new FormData();
    formData.append('ratingOverall', this.ratingOverall().toString());
    formData.append('ratingCleanliness', this.ratingCleanliness().toString());
    formData.append('ratingService', this.ratingService().toString());
    formData.append('title', this.reviewForm.value.title || '');
    formData.append('content', this.reviewForm.value.content || '');

    this.selectedFiles().forEach(f => {
      formData.append('media', f.file);
    });

    this.reviewService.createReview(this.placeId, formData).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.success.set(true);
        setTimeout(() => {
          this.submitted.emit();
          this.close.emit();
        }, 1500);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err?.error?.message || 'Có lỗi xảy ra khi gửi đánh giá. Vui lòng thử lại.');
      }
    });
  }
}
