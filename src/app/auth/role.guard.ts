import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { UserDetailService } from './user-detail.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(private userService: UserDetailService, private router: Router) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {
    try {
      const userDetail = this.userService.getUserDetail();

      // If userDetail is empty or lacks user_id, redirect to login
      if (!userDetail || !userDetail.user_id) {
        if (state.url === '/login') {
          return true;
        }
        return this.router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
      }

      const authRoles = next.data.authRole;
      const authAgencyScreen = next.data.authAgencyScreen;
      const userScreen = userDetail?.screens || {};
      const authClient = next.data.authClient;
      const client_id = userDetail?.unit_id;
      const screens = Object.keys(userScreen).filter((screen: any) => !['added_by', 'status'].includes(screen) && userScreen[screen] == 1);

      if (
        (authRoles && !authRoles.includes(userDetail?.user_role)) ||
        (screens?.length && authAgencyScreen && !screens.includes(authAgencyScreen)) ||
        (authClient?.length && !authClient.includes(client_id))
      ) {
        return this.router.createUrlTree(['/']);
      }

      return true;
    } catch (error) {
      return this.router.createUrlTree(['/login']);
    }
  }
}