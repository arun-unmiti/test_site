import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { FeatureToggleService } from '../shared/services/feature-toggle.service';

@Injectable({
  providedIn: 'root'
})
export class ModuleGuard implements CanActivate, CanActivateChild {
  constructor(private featureToggle: FeatureToggleService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {
    const module = route.data.module;
    if (module && !this.featureToggle.isModuleEnabled(module)) {
      return this.router.createUrlTree(['/home']);
    }
    return true;
  }

  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {
    return this.canActivate(childRoute, state);
  }
}