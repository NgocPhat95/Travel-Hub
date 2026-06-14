import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Post {
  id: string;
  userId: string;
  user: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
    email?: string | null;
  };
  content: string;
  placeId?: string | null;
  place?: {
    id: string;
    name: string;
    address: string;
    category?: string | null;
    images?: string[] | null;
    ratingAverage?: number | null;
  } | null;
  tripId?: string | null;
  trip?: {
    id: string;
    title: string;
    description?: string | null;
    startDate: string;
    endDate: string;
  } | null;
  createdAt: string;
  images: { id: string; url: string }[];
  likes: { id: string; userId: string; postId: string }[];
  comments: PostComment[];
  likedByCurrentUser: boolean;
  likesCount: number;
  commentsCount: number;
}

export interface PostComment {
  id: string;
  postId: string;
  userId: string;
  user: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
  };
  content: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class SocialService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = 'http://localhost:3000/social';

  getFeed(page = 1, limit = 10, userId?: string): Observable<Post[]> {
    let params = new HttpParams();
    params = params.set('page', page.toString());
    params = params.set('limit', limit.toString());
    if (userId) {
      params = params.set('userId', userId);
    }

    return this.http.get<Post[]>(`${this.apiBase}/feed`, { params });
  }

  createPost(dto: {
    content: string;
    placeId?: string;
    tripId?: string;
    images?: File[];
  }): Observable<Post> {
    const formData = new FormData();
    formData.append('content', dto.content);
    if (dto.placeId) formData.append('placeId', dto.placeId);
    if (dto.tripId) formData.append('tripId', dto.tripId);
    
    if (dto.images && dto.images.length > 0) {
      dto.images.forEach((img) => {
        formData.append('images', img);
      });
    }

    return this.http.post<Post>(`${this.apiBase}/posts`, formData);
  }

  toggleLike(postId: string): Observable<{ success: boolean; isLike: boolean; likeCount: number }> {
    return this.http.post<{ success: boolean; isLike: boolean; likeCount: number }>(
      `${this.apiBase}/posts/${postId}/like`,
      {}
    );
  }

  addComment(postId: string, content: string): Observable<PostComment> {
    return this.http.post<PostComment>(`${this.apiBase}/posts/${postId}/comments`, { content });
  }

  deletePost(postId: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.apiBase}/posts/${postId}`);
  }

  updatePost(postId: string, dto: { content: string; placeId?: string; tripId?: string }): Observable<Post> {
    return this.http.put<Post>(`${this.apiBase}/posts/${postId}`, dto);
  }
}
