import { Component } from '@angular/core';


import { AngularFireDatabase, FirebaseListObservable, FirebaseObjectObservable  } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import { Observable } from 'rxjs/Observable';
import * as firebase from 'firebase/app';

import {Routes, RouterModule, Router} from '@angular/router';

// Modal
import { Modal } from 'angular2-modal/plugins/bootstrap';

@Component({
  selector: 'app-root',
  templateUrl: './htmlcss/login.component.html',
  styleUrls: ['./htmlcss/login.component.css'],
})

export class LoginComponent {

  user: Observable<firebase.User>; // allow us to access the user state

  items: FirebaseListObservable<any[]>; // stores the Firebase list (이건 리스트 단위)
  item: FirebaseObjectObservable<any>; // stores the Firebase object (이건 오브젝트 단위)

  fireDB: AngularFireDatabase; // 디비

  userEmail: string;
  userPassword: string;



  constructor(private router: Router, public afAuth: AngularFireAuth, public db: AngularFireDatabase, public modal: Modal) {

    // 유저정보
    this.user = this.afAuth.authState;

    // 데이터베이스
    this.fireDB = db;


    // 로그인 해제
    this.afAuth.auth.signOut();

    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        // User is signed in.
        console.log("로그인(login 관찰자)");
        router.navigate(['/reslist']);

      } else {
        // No user is signed in.
        console.log("로그아웃(login 관찰자)");
      }
    });

  }


  login() {

    console.log("로그인시도");


    firebase.auth().signInWithEmailAndPassword(this.userEmail, this.userPassword).then(function() {
      // Sign-out successful.
      alert("환영합니다!");

    }, function(error) {
      // An error happened.
      alert("로그인 실패");
    });
  }

  logout() {
    this.afAuth.auth.signOut();
  }

}



