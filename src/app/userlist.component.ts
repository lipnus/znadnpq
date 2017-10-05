import { Component } from '@angular/core';


import { AngularFireDatabase, FirebaseListObservable, FirebaseObjectObservable  } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import { Observable } from 'rxjs/Observable';
import * as firebase from 'firebase/app';

// Modal
import { Modal } from 'angular2-modal/plugins/bootstrap';

import { Location } from '@angular/common';

import { Router,ActivatedRoute } from '@angular/router';


import {ResInfo} from './resinfo';

@Component({
  selector: 'app-root',
  templateUrl: './htmlcss/userlist.component.html',
  styleUrls: ['./htmlcss/userlist.component.css'],
})

export class UserlistComponent {

  items: FirebaseListObservable<any[]>; // stores the Firebase list (이건 리스트 단위)
  items2: FirebaseListObservable<any[]>; // stores the Firebase list (이건 리스트 단위)
  item: FirebaseObjectObservable<any>; // stores the Firebase object (이건 오브젝트 단위)
  item2: FirebaseObjectObservable<any>; // stores the Firebase object (이건 오브젝트 단위)

  fireDB: AngularFireDatabase; // 디비

  msgVal = ''; // stores the user-submitted entry. (입력하는 창)

  // 식당검색
  resSearchText: string;

  // 접속자 상태
  user;

  fuck;


  constructor(private router:Router, public afAuth: AngularFireAuth, public db: AngularFireDatabase, public modal: Modal) {

    this.fuck = "시발";

    this.items = db.list('/Korea/user', {
      query: {
        // limitToLast: 50 // 50개만 불러온다
      }
    });

    // 유저정보
    this.user = firebase.auth().currentUser;

    // 데이터베이스
    this.fireDB = db;

    // 로그인 상태
    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        // User is signed in.
        console.log("로그인(resList 관찰자)");
      } else {
        // No user is signed in.
        console.log("로그아웃(resList 관찰자");
        router.navigate(['']);
      }
    });

  }

  // 로그아웃
  logout() {
    firebase.auth().signOut().then(function() {
      // Sign-out successful.
      console.log('로그아웃 성공');
    }, function(error) {
      // An error happened.
      console.log('로그아웃 실패');
    });
  }


  // 식당이름 검색
  resSearch() {
    this.items = this.fireDB.list('/Korea/user', {
      query: {
        orderByChild: 'res_name',
        equalTo: this.resSearchText,
        limitToLast: 50 // 최대 50개만 불러온다
      }
    });

    if(this.resSearchText === '') {
      this.items = this.fireDB.list('/Korea/res_info', {
        query: {
          limitToLast: 50 // 최대 50개만 불러온다
        }
      });
    }




  }


}
