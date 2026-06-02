import { Component, Input, OnInit, inject, DestroyRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SocialService, Post, PostComment } from '../../../core/services/social.service';
import { SocialSocketService } from '../../../core/services/social-socket.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-like-comment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './like-comment.component.html',
  styleUrl: './like-comment.component.scss',
})
export class LikeCommentComponent implements OnInit {
  private readonly socialService = inject(SocialService);
  private readonly socialSocket = inject(SocialSocketService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  @Input({ required: true }) post!: Post;

  currentUser = this.authService.user;
  showComments = signal(false);
  isSubmittingComment = signal(false);

  commentForm = this.fb.group({
    content: ['', Validators.required],
  });

  // Unique list of newly added comments to apply slide-in animation locally
  newCommentIds = new Set<string>();

  ngOnInit() {
    // Ensure socket connection is active
    this.socialSocket.connect();

    // 1. Listen for real-time Likes
    this.socialSocket.postLiked$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        if (event.postId === this.post.id) {
          // Animate like count increment/decrement
          this.animateLikeCount(event.likeCount);

          if (event.userId === this.currentUser()?.id) {
            this.post.likedByCurrentUser = event.isLike;
          }
        }
      });

    // 2. Listen for real-time Comments
    this.socialSocket.postCommented$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        if (event.postId === this.post.id) {
          // Avoid duplicate comments if we were the creator of this comment
          const exists = this.post.comments.some((c) => c.id === event.comment.id);
          if (!exists) {
            this.newCommentIds.add(event.comment.id);
            this.post.comments.push(event.comment);
            this.post.commentsCount = this.post.comments.length;
          }
        }
      });
  }

  toggleLike() {
    this.socialService.toggleLike(this.post.id).subscribe({
      next: (res) => {
        this.post.likedByCurrentUser = res.isLike;
        this.post.likesCount = res.likeCount;
      },
    });
  }

  // Animation for likes count bouncing
  likeCountAnimating = false;
  private animateLikeCount(newCount: number) {
    this.likeCountAnimating = true;
    this.post.likesCount = newCount;
    setTimeout(() => {
      this.likeCountAnimating = false;
    }, 300);
  }

  toggleCommentsSection() {
    this.showComments.update((show) => !show);
  }

  submitComment() {
    if (this.commentForm.invalid) return;

    const content = this.commentForm.value.content!.trim();
    if (!content) return;

    this.isSubmittingComment.set(true);
    this.socialService.addComment(this.post.id, content).subscribe({
      next: (comment) => {
        this.isSubmittingComment.set(false);
        this.commentForm.reset();

        // Push comment locally if WebSocket event didn't trigger it yet
        const exists = this.post.comments.some((c) => c.id === comment.id);
        if (!exists) {
          this.newCommentIds.add(comment.id);
          this.post.comments.push(comment);
          this.post.commentsCount = this.post.comments.length;
        }
      },
      error: () => this.isSubmittingComment.set(false),
    });
  }
}
