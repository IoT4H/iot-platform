///
/// Copyright © 2016-2023 The Thingsboard Authors
///
/// Licensed under the Apache License, Version 2.0 (the "License");
/// you may not use this file except in compliance with the License.
/// You may obtain a copy of the License at
///
///     http://www.apache.org/licenses/LICENSE-2.0
///
/// Unless required by applicable law or agreed to in writing, software
/// distributed under the License is distributed on an "AS IS" BASIS,
/// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
/// See the License for the specific language governing permissions and
/// limitations under the License.
///

import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { AppState } from '@core/core.state';
import { Store } from '@ngrx/store';
import { PageComponent } from '@shared/components/page.component';
import { OAuth2ClientInfo } from '@shared/models/oauth2.models';


const IFRAME_LOGIN_READY = "iframeReady";
const PARENT_LOGIN_READY = "parentReady";
const REQUEST_LOGIN_TOKEN = "requestLoginToken";
const SENDING_LOGIN_TOKEN = "sendingLoginToken";

@Component({
  selector: 'tb-login',
  templateUrl: './login-portal.component.html',
  styleUrls: ['./login-portal.component.scss']
})
export class LoginPortalComponent extends PageComponent implements OnInit {

  oauth2Clients: Array<OAuth2ClientInfo> = null;

  constructor(protected store: Store<AppState>,
              private authService: AuthService,
              public fb: UntypedFormBuilder,
              private router: Router,
              private activatedRoute: ActivatedRoute) {
    super(store);
    this.activatedRoute.queryParamMap.subscribe((params) => {
      this.authService.redirectUrl = params.get("redirectUri");
    });
  }

  state = "connecting";

  userInfo = "";


  ngOnInit() {

   }


  ngAfterViewInit(){

    window.addEventListener('message', (message) => {


      if(this.state === "waitingForToken" && message.data.login) {
        this.state = "loggingIn";
        console.log(message.data)
        this.userInfo = JSON.stringify(message.data);
        this.authService.setUserFromJwtToken(message.data.login.token, message.data.login.refreshToken, true)
          .subscribe((value) => {
            if(value) {
            } else {
              location.reload();
            }
          })
      }

      if(message.data === SENDING_LOGIN_TOKEN) {
        this.state = "waitingForToken";
        console.warn(message.data);
      }

      if(message.data === PARENT_LOGIN_READY) {
        this.state = "connected";
        console.warn(message.data);
        window.parent.postMessage(REQUEST_LOGIN_TOKEN, "http://localhost:3000");

      }


    });

    const interval = setInterval(() => {
      if(this.state === "connecting") {
        window.parent.postMessage(IFRAME_LOGIN_READY, "http://localhost:3000");
      } else {
        clearInterval(interval);
      }
    }, 2000)

  }
/*
  login(): void {
    if (this.loginFormGroup.valid) {
      this.authService.login(this.loginFormGroup.value).subscribe(
        () => {},
        (error: HttpErrorResponse) => {
          if (error && error.error && error.error.errorCode) {
            if (error.error.errorCode === Constants.serverErrorCode.credentialsExpired) {
              this.router.navigateByUrl(`login/resetExpiredPassword?resetToken=${error.error.resetToken}`);
            } else if (error.error.errorCode === Constants.serverErrorCode.passwordViolation) {
              this.passwordViolation = true;
            }
          }
        }
      );
    } else {
      Object.keys(this.loginFormGroup.controls).forEach(field => {
        const control = this.loginFormGroup.get(field);
        control.markAsTouched({onlySelf: true});
      });
    }
  }*/

  getOAuth2Uri(oauth2Client: OAuth2ClientInfo): string {
    let result = "";
    if (this.authService.redirectUrl) {
      result += "?prevUri=" + this.authService.redirectUrl;
    }
    return oauth2Client.url + result;
  }
}
