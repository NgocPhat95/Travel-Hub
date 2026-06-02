import { Component, OnInit, inject, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PlaceService } from '../../../core/services/place.service';
import { TripService, Trip } from '../../../core/services/trip.service';
import { Place } from '../../../core/services/search.service';
import { SocialService, Post } from '../../../core/services/social.service';

@Component({
  selector: 'app-post-creator',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './post-creator.component.html',
  styleUrl: './post-creator.component.scss',
})
export class PostCreatorComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly placeService = inject(PlaceService);
  private readonly tripService = inject(TripService);
  private readonly socialService = inject(SocialService);

  @Output() postCreated = new EventEmitter<Post>();

  places = signal<Place[]>([]);
  trips = signal<Trip[]>([]);

  selectedImages = signal<File[]>([]);
  imagePreviews = signal<string[]>([]);

  isSubmitting = signal(false);
  errorMsg = signal('');
  successMsg = signal('');

  postForm = this.fb.group({
    content: [''],
    placeId: [''],
    tripId: [''],
  });

  ngOnInit() {
    this.loadPlaces();
    this.loadTrips();
  }

  loadPlaces() {
    this.placeService.getPlaces({ limit: 100 }).subscribe({
      next: (res) => this.places.set(res.places),
    });
  }

  loadTrips() {
    this.tripService.getTrips().subscribe({
      next: (res) => this.trips.set(res),
    });
  }

  onImagesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const files = Array.from(input.files);
      
      // Limit to 10 images
      const totalImages = this.selectedImages().length + files.length;
      if (totalImages > 10) {
        this.errorMsg.set('Bạn chỉ có thể tải lên tối đa 10 hình ảnh.');
        return;
      }

      files.forEach((file) => {
        this.selectedImages.update(prev => [...prev, file]);
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.imagePreviews.update(prev => [...prev, e.target.result]);
        };
        reader.readAsDataURL(file);
      });
      this.errorMsg.set('');
    }
  }

  removeImage(index: number) {
    this.selectedImages.update(prev => prev.filter((_, i) => i !== index));
    this.imagePreviews.update(prev => prev.filter((_, i) => i !== index));
  }

  submitPost() {
    const contentVal = this.postForm.value.content?.trim() || '';
    if (!contentVal && this.selectedImages().length === 0) {
      this.errorMsg.set('Vui lòng nhập nội dung bài viết hoặc đính kèm hình ảnh.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMsg.set('');
    this.successMsg.set('');

    const values = this.postForm.value;

    this.socialService.createPost({
      content: values.content!,
      placeId: values.placeId || undefined,
      tripId: values.tripId || undefined,
      images: this.selectedImages(),
    }).subscribe({
      next: (post) => {
        this.isSubmitting.set(false);
        this.successMsg.set('Đăng bài thành công!');
        this.postForm.reset();
        this.selectedImages.set([]);
        this.imagePreviews.set([]);
        
        // Notify parent NewsFeedComponent to insert the post at the top
        this.postCreated.emit(post);

        setTimeout(() => {
          this.successMsg.set('');
        }, 3000);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMsg.set(err?.error?.message || 'Có lỗi xảy ra khi đăng bài.');
      },
    });
  }
}
