import { Component, OnInit, OnDestroy, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Title, Meta } from '@angular/platform-browser';
import { PlaceService, Question } from '../../../core/services/place.service';
import { AuthService } from '../../../core/services/auth.service';
import { Place } from '../../../core/services/search.service';
import { ReviewListComponent } from '../../review/review-list/review-list.component';
import { WishlistToggleComponent } from '../wishlist-toggle/wishlist-toggle.component';
import { PriceComparisonComponent } from '../price-comparison/price-comparison.component';

@Component({
  selector: 'app-place-detail',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    RouterLink, 
    ReviewListComponent, 
    WishlistToggleComponent,
    PriceComparisonComponent
  ],
  templateUrl: './place-detail.component.html',
  styleUrl: './place-detail.component.scss',
})
export class PlaceDetailComponent implements OnInit, OnDestroy {
  private readonly placeService = inject(PlaceService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly fb = inject(FormBuilder);
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  place = signal<Place | null>(null);
  questions = signal<Question[]>([]);
  isLoading = signal(true);
  isLoadingQA = signal(false);
  errorMessage = signal('');

  isAuthenticated = this.authService.isAuthenticated;

  // Active picture slide
  activeImage = signal<string>('');
  
  // Gallery tab ('official' or 'traveler')
  galleryTab = signal<'official' | 'traveler'>('official');

  // Accordion active questions map (QID -> boolean)
  expandedQuestions = signal<{ [key: string]: boolean }>({});

  // Question Form
  questionForm = this.fb.group({
    content: ['', [Validators.required, Validators.minLength(10)]],
  });

  // Answer Forms map
  answerForm = this.fb.nonNullable.group({
    content: ['', [Validators.required, Validators.minLength(5)]],
  });
  activeAnswerQid = signal<string | null>(null);

  // Suggest Edit Form
  editForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    description: [''],
    address: ['', Validators.required],
    priceRange: [''],
  });
  isSubmittingEdit = signal(false);
  editSuccessMessage = signal('');
  editErrorMessage = signal('');

  ngOnInit() {
    this.route.params.subscribe((params) => {
      const id = params['id'];
      if (id) {
        this.loadPlaceDetail(id);
      }
    });
  }

  loadPlaceDetail(id: string) {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.placeService.getPlaceDetail(id).subscribe({
      next: (res) => {
        this.place.set(res.place);
        this.galleryTab.set('official');
        this.activeImage.set(res.place.images?.[0] || res.place.avatarUrl || '');
        this.isLoading.set(false);

        // Prepopulate edit form
        this.editForm.patchValue({
          name: res.place.name,
          description: res.place.description ?? '',
          address: res.place.address,
          priceRange: res.place.priceRange ?? '',
        });

        // Set SEO tags
        this.title.setTitle(res.seo.title);
        this.meta.updateTag({ name: 'description', content: res.seo.metaDescription });
        this.meta.updateTag({ property: 'og:title', content: res.seo.title });
        this.meta.updateTag({ property: 'og:description', content: res.seo.metaDescription });

        // Inject JSON-LD Schema
        this.injectJsonLd(res.seo.jsonLdSchema);

        // Load Q&A
        this.loadQuestions(id);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('Không thể tải chi tiết địa điểm. Vui lòng thử lại.');
      },
    });
  }

  loadQuestions(placeId: string) {
    this.isLoadingQA.set(true);
    this.placeService.getPlaceQuestions(placeId).subscribe({
      next: (data) => {
        this.questions.set(data);
        this.isLoadingQA.set(false);
      },
      error: () => {
        this.isLoadingQA.set(false);
      },
    });
  }

  private injectJsonLd(schema: any) {
    if (isPlatformBrowser(this.platformId)) {
      const script = this.document.createElement('script');
      script.type = 'application/ld+json';
      script.id = 'json-ld-schema';
      script.text = JSON.stringify(schema);

      // Remove existing script if it exists
      const existing = this.document.getElementById('json-ld-schema');
      if (existing) {
        existing.remove();
      }
      this.document.head.appendChild(script);
    }
  }

  toggleQuestion(qId: string) {
    this.expandedQuestions.update((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  }

  submitQuestion() {
    if (this.questionForm.invalid || !this.place()) {
      return;
    }
    const content = this.questionForm.value.content || '';
    
    this.placeService.createQuestion(this.place()!.id, content).subscribe({
      next: (newQ) => {
        this.questions.update((prev) => [newQ, ...prev]);
        this.questionForm.reset();
      },
    });
  }

  openAnswerForm(qId: string) {
    this.activeAnswerQid.set(qId);
    this.answerForm.reset();
  }

  submitAnswer(qId: string) {
    if (this.answerForm.invalid) {
      return;
    }
    const content = this.answerForm.getRawValue().content;

    this.placeService.createAnswer(qId, content).subscribe({
      next: (newAnswer) => {
        this.questions.update((prevList) =>
          prevList.map((q) => {
            if (q.id === qId) {
              return {
                ...q,
                answers: [...q.answers, newAnswer],
              };
            }
            return q;
          })
        );
        this.activeAnswerQid.set(null);
        this.answerForm.reset();
      },
    });
  }

  submitEditSuggestion() {
    if (this.editForm.invalid || !this.place()) {
      return;
    }
    this.isSubmittingEdit.set(true);
    this.editSuccessMessage.set('');
    this.editErrorMessage.set('');

    const proposedData = this.editForm.getRawValue();

    this.placeService.suggestEdit(this.place()!.id, proposedData).subscribe({
      next: () => {
        this.isSubmittingEdit.set(false);
        this.editSuccessMessage.set('Cảm ơn bạn! Đề xuất đã được gửi lên hệ thống và chờ quản trị viên phê duyệt.');
      },
      error: () => {
        this.isSubmittingEdit.set(false);
        this.editErrorMessage.set('Không thể gửi đề xuất chỉnh sửa. Vui lòng thử lại sau.');
      },
    });
  }

  ngOnDestroy() {
    // Clean up SEO JSON-LD script from DOM
    if (isPlatformBrowser(this.platformId)) {
      const existing = this.document.getElementById('json-ld-schema');
      if (existing) {
        existing.remove();
      }
    }
  }
}
