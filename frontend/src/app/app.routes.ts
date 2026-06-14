import { Routes } from '@angular/router';
import { ProfileComponent } from './features/profile/profile/profile.component';
import { ResetPasswordComponent } from './features/auth/reset-password/reset-password.component';
import { PublicProfileComponent } from './features/profile/public-profile/public-profile.component';
import { MapSearchComponent } from './features/search/map-search/map-search.component';
import { ListingsComponent } from './features/place/listings/listings.component';
import { PlaceDetailComponent } from './features/place/place-detail/place-detail.component';
import { TripPlannerComponent } from './features/trip/trip-planner/trip-planner.component';
import { TripListComponent } from './features/trip/trip-list/trip-list.component';
import { AdminDashboardComponent } from './features/admin/admin-dashboard/admin-dashboard.component';
import { NewsFeedComponent } from './features/social/news-feed/news-feed.component';
import { HomeComponent } from './features/home/home.component';
import { AiPlannerComponent } from './features/ai-assistant/ai-planner/ai-planner.component';
import { TravelersChoiceComponent } from './features/explore/travelers-choice/travelers-choice.component';
import { TravelGuidesComponent } from './features/explore/travel-guides/travel-guides.component';
import { TravelGuideDetailComponent } from './features/explore/travel-guide-detail/travel-guide-detail.component';
import { TicketsToursComponent } from './features/tickets-tours/tickets-tours.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: 'profile', component: ProfileComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'public-profile/:id', component: PublicProfileComponent },
  { path: 'map-search', component: MapSearchComponent },
  { path: 'places', redirectTo: 'travelers-choice' },
  { path: 'place/:id', component: PlaceDetailComponent },
  { path: 'trip/:id', component: TripPlannerComponent },
  { path: 'trips', component: TripListComponent, canActivate: [authGuard] },
  { path: 'admin', component: AdminDashboardComponent, canActivate: [authGuard, roleGuard] },
  { path: 'feed', component: NewsFeedComponent, canActivate: [authGuard] },
  { path: 'ai-planner', component: AiPlannerComponent, canActivate: [authGuard] },
  // Explore features
  { path: 'travelers-choice', component: TravelersChoiceComponent },
  { path: 'travel-guides', component: TravelGuidesComponent },
  { path: 'travel-guides/:slug', component: TravelGuideDetailComponent },
  // Tickets & Tours
  { path: 'tickets-tours', component: TicketsToursComponent },
  { path: '', component: HomeComponent, pathMatch: 'full' },
];
