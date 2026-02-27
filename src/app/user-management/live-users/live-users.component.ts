import { Component, OnInit } from '@angular/core';
import { UserDetailService } from 'src/app/auth/user-detail.service';

@Component({
  selector: 'app-live-users',
  templateUrl: './live-users.component.html',
  styleUrls: ['./live-users.component.css']
})
export class LiveUsersComponent implements OnInit {

  loader = 0;
  user: any;



  constructor(private currentUser: UserDetailService) { }

  ngOnInit(): void {
    this.user = this.currentUser.getUserDetail();
  }

}
