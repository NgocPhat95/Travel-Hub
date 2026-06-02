import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ReviewMedia {
  id: string;
  reviewId: string;
  url: string;
  type: 'IMAGE' | 'VIDEO';
  createdAt: string;
}

export interface Review {
  id: string;
  placeId: string;
  userId: string;
  ratingOverall: number;
  ratingCleanliness: number;
  ratingService: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  media: ReviewMedia[];
  user: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
    userLevel: number;
  };
  likesCount: number;
  isLiked: boolean;
}

export interface ReviewStats {
  totalCount: number;
  avgOverall: number;
  avgCleanliness: number;
  avgService: number;
  distribution: {
    [star: number]: {
      count: number;
      percentage: number;
    };
  };
}

@Injectable({
  providedIn: 'root',
})
export class ReviewService {
  private readonly http = inject(HttpClient);
  private readonly reviewBase = 'http://localhost:3000/reviews';

  createReview(placeId: string, formData: FormData): Observable<Review> {
    return this.http.post<Review>(`${this.reviewBase}/places/${placeId}`, formData);
  }

  getReviews(
    placeId: string,
    filters: { limit?: number; offset?: number; rating?: number }
  ): Observable<{ reviews: Review[]; total: number; limit: number; offset: number }> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<{ reviews: Review[]; total: number; limit: number; offset: number }>(
      `${this.reviewBase}/places/${placeId}`,
      { params }
    );
  }

  getReviewStats(placeId: string): Observable<ReviewStats> {
    return this.http.get<ReviewStats>(`${this.reviewBase}/places/${placeId}/stats`);
  }

  likeReview(reviewId: string): Observable<{ liked: boolean; likesCount: number }> {
    return this.http.post<{ liked: boolean; likesCount: number }>(
      `${this.reviewBase}/${reviewId}/like`,
      {}
    );
  }

  unlikeReview(reviewId: string): Observable<{ liked: boolean; likesCount: number }> {
    return this.http.delete<{ liked: boolean; likesCount: number }>(
      `${this.reviewBase}/${reviewId}/like`
    );
  }
}
