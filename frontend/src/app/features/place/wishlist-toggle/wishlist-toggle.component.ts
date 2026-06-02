import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WishlistService } from '../../../core/services/wishlist.service';
import { AuthService } from '../../../core/services/auth.service';

interface Particle {
  id: number;
  angle: number;
  color: string;
}

@Component({
  selector: 'app-wishlist-toggle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './wishlist-toggle.component.html',
  styleUrl: './wishlist-toggle.component.scss',
})
export class WishlistToggleComponent implements OnInit {
  private readonly wishlistService = inject(WishlistService);
  private readonly authService = inject(AuthService);

  @Input({ required: true }) placeId!: string;

  isSaved = signal(false);
  particles = signal<Particle[]>([]);
  isAuthenticated = this.authService.isAuthenticated;

  ngOnInit() {
    if (this.isAuthenticated()) {
      this.wishlistService.getWishlistStatus(this.placeId).subscribe({
        next: (res) => this.isSaved.set(res.saved),
      });
    }
  }

  toggleSaved(event: Event) {
    event.stopPropagation();
    if (!this.isAuthenticated()) {
      alert('Vui lòng đăng nhập để lưu địa điểm vào danh sách yêu thích.');
      return;
    }

    if (this.isSaved()) {
      this.wishlistService.removeFromWishlist(this.placeId).subscribe({
        next: () => this.isSaved.set(false),
      });
    } else {
      this.wishlistService.addToWishlist(this.placeId).subscribe({
        next: () => {
          this.isSaved.set(true);
          this.triggerExplosion();
        },
      });
    }
  }

  private triggerExplosion() {
    const colors = ['#f43f5e', '#ec4899', '#f472b6', '#fb7185', '#fda4af'];
    const newParticles = Array.from({ length: 12 }, (_, i) => ({
      id: Date.now() + i,
      angle: i * 30 + (Math.random() * 15 - 7.5),
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    this.particles.set(newParticles);
    
    setTimeout(() => {
      this.particles.set([]);
    }, 800);
  }
}
