import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, ReportedReview } from '../../../core/services/admin.service';

@Component({
  selector: 'app-content-moderation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './content-moderation.component.html',
  styleUrl: './content-moderation.component.scss',
})
export class ContentModerationComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  reportedReviews = signal<ReportedReview[]>([]);
  isLoading = signal(true);
  actionStatus = signal<{ [key: string]: string }>({});

  ngOnInit() {
    this.loadReportedReviews();
  }

  loadReportedReviews() {
    this.isLoading.set(true);
    this.adminService.getReportedReviews().subscribe({
      next: (reports) => {
        this.reportedReviews.set(reports);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  keepReview(reviewId: string) {
    this.actionStatus.update((status) => ({ ...status, [reviewId]: 'keeping' }));
    this.adminService.keepReportedReview(reviewId).subscribe({
      next: () => {
        this.actionStatus.update((status) => ({ ...status, [reviewId]: 'done' }));
        // Remove from list
        this.reportedReviews.update((prev) => prev.filter((r) => r.reviewId !== reviewId));
      },
      error: () => {
        this.actionStatus.update((status) => ({ ...status, [reviewId]: 'error' }));
      },
    });
  }

  hideReview(reviewId: string) {
    this.actionStatus.update((status) => ({ ...status, [reviewId]: 'hiding' }));
    this.adminService.hideReportedReview(reviewId).subscribe({
      next: () => {
        this.actionStatus.update((status) => ({ ...status, [reviewId]: 'done' }));
        // Remove from list
        this.reportedReviews.update((prev) => prev.filter((r) => r.reviewId !== reviewId));
      },
      error: () => {
        this.actionStatus.update((status) => ({ ...status, [reviewId]: 'error' }));
      },
    });
  }

  banUser(userId: string, reviewId: string) {
    if (!confirm('Bạn có chắc chắn muốn KHÓA (BAN) vĩnh viễn tài khoản người dùng này?')) {
      return;
    }

    this.actionStatus.update((status) => ({ ...status, [reviewId]: 'banning' }));
    this.adminService.banUser(userId).subscribe({
      next: () => {
        // Hide review as well as ban
        this.adminService.hideReportedReview(reviewId).subscribe({
          next: () => {
            this.actionStatus.update((status) => ({ ...status, [reviewId]: 'done' }));
            this.reportedReviews.update((prev) => prev.filter((r) => r.reviewId !== reviewId));
          },
          error: () => {
            this.actionStatus.update((status) => ({ ...status, [reviewId]: 'done' }));
            this.reportedReviews.update((prev) => prev.filter((r) => r.reviewId !== reviewId));
          },
        });
      },
      error: () => {
        this.actionStatus.update((status) => ({ ...status, [reviewId]: 'error' }));
      },
    });
  }
}
