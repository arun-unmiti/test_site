import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CoreService } from '../../utilities/core.service';
import { ImageCroppedEvent } from 'ngx-image-cropper';
import { NgxImageCompressService } from 'ngx-image-compress';
import { UserDetailService } from 'src/app/auth/user-detail.service';
import { FeatureToggleService } from "../../shared/services/feature-toggle.service";
import { environment, ProjectContext } from "../../../environments/environment";
import { InsightsService } from '../../utilities/insights.service';

@Component({
  selector: 'app-add-client',
  templateUrl: './add-client.component.html',
  styleUrls: ['./add-client.component.css']
})
export class AddClientComponent implements OnInit {

  submitted = false;

  regForm: any;

  uploadForm = new FormGroup({
    file: new FormControl('', [Validators.required]),
    imgSrc: new FormControl('', [Validators.required])
  });

  imgFile: any;

  imageChangedEvent: any = '';
  croppedImage: any = '';

  imgResultAfterCompress: string = '';

  loader = 0;
  clientList: any[] = [];
  csrfTokenName: any;
  csrfToken: any;
  projectContext: ProjectContext;
  assetsFolder: string;

  constructor(private fb: FormBuilder, private core: CoreService, private location: Location, private modalService: NgbModal, private imageCompress: NgxImageCompressService, private userService: UserDetailService, private featureToggle: FeatureToggleService, private insightsService: InsightsService) {
    this.projectContext = this.featureToggle.getContext() as ProjectContext;
    this.assetsFolder = environment.projectConfigs[this.projectContext].assetsFolder;
  }

  ngOnInit(): void {
    this.csrfTokenName = this.userService.getcsrfTokenName();
    this.csrfToken = this.userService.getcsrfToken();
    this.initForm();
  }

  initForm() {
    this.regForm = this.fb.group({
      name: ["", Validators.required],
      phone: ["", [Validators.required, Validators.minLength(10), Validators.pattern('[0-9]*')]],
      address: ["", Validators.required],
      pocname: ["", Validators.required],
      pocemail: ["", [Validators.required, Validators.email]],
      csrf_token: [this.csrfToken || ''],
    });
  }

  onImageChange(e: any) {
    const reader = new FileReader();
    if (e.target.files && e.target.files.length) {
      const [file] = e.target.files;
      reader.readAsDataURL(file);

      reader.onload = () => {
        this.imgFile = reader.result as string;
        this.uploadForm.patchValue({
          imgSrc: reader.result
        });

      };
    }
  }

  fileChangeEvent(event: any): void {
    this.imageChangedEvent = event;
  }

  imageCropped(event: ImageCroppedEvent) {
    this.croppedImage = event.base64;
  }

  get uf() {
    return this.uploadForm.controls;
  }

  open(content: any, user?: any) {
    this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' }).result.then((result) => {

    }, (reason) => {

    });
  }

  upload() {
    const request = {
      "purpose": "set_client_image",
      "client_id": "",
      "base64": this.uploadForm.value.imgSrc
    }

    if (!request.client_id) {
      this.core.toast("warning", "Please select client");
      return
    }
  }

  get f() { return this.regForm.controls; }

  createClient() {
    this.submitted = true;
    if (this.regForm.invalid) {
      return
    }

    const request = this.regForm.value;
    request.image = this.imgResultAfterCompress || "";
    request.purpose = "create";

    this.core.post('client', request).then((response: any) => {
      if (response.status == 1) {
        this.core.toast("success", response.msg)
        this.regForm.reset();
        this.getClients();
        this.imgResultAfterCompress = ""
        this.submitted = false;
      } else if (response.msg) {
        this.core.toast("error", response.msg)
      } else {
        response?.name ? this.core.toast("error", response?.name) : '';
        response?.address ? this.core.toast("error", response?.address) : '';
        response?.pocemail ? this.core.toast("error", response?.pocemail) : '';
        response?.pocphone ? this.core.toast("error", response?.pocphone) : '';
      }
    }).catch((err) => {
      this.insightsService.logException(err);
      this.core.toast("warning", err);
    });
  }

  getClients() {
    this.loader++
    const request = { purpose: "get_all_created" }

    this.core.post("client", request).then((response: any,) => {
      if (response.status == 1) {
        this.clientList = response?.all_clients;
      }
    }).catch((error) => this.insightsService.logException(error)).finally(() => {
      this.loader--
    })
  }

  back() {
    this.location.back();
  }

  compressFile() {

    this.imageCompress.uploadFile().then(({ image, orientation }) => {

      this.imageCompress.compressFile(image, orientation, 20, 20).then(
        result => {
          this.imgResultAfterCompress = result;
        }
      );

    });

  }

}