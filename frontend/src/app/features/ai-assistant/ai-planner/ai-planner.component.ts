import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AiService, ItineraryResult } from '../../../core/services/ai.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-ai-planner',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './ai-planner.component.html',
  styleUrl: './ai-planner.component.scss',
})
export class AiPlannerComponent {
  private readonly fb = inject(FormBuilder);
  private readonly aiService = inject(AiService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  isAuthenticated = this.authService.isAuthenticated;

  plannerForm: FormGroup = this.fb.group({
    destination: ['', [Validators.required, Validators.minLength(2)]],
    days: [3, [Validators.required, Validators.min(1), Validators.max(10)]],
    budget: ['Medium', [Validators.required]],
    companions: ['Friends', [Validators.required]],
  });

  isLoading = signal(false);
  showResult = signal(false);
  itinerary = signal<ItineraryResult | null>(null);
  activeDayTab = signal<number>(1);
  loadingText = signal('Analyzing preferences...');

  budgetOptions = [
    { value: 'Budget', label: 'Tiết kiệm (Tiết kiệm chi phí tối đa)' },
    { value: 'Medium', label: 'Trung bình (Cân bằng chi phí & trải nghiệm)' },
    { value: 'Luxury', label: 'Cao cấp (Trải nghiệm sang trọng đẳng cấp)' },
  ];

  companionOptions = [
    { value: 'Solo', label: 'Một mình (Tự do khám phá)' },
    { value: 'Couple', label: 'Cặp đôi (Lãng mạn, riêng tư)' },
    { value: 'Family', label: 'Gia đình (Tiện nghi, gắn kết)' },
    { value: 'Friends', label: 'Bạn bè (Năng động, vui vẻ)' },
  ];

  // Typing texts rotated during generation
  private loadingTexts = [
    'Analyzing preferences...',
    'Fetching destination maps...',
    'Matching database places...',
    'Sorting routes & schedule...',
    'Polishing day-by-day itinerary...',
  ];
  private textIntervalId: any;

  onSubmit() {
    if (this.plannerForm.invalid) {
      this.plannerForm.markAllAsTouched();
      return;
    }

    if (!this.isAuthenticated()) {
      alert('Vui lòng đăng nhập trước khi tạo lịch trình bằng AI.');
      return;
    }

    const formValues = this.plannerForm.value;
    this.isLoading.set(true);
    this.showResult.set(false);

    // Rotate loading text
    let textIdx = 0;
    this.loadingText.set(this.loadingTexts[textIdx]);
    this.textIntervalId = setInterval(() => {
      textIdx = (textIdx + 1) % this.loadingTexts.length;
      this.loadingText.set(this.loadingTexts[textIdx]);
    }, 2000);

    this.aiService.generateItinerary(formValues).subscribe({
      next: (res) => {
        // Slow down slightly to show smooth transition fade out
        setTimeout(() => {
          clearInterval(this.textIntervalId);
          this.itinerary.set(res);
          this.activeDayTab.set(1);
          this.isLoading.set(false);
          this.showResult.set(true);
        }, 1500);
      },
      error: (err) => {
        clearInterval(this.textIntervalId);
        this.isLoading.set(false);
        console.error('Itinerary generation error:', err);
        alert('Đã có lỗi xảy ra trong quá trình lập lịch trình bằng AI. Xin vui lòng thử lại.');
      },
    });
  }

  setActiveTab(dayNumber: number) {
    this.activeDayTab.set(dayNumber);
  }

  getCategoryColor(category: string): string {
    switch (category) {
      case 'HOTEL':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'RESTAURANT':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    }
  }

  getCategoryIcon(category: string): string {
    switch (category) {
      case 'HOTEL':
        return '🏨';
      case 'RESTAURANT':
        return '🍴';
      default:
        return '📍';
    }
  }
}
