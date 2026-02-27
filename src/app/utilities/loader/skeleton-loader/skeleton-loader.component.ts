import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-skeleton-loader',
  templateUrl: './skeleton-loader.component.html',
  styleUrls: ['./skeleton-loader.component.css']
})
export class SkeletonLoaderComponent implements OnInit {

  @Input() show: any = false;
  @Input() height: any = '50px';
  @Input() margin: any = '10px 0px';
  @Input() padding: any = '10px 0px';
  @Input() count: number = 1;
  loaders: any[] = [];

  constructor() {
   }

  ngOnInit(): void {
    const loaders = Array.from(Array(this.count)).map((d,i) => {
      const result: any = {}
      result.margin = this.margin;
      if (i == 0 || (i+1) == this.count){
        result.margin = '10px 0px';
      }
      return result;
    });
    this.loaders = loaders
  }

}
