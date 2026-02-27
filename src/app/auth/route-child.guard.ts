import { Injectable } from '@angular/core';
import { CanActivateChild, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { UserDetailService } from './user-detail.service';

@Injectable({
  providedIn: 'root'
})
export class RouteChildGuard implements CanActivateChild {
  private isNavigating = false;

  constructor(private userService: UserDetailService, private router: Router) {}

  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {
    if (this.isNavigating) {
      return false;
    }

    this.isNavigating = true;
    try {
      const userDetail = this.userService.getUserDetail();
      const normalizedUrl = state.url.split('?')[0];

      if (normalizedUrl === '/login') {
        if (!userDetail || !userDetail.user_id) {
          return true;
        }
        return this.router.createUrlTree(['/']);
      }

      if (['/forgot-password', '/privacy_policy'].includes(normalizedUrl)) {
        return true;
      }

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