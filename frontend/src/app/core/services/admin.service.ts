import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AdminStats {
  totalUsers: number;
  totalPlaces: number;
  totalReviews: number;
  pendingClaims: number;
  estimatedRevenue: number;
}

export interface AdminPlace {
  id: string;
  name: string;
  description?: string;
  category: string;
  address: string;
  latitude: number;
  longitude: number;
  priceMin?: number | null;
  priceMax?: number | null;
  priceRange?: string | null;
  avgRating: number;
  amenities: string[];
  images: string[];
  isVerified: boolean;
  status: string;
  avatarUrl?: string | null;
}

export interface EditSuggestion {
  id: string;
  placeId: string;
  place: {
    id: string;
    name: string;
    address: string;
  };
  userId: string;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
  proposedData: any;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export interface ReportedReview {
  id: string;
  reviewId: string;
  review: {
    id: string;
    title: string;
    content: string;
    ratingOverall: number;
    createdAt: string;
    place: {
      id: string;
      name: string;
    };
    user: {
      id: string;
      fullName: string;
      avatarUrl?: string | null;
      status: string;
    };
  };
  reporterId: string;
  reporter: {
    id: string;
    fullName: string;
    email: string;
  };
  reason: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = 'http://localhost:3000/admin';

  getDashboardStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${this.apiBase}/dashboard/stats`);
  }

  // Places CRUD
  getPlaces(): Observable<AdminPlace[]> {
    return this.http.get<AdminPlace[]>(`${this.apiBase}/places`);
  }

  createPlace(data: Partial<AdminPlace>): Observable<AdminPlace> {
    return this.http.post<AdminPlace>(`${this.apiBase}/places`, data);
  }

  updatePlace(id: string, data: Partial<AdminPlace>): Observable<AdminPlace> {
    return this.http.put<AdminPlace>(`${this.apiBase}/places/${id}`, data);
  }

  deletePlace(id: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.apiBase}/places/${id}`);
  }

  // Edit suggestions
  getEditSuggestions(): Observable<EditSuggestion[]> {
    return this.http.get<EditSuggestion[]>(`${this.apiBase}/edit-suggestions`);
  }

  approveEditSuggestion(id: string): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/edit-suggestions/${id}/approve`, {});
  }

  rejectEditSuggestion(id: string): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/edit-suggestions/${id}/reject`, {});
  }

  // Moderation
  getReportedReviews(): Observable<ReportedReview[]> {
    return this.http.get<ReportedReview[]>(`${this.apiBase}/moderation/reported-reviews`);
  }

  keepReportedReview(reviewId: string): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/moderation/reviews/${reviewId}/keep`, {});
  }

  hideReportedReview(reviewId: string): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/moderation/reviews/${reviewId}/hide`, {});
  }

  banUser(userId: string): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/moderation/users/${userId}/ban`, {});
  }

  // ======================= QUẢN LÝ NGƯỜI DÙNG & VI PHẠM =======================

  getAllUsers(page = 1, limit = 20, search = '', status = ''): Observable<any> {
    let url = `${this.apiBase}/users?page=${page}&limit=${limit}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (status) url += `&status=${status}`;
    return this.http.get<any>(url);
  }

  getUserDetail(userId: string): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/users/${userId}`);
  }

  sendWarning(userId: string, message: string, severity: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW'): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/users/${userId}/warning`, { message, severity });
  }

  unbanUser(userId: string): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/users/${userId}/unban`, {});
  }

  deleteUser(userId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiBase}/users/${userId}`);
  }

  getViolationNotifications(): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/moderation/violations`);
  }

  deleteViolatingPost(postId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiBase}/moderation/posts/${postId}`);
  }

  deleteViolatingComment(commentId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiBase}/moderation/comments/${commentId}`);
  }
}
