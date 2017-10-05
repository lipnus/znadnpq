import { Component } from '@angular/core';


import { AngularFireDatabase, FirebaseListObservable, FirebaseObjectObservable  } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import { Observable } from 'rxjs/Observable';
import * as firebase from 'firebase/app';

// Modal
import { Modal } from 'angular2-modal/plugins/bootstrap';
import {Router} from "@angular/router";

@Component({
  selector: 'app-root',
  templateUrl: './htmlcss/reslist.component.html',
  styleUrls: ['./htmlcss/reslist.component.css'],
})

export class ReslistComponent {


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

    this.items = db.list('/Korea/res_info', {
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

  // 해당 식당을 삭제
  deleteMenu(resName: any) {
    console.log('삭제클릭: ' + resName);

    //식당키
    let resKey;

    // 데스노트
    const reviewKey = [];
    // const menuKey = [];


    //=====================================================================
    //  식당이름으로 검색해서 res_info, re_category_res, re_theme_res 삭제
    //=====================================================================
    const resRef = firebase.database().ref('Korea/res_info');
    resRef.orderByChild('res_name').equalTo(resName).once('child_added').then(data => {

      // 식당 키(data.key)를 알아낸 다음 해당데이터들을 날려버린다
      resKey = data.key;
      console.log("식당키: " + data.key);

      // res_theme값들을 읽어온다
      const res_theme = []; // 여기에 테마들이 저장

      const Ref = firebase.database().ref('Korea/res_info/' + data.key + '/res_theme');
      Ref.on('child_added', function(themeData) {
        console.log("theme넣기: " + themeData.key);
        res_theme.push( themeData.key );
      });


      // re_theme_res 삭제
      for(let i=0; i < res_theme.length; i++) {
        console.log('theme: ' + res_theme[i] );
        this.item = this.fireDB.object('Korea/re_theme_res/' + res_theme[i] + '/' + data.key);
        this.item.remove();
      }


      // re_category_res 삭제
      this.item = this.fireDB.object('Korea/re_category_res/' + data.val().res_category + '/' + data.key);
      this.item.remove();


      // res_info 삭제
      this.item = this.fireDB.object('Korea/res_info/' + data.key);
      this.item.remove();








      //====================================================================================================
      //   menu_info, menu_review, comment, re_user_heart, re_user_fuck, re_user_reveiw삭제
      //====================================================================================================

      const fireDB = this.fireDB; //.then으로 하면 외부에서 선언한 this가 인식이 안됨 그래서 이렇게..


      //===========================
      //   메뉴찾기 - menu_info (식당하나당 리뷰여러개)
      //===========================
      const menuRef = firebase.database().ref('Korea/menu_info');
      menuRef.orderByChild("res_id").equalTo( resKey ).on('child_added', function(menuData) {

        console.log("메뉴: " +  menuData.key);
        fireDB.object('Korea/menu_info/' + menuData.key).remove(); //메뉴삭제

        //res_info안의 menu_id는 res_info자체가 지워지기 때문에 처리 안해줘도 된다


        //===========================
        //   리뷰찾기 - menu_review (메뉴하나당 리뷰여러개)
        //===========================
        const review2Ref = firebase.database().ref('Korea/menu_info/' + menuData.key + '/review_id');
        review2Ref.on('child_added', function(reviewData) {

          console.log("리뷰검색: " + reviewData.key);
          // reviewKey.push(reviewData.key);


          //댓글찾기 - comment
          const commentRef = firebase.database().ref('Korea/menu_review/' + reviewData.key + '/comment');
          commentRef.on('child_added', function(commentData) {

            console.log("댓글: " + commentData.key);
            fireDB.object('Korea/comment/' + commentData.key).remove(); //댓글삭제
          });


          //리뷰쓴사람 uid찾기 - re_user_review
          const uidRef = firebase.database().ref('Korea/menu_review/' + reviewData.key + '/uid');
          uidRef.once('value').then(reviewUidData => {

            console.log("re_user_review: " + reviewUidData.val() );
            fireDB.object('Korea/re_user_review/' + reviewUidData.val() + '/' + reviewData.key ).remove(); //re_user_review 삭제
          });


          //하트찾기 - re_user_heart
          const heartRef = firebase.database().ref('Korea/menu_review/' + reviewData.key + '/heart');
          heartRef.on('child_added', function(heartUidData) {

            console.log("하트: " + heartUidData.key);
            fireDB.object('Korea/re_user_heart/' + heartUidData.key + '/' + reviewData.key ).remove(); //하트삭제
          });


          //빠큐찾기 - re_user_fuck
          const fuckRef = firebase.database().ref('Korea/menu_review/' + reviewData.key + '/fuck');
          fuckRef.on('child_added', function(fuckUidData) {

            console.log("뻐큐: " + fuckUidData.key);
            fireDB.object('Korea/re_user_fuck/' + fuckUidData.key + '/' + reviewData.key ).remove(); //빠큐삭제
          });


          //리뷰찾기2 - 이미 찾았지만 하위 리스너에서 사용하기 때문에 그 이후에 지워져야함... 리스너 두번연속하면 차례가 가장 마지막이 되니까
          const reviewDelRef = firebase.database().ref('Korea/menu_review/');
          reviewDelRef.orderByKey().equalTo( reviewData.key ).once('child_added', function(reviewDelData) {

            const reviewDel2Ref = firebase.database().ref('Korea/menu_review/');
            reviewDel2Ref.orderByKey().equalTo( reviewData.key ).once('child_added', function(reviewDel2Data) {

              console.log("리뷰: " + reviewDel2Data.key);
              fireDB.object('Korea/menu_review/' + reviewDel2Data.key ).remove(); //리뷰삭제
            });
          });//리뷰찾기2


        });//리뷰찾기
      });//메뉴들
    });//식당이름으로 식당찾기



  }

  // 삭제 확인
  deleteConfirm(resName: string) {

    const delConfirm = confirm(resName + ': 정말로 삭제합니까? 돌이킬 수 없습니다 마치 인생처럼...');
    if (delConfirm) {
      this.deleteMenu(resName);
    }
  }

  // 식당이름 검색
  resSearch() {
    this.items = this.fireDB.list('/Korea/res_info', {
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



