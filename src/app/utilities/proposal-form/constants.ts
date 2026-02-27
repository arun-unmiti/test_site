import * as moment from 'moment';

export const FILE_HEADERS = [
  { field: 'season', header: 'Season', requried: true, type: 'number', is_lkp: true },
  { field: 'financial_year', header: 'Financial Year', requried: true, type: 'number', is_lkp: true },
  { field: 'product_name', header: 'Product Name', requried: true, type: 'text' },
  { field: 'state', header: 'State', requried: true, type: 'text' },
  { field: 'district', header: 'District', requried: true, type: 'text' },
  { field: 'block', header: 'Block/Taluka', requried: true, type: 'text' },
  { field: 'location', header: 'Location', requried: true, type: 'text' },
  { field: 'pincode', header: 'Pincode', type: 'number', requried: true },
  { field: 'crop', header: 'Crop', requried: true, type: 'number', is_lkp: true },
  { field: 'area_insured', header: 'Area Insured (In Hec)', requried: true, type: 'number' },
  { field: 'premium_unit', header: 'Premium Unit', requried: true, type: 'number' },
  { field: 'sum_insured_unit', header: 'Sum Insured Unit', requried: true, type: 'number' },
  { field: 'risk_start_date', header: 'Risk Start Date', requried: true, type: 'date' },
  { field: 'risk_end_date', header: 'Risk End Date', requried: true, type: 'date' },
];

export const DATE_RANGES = {
  Today: [moment(), moment()],
  Yesterday: [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
  'Last 7 Days': [moment().subtract(6, 'days'), moment()],
  'Last 30 Days': [moment().subtract(29, 'days'), moment()],
  'This Month': [moment().startOf('month'), moment().endOf('month')],
  'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')],
  'Last 3 Month': [moment().subtract(3, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')],
};

export const LOCALE_VALUE = {
  format: 'DD/MM/YYYY',
  displayFormat: 'DD-MM-YYYY',
  separator: ' - ',
  cancelLabel: 'Cancel',
  applyLabel: 'Okay',
};

export const BUTTONS_TYPE = ['file', 'kml', 'viewbutton', 'signature', 'approveBox'];