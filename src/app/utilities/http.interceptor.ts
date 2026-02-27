import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { UserDetailService } from '../auth/user-detail.service';
import { catchError } from 'rxjs/operators';
import { InsightsService } from '../utilities/insights.service';

@Injectable()
export class HttpAPIInterceptor implements HttpInterceptor {

  constructor(
    private userService: UserDetailService,
    private insightsService: InsightsService
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {

    if (request.url.endsWith('auth/login')) {
      return next.handle(request).pipe(
        catchError((err) => {
          this.insightsService.logException(err);
          return throwError(() => err);
        })
      );
    }

    let modifiedRequest = request;

    if (request.url.endsWith('.kml')) {
      modifiedRequest = request.clone({
        setHeaders: {
          Authorization: `${this.userService.getToken()}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      });
    } else if (!request.headers.has('Authorization')) {
      modifiedRequest = request.clone({
        setHeaders: { Authorization: `${this.userService.getToken()}` }
      });
    }

    return next.handle(modifiedRequest).pipe(
      catchError((err) => {
        this.insightsService.logException(err);
        return throwError(() => err);
      })
    );
  }
}