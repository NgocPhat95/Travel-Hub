import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService, PublicProfile } from '../../../core/services/auth.service';

@Component({
  selector: 'app-public-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './public-profile.component.html',
  styleUrl: './public-profile.component.scss'
})
export class PublicProfileComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);

  profile = signal<PublicProfile | null>(null);
  isLoading = signal(true);
  errorMessage = signal('');

  level = computed(() => this.profile()?.userLevel ?? 1);
  xp = computed(() => this.profile()?.experiencePoints ?? 0);
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

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.loadProfile(id);
      } else {
        this.isLoading.set(false);
        this.errorMessage.set('Không tìm thấy ID người dùng.');
      }
    });
  }

  loadProfile(userId: string) {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.getPublicProfile(userId).subscribe({
      next: (data) => {
        this.profile.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('Không thể tải thông tin hồ sơ của người dùng này.');
      }
    });
  }
}
