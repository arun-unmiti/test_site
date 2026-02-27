import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { UserDetailService } from './user-detail.service';

@Injectable({
  providedIn: 'root'
})
export class RouteGuard implements CanActivate {
  private isNavigating = false;

  constructor(private userService: UserDetailService, private router: Router) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {
    if (this.isNavigating) {
      return false;
    }

    this.isNavigating = true;
    try {
      const userDetail = this.userService.getUserDetail();
      // Normalize URL by removing query parameters for comparison
      const normalizedUrl = state.url.split('?')[0];

      if (normalizedUrl === '/login') {
        if (!userDetail || !userDetail.user_id) {
          return true;
        }
        return this.router.createUrlTree(['/']);
      }

      // Allow other public routes
      if (['/forgot-password', '/privacy_policy'].includes(normalizedUrl)) {
        return true;
      }

      // Redirect if no user
      if (!userDetail || !userDetail.user_id) {
        return this.router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
      }

      return true;
    } catch (error) {
      return this.router.createUrlTree(['/login']);
    } finally {
      this.isNavigating = false;
    }
  }
}