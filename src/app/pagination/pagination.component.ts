import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.css']
})
export class PaginationComponent implements OnInit {

  numberOfPages:any[] = [];
  recordsPerPageList: any[] = [5,10,25,50,100];
  @Input() currentpage = 1;
  @Input() recordsPerPage = 100;
  @Input() toalRecord: any;
  @Input() currentRocords: any;
  @Output() pageTrigger: EventEmitter<any> = new EventEmitter<any>();
  @Input() loading = 0;
  isFirstButton = false;
  isPreviousButton = false;
  isNextButton = false;
  isLastButton = false;
  constructor() {}

  ngOnInit(): void {
  }


  triggerPagination() {
   const event =  {page_no: this.currentpage, records_per_page: this.recordsPerPage};
   this.pageTrigger.emit(event);
  }

  updatePagination() {
    this.numberOfPages = Array.from(Array(Math.ceil(this.toalRecord / this.recordsPerPage) || 1).keys()).map(d => d+1);
    this.isFirstButton = this.currentpage == 1;
    this.isPreviousButton = this.currentpage == 1;
    this.isNextButton = this.currentpage == this.numberOfPages?.length;
    this.isLastButton = this.currentpage == this.numberOfPages?.length;
  }

  onFirstClick() {
    this.currentpage = 1;
    this.triggerPagination();
  }

  onPreviousClick() {
    this.currentpage--;
    this.triggerPagination();
  }

  onNextClick() {
    this.currentpage++;
    this.triggerPagination();
  }

  onLastClick() {
    this.currentpage = this.numberOfPages.length;
    this.triggerPagination();
  }

  onPageChange() {
    this.triggerPagination();
  }

  onPerRecordChange() {
    this.currentpage = 1;
    this.triggerPagination();
  }

}
