import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal, OnInit, OnDestroy, HostListener } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core/services/auth.service';
import { SocialService, Post } from '../../../core/services/social.service';
import { SocialSocketService } from '../../../core/services/social-socket.service';
import { PlaceService } from '../../../core/services/place.service';
import { TripService, Trip } from '../../../core/services/trip.service';
import { BookingService, Booking } from '../../../core/services/booking.service';
import { ChatService, Conversation, Message, Participant } from '../../../core/services/chat.service';
import { Place } from '../../../core/services/search.service';
import { BusinessDashboardComponent } from '../business-dashboard/business-dashboard.component';
import { PostCreatorComponent } from '../../social/post-creator/post-creator.component';
import { LikeCommentComponent } from '../../social/like-comment/like-comment.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    BusinessDashboardComponent,
    PostCreatorComponent,
    LikeCommentComponent,
    RouterLink
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly socialService = inject(SocialService);
  private readonly socialSocket = inject(SocialSocketService);
  private readonly placeService = inject(PlaceService);
  private readonly tripService = inject(TripService);
  private readonly chatService = inject(ChatService);
  private readonly bookingService = inject(BookingService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  isLoading = signal(true);
  isSaving = signal(false);
  errorMessage = signal('');
  avatarPreview = signal<string | null>(null);
  avatarFile = signal<File | null>(null);
  coverPreview = signal<string | null>(null);
  coverFile = signal<File | null>(null);
  activeTab = signal<'stats' | 'edit' | 'business' | 'posts' | 'bookings' | 'messages' | 'account'>('stats');

  // Bookings signals
  bookings = signal<Booking[]>([]);
  isLoadingBookings = signal(false);

  // Inbox signals
  conversations = signal<Conversation[]>([]);
  activeConversationId = signal<string | null>(null);
  messages = signal<Message[]>([]);
  messageInput = new FormControl('');
  isLoadingMessages = signal(false);

  // Account Settings signals
  isSavingAccount = signal(false);
  accountSuccessMessage = signal('');
  accountErrorMessage = signal('');

  // Posts Feed Tab
  posts = signal<Post[]>([]);
  isLoadingPosts = signal(false);
  isLoadingMorePosts = signal(false);
  postsPage = 1;
  hasMorePosts = signal(true);
  newPostIds = new Set<string>();

  places = signal<Place[]>([]);
  trips = signal<Trip[]>([]);

  activeDropdownPostId = signal<string | null>(null);
  showEditPostModal = signal(false);
  selectedPostForEdit = signal<Post | null>(null);

  editPostContent = new FormControl('');
  editPostPlaceId = new FormControl('');
  editPostTripId = new FormControl('');

  user = this.authService.user;
  level = computed(() => this.user()?.userLevel ?? 1);
  xp = computed(() => this.user()?.experiencePoints ?? 0);
  currentLevelXp = computed(() => (this.level() - 1) * 100);
  nextLevelXp = computed(() => this.level() * 100);
  xpProgress = computed(() => {
    const current = this.currentLevelXp();
    const next = this.nextLevelXp();
    const xp = this.xp();
    const raw = ((xp - current) / (next - current)) * 100;
    if (!Number.isFinite(raw)) {
      return 0;
    }
    return Math.max(0, Math.min(100, raw));
  });

  form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    bio: [''],
  });

  accountForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    currentPassword: [''],
    newPassword: [''],
    confirmPassword: [''],
  });

  constructor() {
    this.authService
      .fetchProfile()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.isLoading.set(false),
        error: () => {
          this.isLoading.set(false);
          this.errorMessage.set('Không thể tải hồ sơ. Vui lòng thử lại.');
        },
      });

    this.authService.user$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user) => {
        if (!user) {
          return;
        }
        this.form.patchValue(
          {
            fullName: user.fullName,
            bio: user.bio ?? '',
          },
          { emitEvent: false },
        );
        if (!this.avatarPreview() && user.avatarUrl) {
          this.avatarPreview.set(user.avatarUrl);
        }
        if (!this.coverPreview() && user.coverUrl) {
          this.coverPreview.set(user.coverUrl);
        }
      });
  }

  onAvatarSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    this.avatarFile.set(file);
    this.avatarPreview.set(URL.createObjectURL(file));
  }

  onCoverSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    this.coverFile.set(file);
    this.coverPreview.set(URL.createObjectURL(file));
  }

  saveProfile() {
    if (this.form.invalid) {
      this.errorMessage.set('Vui lòng kiểm tra lại thông tin.');
      this.form.markAllAsTouched();
      return;
    }

    const { fullName, bio } = this.form.getRawValue();
    this.isSaving.set(true);
    this.errorMessage.set('');

    this.authService
      .updateProfile({
        fullName,
        bio,
        avatarFile: this.avatarFile(),
        coverFile: this.coverFile(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isSaving.set(false);
          this.avatarFile.set(null);
          this.coverFile.set(null);
        },
        error: () => {
          this.isSaving.set(false);
          this.errorMessage.set('Cập nhật thất bại. Vui lòng thử lại.');
        },
      });
  }

  ngOnInit() {
    this.socialSocket.connect();
    this.loadPlacesAndTrips();

    // Listen for tab parameters
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const tabParam = params['tab'];
      if (tabParam) {
        this.setTab(tabParam as any);
        const convId = params['conversationId'];
        if (tabParam === 'messages' && convId) {
          setTimeout(() => this.selectConversation(convId), 150);
        }
      }
    });

    const user = this.user();
    if (user) {
      this.chatService.connect(user.id);
      this.accountForm.patchValue({ email: user.email });
    }

    this.authService.user$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((u) => {
      if (u) {
        this.chatService.connect(u.id);
        this.accountForm.patchValue({ email: u.email });
      }
    });

    // Handle real-time incoming direct messages
    this.chatService.newMessage$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((msg) => {
      if (this.activeConversationId() === msg.conversationId) {
        this.messages.update((prev) => [...prev, msg]);
        setTimeout(() => this.scrollToBottom(), 50);
      }
      this.refreshConversationsList();
    });
  }

  ngOnDestroy() {
    this.socialSocket.disconnect();
    this.chatService.disconnect();
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

  setTab(tab: 'stats' | 'edit' | 'business' | 'posts' | 'bookings' | 'messages' | 'account') {
    this.activeTab.set(tab);
    if (tab === 'posts') {
      this.loadMyPosts();
    } else if (tab === 'bookings') {
      this.loadBookings();
    } else if (tab === 'messages') {
      this.loadConversations();
    }
  }

  // Bookings Tab actions
  loadBookings() {
    this.isLoadingBookings.set(true);
    this.bookingService.getMyBookings().subscribe({
      next: (res) => {
        this.bookings.set(res);
        this.isLoadingBookings.set(false);
      },
      error: () => this.isLoadingBookings.set(false),
    });
  }

  cancelUserBooking(bookingId: string) {
    if (confirm('Bạn có chắc chắn muốn hủy đặt chỗ này không?')) {
      this.bookingService.cancelBooking(bookingId).subscribe({
        next: (updatedBooking) => {
          this.bookings.update((prev) =>
            prev.map((b) => (b.id === bookingId ? { ...b, ...updatedBooking } : b))
          );
        },
        error: (err) => {
          alert(err?.error?.message || 'Không thể hủy đặt chỗ. Vui lòng thử lại sau.');
        },
      });
    }
  }

  // Inbox Tab actions
  loadConversations() {
    this.chatService.getConversations().subscribe({
      next: (res) => {
        this.conversations.set(res);
        // If not already set, auto select first conversation
        if (res.length > 0 && !this.activeConversationId()) {
          this.selectConversation(res[0].id);
        }
      },
    });
  }

  selectConversation(id: string) {
    this.activeConversationId.set(id);
    this.isLoadingMessages.set(true);
    this.chatService.getMessages(id).subscribe({
      next: (res) => {
        this.messages.set(res);
        this.isLoadingMessages.set(false);
        setTimeout(() => this.scrollToBottom(), 50);
      },
      error: () => this.isLoadingMessages.set(false),
    });
  }

  sendChatMessage() {
    const content = this.messageInput.value?.trim();
    const convId = this.activeConversationId();
    if (!content || !convId) return;

    this.chatService.sendMessage(convId, content).subscribe({
      next: (msg) => {
        this.messages.update((prev) => [...prev, msg]);
        this.messageInput.reset();
        this.refreshConversationsList();
        setTimeout(() => this.scrollToBottom(), 50);
      },
      error: () => {
        alert('Không thể gửi tin nhắn. Vui lòng thử lại.');
      },
    });
  }

  refreshConversationsList() {
    this.chatService.getConversations().subscribe({
      next: (res) => this.conversations.set(res),
    });
  }

  getChatPartner(conv: Conversation): Participant | null {
    const me = this.user();
    if (!me) return null;
    const partner = conv.participants.find((p) => p.userId !== me.id);
    return partner ? partner.user : null;
  }

  get activeChatPartner(): Participant | null {
    const activeId = this.activeConversationId();
    if (!activeId) return null;
    const conv = this.conversations().find((c) => c.id === activeId);
    return conv ? this.getChatPartner(conv) : null;
  }

  scrollToBottom() {
    if (typeof document !== 'undefined') {
      const container = document.getElementById('chat-messages-container');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }

  // Account settings tab actions
  saveAccountSettings() {
    if (this.accountForm.invalid) {
      this.accountForm.markAllAsTouched();
      return;
    }

    const val = this.accountForm.value;
    if (val.newPassword && val.newPassword !== val.confirmPassword) {
      this.accountErrorMessage.set('Mật khẩu mới và xác nhận mật khẩu không trùng khớp.');
      return;
    }

    this.isSavingAccount.set(true);
    this.accountSuccessMessage.set('');
    this.accountErrorMessage.set('');

    const dto = {
      email: val.email!,
      currentPassword: val.currentPassword || undefined,
      newPassword: val.newPassword || undefined,
    };

    this.authService.updateAccount(dto).subscribe({
      next: () => {
        this.isSavingAccount.set(false);
        this.accountSuccessMessage.set('Cập nhật tài khoản thành công!');
        this.accountForm.patchValue({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      },
      error: (err) => {
        this.isSavingAccount.set(false);
        this.accountErrorMessage.set(err?.error?.message || 'Cập nhật thông tin thất bại. Vui lòng thử lại.');
      },
    });
  }

  loadMyPosts() {
    const user = this.user();
    if (!user) return;
    this.isLoadingPosts.set(true);
    this.postsPage = 1;
    this.socialService.getFeed(1, 10, user.id).subscribe({
      next: (feed) => {
        this.posts.set(feed);
        this.isLoadingPosts.set(false);
        this.hasMorePosts.set(feed.length === 10);
      },
      error: () => this.isLoadingPosts.set(false),
    });
  }

  loadMoreMyPosts() {
    const user = this.user();
    if (!user || this.isLoadingMorePosts()) return;
    this.isLoadingMorePosts.set(true);
    this.postsPage++;
    this.socialService.getFeed(this.postsPage, 10, user.id).subscribe({
      next: (feed) => {
        this.isLoadingMorePosts.set(false);
        if (feed.length > 0) {
          this.posts.update((prev) => [...prev, ...feed]);
        }
        this.hasMorePosts.set(feed.length === 10);
      },
      error: () => this.isLoadingMorePosts.set(false),
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
