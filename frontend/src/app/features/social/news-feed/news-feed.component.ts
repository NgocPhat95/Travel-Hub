import { Component, OnInit, OnDestroy, inject, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SocialService, Post } from '../../../core/services/social.service';
import { SocialSocketService } from '../../../core/services/social-socket.service';
import { AuthService } from '../../../core/services/auth.service';
import { PlaceService } from '../../../core/services/place.service';
import { TripService, Trip } from '../../../core/services/trip.service';
import { Place } from '../../../core/services/search.service';
import { PostCreatorComponent } from '../post-creator/post-creator.component';
import { LikeCommentComponent } from '../like-comment/like-comment.component';

@Component({
  selector: 'app-news-feed',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, PostCreatorComponent, LikeCommentComponent],
  templateUrl: './news-feed.component.html',
  styleUrl: './news-feed.component.scss',
})
export class NewsFeedComponent implements OnInit, OnDestroy {
  private readonly socialService = inject(SocialService);
  private readonly socialSocket = inject(SocialSocketService);
  private readonly authService = inject(AuthService);
  private readonly placeService = inject(PlaceService);
  private readonly tripService = inject(TripService);
  private readonly router = inject(Router);

  posts = signal<Post[]>([]);
  isLoading = signal(true);
  isLoadingMore = signal(false);
  page = 1;
  hasMore = signal(true);

  // Set of post IDs created in this session to apply slide-up animation
  newPostIds = new Set<string>();

  currentUserId = computed(() => this.authService.user()?.id);
  currentUserRole = computed(() => this.authService.user()?.role);

  places = signal<Place[]>([]);
  trips = signal<Trip[]>([]);

  activeDropdownPostId = signal<string | null>(null);
  showEditPostModal = signal(false);
  selectedPostForEdit = signal<Post | null>(null);

  editPostContent = new FormControl('');
  editPostPlaceId = new FormControl('');
  editPostTripId = new FormControl('');

  ngOnInit() {
    this.socialSocket.connect();
    this.loadFeed();
    this.loadPlacesAndTrips();
  }

  ngOnDestroy() {
    this.socialSocket.disconnect();
  }

  loadPlacesAndTrips() {
    this.placeService.getPlaces({ limit: 100 }).subscribe({
      next: (res) => this.places.set(res.places),
    });
    this.tripService.getTrips().subscribe({
      next: (res) => this.trips.set(res),
    });
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.activeDropdownPostId.set(null);
  }

  togglePostDropdown(postId: string, event: Event) {
    event.stopPropagation();
    if (this.activeDropdownPostId() === postId) {
      this.activeDropdownPostId.set(null);
    } else {
      this.activeDropdownPostId.set(postId);
    }
  }

  openEditModal(post: Post, event: Event) {
    event.stopPropagation();
    this.activeDropdownPostId.set(null);
    this.selectedPostForEdit.set(post);
    this.editPostContent.setValue(post.content);
    this.editPostPlaceId.setValue(post.placeId || '');
    this.editPostTripId.setValue(post.tripId || '');
    this.showEditPostModal.set(true);
  }

  closeEditModal() {
    this.showEditPostModal.set(false);
    this.selectedPostForEdit.set(null);
  }

  submitEditPost() {
    const post = this.selectedPostForEdit();
    if (!post) return;

    const content = this.editPostContent.value || '';
    if (!content.trim() && post.images.length === 0) {
      alert('Vui lòng nhập nội dung hoặc đính kèm hình ảnh.');
      return;
    }

    const dto = {
      content,
      placeId: this.editPostPlaceId.value || undefined,
      tripId: this.editPostTripId.value || undefined,
    };

    this.socialService.updatePost(post.id, dto).subscribe({
      next: (updatedPost) => {
        this.posts.update((prev) => 
          prev.map((p) => p.id === post.id ? { ...p, ...updatedPost } : p)
        );
        this.closeEditModal();
      },
      error: (err) => {
        alert(err?.error?.message || 'Có lỗi xảy ra khi cập nhật bài viết.');
      }
    });
  }

  deletePost(postId: string, event: Event) {
    event.stopPropagation();
    this.activeDropdownPostId.set(null);
    if (confirm('Bạn có chắc chắn muốn xóa bài viết này không?')) {
      this.socialService.deletePost(postId).subscribe({
        next: () => {
          this.posts.update((prev) => prev.filter((p) => p.id !== postId));
        },
        error: (err) => {
          alert(err?.error?.message || 'Có lỗi xảy ra khi xóa bài viết.');
        }
      });
    }
  }

  loadFeed() {
    this.isLoading.set(true);
    this.socialService.getFeed(1, 10).subscribe({
      next: (feed) => {
        this.posts.set(feed);
        this.isLoading.set(false);
        this.hasMore.set(feed.length === 10);
      },
      error: () => this.isLoading.set(false),
    });
  }

  loadMore() {
    if (this.isLoadingMore()) return;
    this.isLoadingMore.set(true);
    this.page++;

    this.socialService.getFeed(this.page, 10).subscribe({
      next: (feed) => {
        this.isLoadingMore.set(false);
        if (feed.length > 0) {
          this.posts.update((prev) => [...prev, ...feed]);
        }
        this.hasMore.set(feed.length === 10);
      },
      error: () => this.isLoadingMore.set(false),
    });
  }

  onPostCreated(post: Post) {
    this.newPostIds.add(post.id);
    this.posts.update((prev) => [post, ...prev]);
  }

  navigateToTrip(tripId: string) {
    this.router.navigate(['/trip', tripId]);
  }
}
