import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BookingService, PartnerPrice } from '../../../core/services/booking.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-price-comparison',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './price-comparison.component.html',
  styleUrl: './price-comparison.component.scss',
})
export class PriceComparisonComponent implements OnInit {
  private readonly bookingService = inject(BookingService);
  private readonly authService = inject(AuthService);

  @Input({ required: true }) placeId!: string;

  prices = signal<PartnerPrice[]>([]);
  isLoading = signal(true);
  errorMessage = signal('');

  // Secure Redirect Modal States
  showRedirectModal = signal(false);
  redirectingPartner = signal<string>('');
  redirectUrl = '';

  currentUser = this.authService.user;

  ngOnInit() {
    if (this.placeId) {
      this.loadPrices();
    }
  }

  loadPrices() {
    this.isLoading.set(true);
    this.bookingService.getPrices(this.placeId).subscribe({
      next: (data) => {
        this.prices.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('Không thể tải thông tin so sánh giá.');
      },
    });
  }

  handleRedirect(partner: PartnerPrice) {
    const userId = this.currentUser()?.id;
    this.redirectUrl = this.bookingService.getRedirectUrl(this.placeId, partner.partnerName, userId);
    
    let partnerDisplayName: string = partner.partnerName;
    if (partner.partnerName === 'BOOKING_COM') {
      partnerDisplayName = 'Booking.com';
    } else if (partner.partnerName === 'AGODA') {
      partnerDisplayName = 'Agoda';
    } else if (partner.partnerName === 'EXPEDIA') {
      partnerDisplayName = 'Expedia';
    }

    this.redirectingPartner.set(partnerDisplayName);
    
    // Show secure redirect modal with waves
    this.showRedirectModal.set(true);

    // Wait 1.5 seconds, then open redirect in new tab and hide modal
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.open(this.redirectUrl, '_blank');
      }
      this.showRedirectModal.set(false);
    }, 1500);
  }

  formatPrice(val: number): string {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  }
}
