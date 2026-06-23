import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { TripService, TripSocketService, Trip, TripItem, TripCollaborator } from '../../../core/services/trip.service';
import { WishlistService } from '../../../core/services/wishlist.service';
import { AuthService } from '../../../core/services/auth.service';
import { SearchService, Place } from '../../../core/services/search.service';
import { TripRouteMapComponent } from '../trip-route-map/trip-route-map.component';
import { Subscription, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-trip-planner',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DragDropModule, RouterLink, TripRouteMapComponent],
  templateUrl: './trip-planner.component.html',
  styleUrl: './trip-planner.component.scss',
})
export class TripPlannerComponent implements OnInit, OnDestroy {
  private readonly tripService = inject(TripService);
  private readonly tripSocket = inject(TripSocketService);
  private readonly wishlistService = inject(WishlistService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly searchService = inject(SearchService);
 
  searchInput = new FormControl('');
  searchResults = signal<Place[]>([]);

  tripId = '';
  trip = signal<Trip | null>(null);
  wishlist = signal<Place[]>([]);
  days = signal<number[]>([]);
  dayItems = signal<{ [day: number]: TripItem[] }>({});
  activeDay = signal<number>(1);
  isLoading = signal(true);
  isSaving = signal(false);

  // Collaborator management
  collaborators = signal<TripCollaborator[]>([]);
  collabForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    role: ['EDITOR' as 'VIEWER' | 'EDITOR', Validators.required],
  });
  collabError = signal('');
  collabSuccess = signal('');

  // WebSocket / Real-time Collaboration States
  toastMessage = signal<string>('');
  currentUser = this.authService.user;
  draggingCollaborators = signal<{ [itemId: string]: { userId: string; userName: string; userAvatar?: string } }>({});

  private subs: Subscription[] = [];

  ngOnInit() {
    this.route.params.subscribe((params) => {
      this.tripId = params['id'];
      if (this.tripId) {
        this.loadTripDetail();
        this.loadWishlist();
        this.initSocketConnection();
      }
    });

    this.subs.push(
      this.searchInput.valueChanges.pipe(
        debounceTime(300),
        distinctUntilChanged()
      ).subscribe((q) => {
        if (!q || q.trim().length < 2) {
          this.searchResults.set([]);
          return;
        }
        this.searchService.autocomplete(q.trim()).subscribe({
          next: (res) => {
            const wishlistIds = new Set(this.wishlist().map(p => p.id));
            const filtered = res.filter(p => !wishlistIds.has(p.id));
            this.searchResults.set(filtered);
          },
          error: () => this.searchResults.set([])
        });
      })
    );
  }

  ngOnDestroy() {
    this.tripSocket.leaveTrip(this.tripId);
    this.tripSocket.disconnect();
    this.subs.forEach(s => s.unsubscribe());
  }

  loadTripDetail(isUpdateSync = false) {
    if (!isUpdateSync) this.isLoading.set(true);
    this.tripService.getTripDetail(this.tripId).subscribe({
      next: (data) => {
        this.trip.set(data);
        this.collaborators.set(data.collaborators);
        
        // Calculate days array
        const start = new Date(data.startDate);
        const end = new Date(data.endDate);
        const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        this.days.set(Array.from({ length: diffDays }, (_, i) => i + 1));

        // Group items by day
        const grouped: { [day: number]: TripItem[] } = {};
        this.days().forEach(d => {
          grouped[d] = data.items.filter(item => item.dayNumber === d);
        });
        this.dayItems.set(grouped);
        
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  loadWishlist() {
    this.wishlistService.getWishlist().subscribe({
      next: (list) => this.wishlist.set(list),
    });
  }

  initSocketConnection() {
    const user = this.currentUser();
    if (!user) return;

    this.tripSocket.connect();
    this.tripSocket.joinTrip(this.tripId, {
      id: user.id,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl || undefined,
    });

    // 1. Listen for general edits
    this.subs.push(
      this.tripSocket.itineraryEditing$.subscribe((data) => {
        this.showToast(`${data.userName} đang chỉnh sửa lịch trình...`);
      })
    );

    // 2. Listen for layout updates
    this.subs.push(
      this.tripSocket.itineraryUpdated$.subscribe(() => {
        this.showToast(`Lịch trình vừa được cập nhật bởi cộng tác viên!`);
        this.loadTripDetail(true);
      })
    );

    // 3. Listen for card dragging
    this.subs.push(
      this.tripSocket.cardDragging$.subscribe((data) => {
        this.draggingCollaborators.update(prev => ({
          ...prev,
          [data.itemId]: {
            userId: data.userId,
            userName: data.userName,
            userAvatar: data.userAvatar
          }
        }));
      })
    );

    // 4. Listen for card dropping
    this.subs.push(
      this.tripSocket.cardDropped$.subscribe((data) => {
        this.draggingCollaborators.update(prev => {
          const next = { ...prev };
          delete next[data.itemId];
          return next;
        });
      })
    );
  }

  private showToast(msg: string) {
    this.toastMessage.set(msg);
    setTimeout(() => {
      if (this.toastMessage() === msg) {
        this.toastMessage.set('');
      }
    }, 4000);
  }

  // IDs connected lists for cdkDrop
  get dropListIds() {
    return ['wishlist-list', ...this.days().map(d => 'day-list-' + d)];
  }

  onDragStarted(itemId: string) {
    const user = this.currentUser();
    if (!user) return;
    this.tripSocket.sendDraggingCard(this.tripId, itemId, user.id, user.fullName, user.avatarUrl || undefined);
    this.tripSocket.sendEditItinerary(this.tripId, user.fullName, user.avatarUrl || undefined);
  }

  drop(event: CdkDragDrop<any[]>, targetDay?: number) {
    const user = this.currentUser();
    const isSourceWishlist = event.previousContainer.id === 'wishlist-list';
    
    // Clear dragging state
    if (!isSourceWishlist && event.item.data?.id) {
      this.tripSocket.sendDroppedCard(this.tripId, event.item.data.id, user?.id || '');
    }

    // 1. Reordering in the same column
    if (event.previousContainer === event.container) {
      if (isSourceWishlist) return; // wishlist items don't reorder database-side like this
      
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      this.saveReorderedItems(targetDay!);
      return;
    }

    // 2. Dragging from Wishlist to Day List
    if (isSourceWishlist) {
      const place = event.previousContainer.data[event.previousIndex] as Place;
      
      // Call service to add to DB
      this.isSaving.set(true);
      this.tripService.addTripItem(this.tripId, {
        placeId: place.id,
        dayNumber: targetDay!,
        sequenceOrder: event.currentIndex,
      }).subscribe({
        next: (newItem) => {
          // Insert in local list
          const currentList = [...event.container.data];
          currentList.splice(event.currentIndex, 0, newItem);
          this.dayItems.update(prev => ({
            ...prev,
            [targetDay!]: currentList
          }));
          this.isSaving.set(false);
          this.saveReorderedItems(targetDay!); // save all items in column to update sequenceOrder
        },
        error: () => this.isSaving.set(false)
      });
      return;
    }

    // 3. Dragging from Day A to Day B
    const previousDay = Number(event.previousContainer.id.split('-').pop());
    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex
    );

    this.isSaving.set(true);
    // Trigger update on both days
    this.prismaReorderBothDays(previousDay, targetDay!);
  }

  private prismaReorderBothDays(dayA: number, dayB: number) {
    const listA = this.dayItems()[dayA].map((item, idx) => ({
      id: item.id,
      dayNumber: dayA,
      sequenceOrder: idx
    }));

    const listB = this.dayItems()[dayB].map((item, idx) => ({
      id: item.id,
      dayNumber: dayB,
      sequenceOrder: idx
    }));

    this.tripService.reorderTripItems(this.tripId, {
      items: [...listA, ...listB]
    }).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.tripSocket.sendUpdateItinerary(this.tripId);
      },
      error: () => this.isSaving.set(false)
    });
  }

  private saveReorderedItems(day: number) {
    const list = this.dayItems()[day].map((item, idx) => ({
      id: item.id,
      dayNumber: day,
      sequenceOrder: idx
    }));

    this.isSaving.set(true);
    this.tripService.reorderTripItems(this.tripId, { items: list }).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.tripSocket.sendUpdateItinerary(this.tripId);
      },
      error: () => this.isSaving.set(false)
    });
  }

  deleteItem(itemId: string, day: number) {
    if (confirm('Bạn có muốn xóa địa điểm này khỏi lịch trình không?')) {
      this.tripService.deleteTripItem(this.tripId, itemId).subscribe({
        next: () => {
          this.dayItems.update(prev => ({
            ...prev,
            [day]: prev[day].filter(item => item.id !== itemId)
          }));
          this.saveReorderedItems(day);
        }
      });
    }
  }

  addCollaborator() {
    if (this.collabForm.invalid) return;
    this.collabError.set('');
    this.collabSuccess.set('');

    const email = this.collabForm.value.email || '';
    const role = this.collabForm.value.role || 'EDITOR';

    this.tripService.addCollaborator(this.tripId, { email, role }).subscribe({
      next: (newCollab) => {
        this.collaborators.update(prev => [...prev, newCollab]);
        this.collabForm.reset({ email: '', role: 'EDITOR' });
        this.collabSuccess.set('Đã thêm cộng tác viên thành công!');
      },
      error: (err) => {
        this.collabError.set(err?.error?.message || 'Có lỗi xảy ra khi thêm cộng tác viên.');
      }
    });
  }

  removeCollaborator(userId: string) {
    if (confirm('Bạn có muốn xóa cộng tác viên này không?')) {
      this.tripService.removeCollaborator(this.tripId, userId).subscribe({
        next: () => {
          this.collaborators.update(prev => prev.filter(c => c.userId !== userId));
        }
      });
    }
  }

  deleteTrip() {
    if (!this.trip()) return;
    if (confirm('Bạn có chắc chắn muốn xóa chuyến đi này không? Mọi lịch trình sẽ bị xóa vĩnh viễn.')) {
      this.tripService.deleteTrip(this.tripId).subscribe({
        next: () => {
          this.router.navigate(['/trips']);
        },
        error: (err) => {
          alert(err?.error?.message || 'Có lỗi xảy ra khi xóa chuyến đi.');
        }
      });
    }
  }

  addPlaceToWishlist(place: Place) {
    this.wishlistService.addToWishlist(place.id).subscribe({
      next: (res) => {
        if (res.success) {
          // Immediately update signal to render card
          this.wishlist.update((prev) => [...prev, place]);
          this.searchInput.setValue('');
          this.searchResults.set([]);
        }
      },
      error: (err) => {
        alert(err?.error?.message || 'Có lỗi xảy ra khi thêm địa điểm.');
      }
    });
  }

  focusPlace(place: any, routeMap: any) {
    const lat = place.latitude ?? place.location?.lat;
    const lon = place.longitude ?? place.location?.lon;
    if (lat !== undefined && lon !== undefined && routeMap) {
      routeMap.focusOnLocation(lat, lon);
    }
  }
}
