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


const IFRAME_LOGIN_READY = 'iframeReady';
const PARENT_LOGIN_READY = 'parentReady';
const REQUEST_LOGIN_TOKEN = 'requestLoginToken';
const SENDING_LOGIN_TOKEN = 'sendingLoginToken';

@Component({
  selector: 'tb-login',
  templateUrl: './login-portal.component.html',
  styleUrls: ['./login-portal.component.scss']
})
export class LoginPortalComponent extends PageComponent implements OnInit {

  state = 'connecting';

  userInfo = '';

  constructor(private authService: AuthService) {
    super();
  }

  ngOnInit() {

   }


  ngAfterViewInit(){

    window.addEventListener('message', (message) => {


      if(this.state === 'waitingForToken' && message.data.login) {
        this.state = 'loggingIn';
        console.log(message.data);
        this.userInfo = JSON.stringify(message.data);
        this.authService.setUserFromJwtToken(message.data.login.token, message.data.login.refreshToken, true)
          .subscribe((value) => {
            if(value) {
            } else {
              location.reload();
            }
          });
      }

      if(message.data === SENDING_LOGIN_TOKEN) {
        this.state = 'waitingForToken';
        console.warn(message.data);
      }

      if(message.data === PARENT_LOGIN_READY) {
        this.state = 'connected';
        console.warn(message.data);
        window.parent.postMessage(REQUEST_LOGIN_TOKEN, '*');

      }


    });

    const interval = setInterval(() => {
      if(this.state === 'connecting') {
        window.parent.postMessage(IFRAME_LOGIN_READY, '*');
      } else {
        clearInterval(interval);
      }
    }, 2000);

  }

}
