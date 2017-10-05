import { Component } from '@angular/core';


import { AngularFireDatabase, FirebaseListObservable, FirebaseObjectObservable  } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import { Observable } from 'rxjs/Observable';
import * as firebase from 'firebase/app';

// Modal
import { Modal } from 'angular2-modal/plugins/bootstrap';

import { Router,ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';


@Component({
  selector: 'app-root',
  templateUrl: './htmlcss/reviewlist.component.html',
  styleUrls: ['./htmlcss/reviewlist.component.css'],
})

export class ReviewlistComponent {

  user: Observable<firebase.User>; // allow us to access the user state
  items: FirebaseListObservable<any[]>; // stores the Firebase list (이건 리스트 단위)
  fireDB: AngularFireDatabase; // 디비

  rList: MenuReview[]; // 리뷰정보를 담고있는 리스트

  menuInfo: MenuInfo; //메뉴정보

  resName: string; //cancel을 눌렀을 때 이전페이지로 돌아가기 위한 식당이름 (reslist에서 res_id를 구할 수가 없어서 불가피하게 식당이름으로 찾아야함..)

  routeLocation: Location;

  constructor(public afAuth: AngularFireAuth, public db: AngularFireDatabase, public modal: Modal, private router:Router, private activatedRoute:ActivatedRoute,
              public location: Location) {


    console.log("리뷰리스트");

    //뒤로 돌아가는데 필요한 라우터의 위치
    this.routeLocation = location;

    // 유저정보
    this.user = this.afAuth.authState;

    // 데이터베이스
    this.fireDB = db;

    // 이전 페이지에서 보내준 메뉴정보
    this.menuInfo = new MenuInfo;
    this.menuInfo.key = activatedRoute.snapshot.params['id'];

    this.startDownload();
  }



  //DB에서 정보 받아오기 시작
  startDownload(){

    //리스트 초기화
    this.rList = [];


    // 메뉴정보----------------------------------------------------------------------------------------------------------
    const menuRef = firebase.database().ref('Korea/menu_info/' + this.menuInfo.key );
    menuRef.once('value').then(menuData => {

      this.menuInfo = menuData.val();
      this.menuInfo.key = menuData.key;
    }); //-----------------------------------------------------------------------------------------------------메뉴정보받기


    // 메뉴키를 이용해 리뷰키를 받아온다------------------------------------------------------------------------------------
    const reviewRef = firebase.database().ref('Korea/menu_info/' + this.menuInfo.key + '/review_id');
    reviewRef.on('child_added', reviewData => {

      console.log("리뷰키: " + reviewData.key);
      this.downloadReview( reviewData.key );
    }); //------------------------------------------------------------------------------------------------------리뷰키 받기
  }

  // DB에서 리뷰를 다운로드
  downloadReview(reviewKey: string){

    console.log("downloadReview()");

    // 메뉴들을 담을 리스트를 초기화
    this.rList = [];

    // 리뷰key값을 이용하여 리뷰를 받아와서 rList에 넣는다
    const reviewRef = firebase.database().ref( 'Korea/menu_review/' + reviewKey);
    reviewRef.once('value').then(reviewData => {

      //리뷰객체 초기화
      let menuReview: MenuReview = new MenuReview();

      //리뷰객체에 데이터 삽입
      menuReview = reviewData.val();
      menuReview.key = reviewData.key;

      //완료시점을 알기위한 카운트
      let commentCount = 0;
      let commentCompareCount = 0;


      //댓글없음
     if(reviewData.val().comment == null){
        menuReview.comment = [];
        this.rList.push( menuReview );
        console.log("댓글없어" );
      }

      //댓글있음
      else{

        //댓글키를 알아온다
        const commentKeyRef = firebase.database().ref( 'Korea/menu_review/' + reviewKey + '/comment');
        commentKeyRef.on('child_added', commentData => {

          console.log("댓글?");
          commentCount++;
          menuReview.comment = []; //리뷰객체에서 리뷰가 들어갈 공간 초기화(이상하게 위에서 하면 안되고 여기서 초기화하면 됨)

          //댓글을 받아온다
          const commentRef = firebase.database().ref( 'Korea/comment/' + commentData.key );
          commentRef.once('value').then(commentData2 => {

            commentCompareCount++;

            //리뷰객체 안에 댓글을 넣는다(리뷰와 그에 속하는 댓글들이 하나의 객체)
            const reviewComment = commentData2.val();
            reviewComment.key = commentData2.key;
            console.log( reviewComment.comment_text );

            menuReview.comment.push(reviewComment);


            //해당하는 리뷰의 모든 댓글을 다 다운받음
            if(commentCount === commentCompareCount){

              this.rList.push( menuReview );
              console.log("다운로드 종료");
            }

          });

          //댓글정보 확보
          console.log(commentData.key );

        });

      }//else





    });// 리스너

  }


  //리뷰삭제
  deleteReview(reviewIndex: number){
    const reviewKey = this.rList[reviewIndex].key;
    console.log("리뷰삭제: " + reviewKey);

    const fireDB = this.fireDB;


    //댓글찾기 - comment
    const commentRef = firebase.database().ref('Korea/menu_review/' + reviewKey + '/comment');
    commentRef.on('child_added', function(commentData) {

      console.log("댓글: " + commentData.key);
      if(commentData != null){
        fireDB.object('Korea/comment/' + commentData.key).remove(); //댓글삭제
      }

    });


    //리뷰쓴사람 uid찾기 - re_user_review
    const uidRef = firebase.database().ref('Korea/menu_review/' + reviewKey + '/uid');
    uidRef.once('value').then(reviewUidData => {

      console.log("re_user_review: " + reviewUidData.val() );
      fireDB.object('Korea/re_user_review/' + reviewUidData.val() + '/' + reviewKey ).remove(); //re_user_review 삭제
    });


    //하트찾기 - re_user_heart
    const heartRef = firebase.database().ref('Korea/menu_review/' + reviewKey + '/heart');
    heartRef.on('child_added', function(heartUidData) {

      console.log("하트: " + heartUidData.key);
      if(heartUidData != null){
        fireDB.object('Korea/re_user_heart/' + heartUidData.key + '/' + reviewKey ).remove(); //하트삭제
      }

    });


    //빠큐찾기 - re_user_fuck
    const fuckRef = firebase.database().ref('Korea/menu_review/' + reviewKey + '/fuck');
    fuckRef.on('child_added', function(fuckUidData) {

      console.log("뻐큐: " + fuckUidData.key);
      if(fuckUidData != null){
        fireDB.object('Korea/re_user_fuck/' + fuckUidData.key + '/' + reviewKey ).remove(); //빠큐삭제
      }

    });


    //리뷰지우기 - 이미 찾았지만 하위 리스너에서 사용하기 때문에 그 이후에 지워져야함... 리스너 두번연속하면 차례가 가장 마지막이 되니까
    const reviewDelRef = firebase.database().ref('Korea/menu_review/');
    reviewDelRef.orderByKey().equalTo( reviewKey ).once('child_added', function(reviewDelData) {

      const reviewDel2Ref = firebase.database().ref('Korea/menu_review/');
      reviewDel2Ref.orderByKey().equalTo( reviewKey ).once('child_added', function(reviewDel2Data) {

        console.log("리뷰: " + reviewDel2Data.key);

        //menu_review 의 리뷰삭제
        fireDB.object('Korea/menu_review/' + reviewDel2Data.key ).remove();


      });
    });//리뷰지우기

    //menu_info안의 review_id 리뷰키 삭제 (리스너 밖이라 순서상으로는 가장 먼저 지워짐, 위의 리뷰지우기랑 붙여놓으려고 여기에 놔뒀음)
    fireDB.object('Korea/menu_info/' + this.menuInfo.key + '/review_id/' + reviewKey ).remove();


    //클라이언트 데이터 삭제
    this.rList.splice(reviewIndex, 1);



  }

  //댓글삭제
  deleteComment(reviewIndex:number, commentIndex:number){

    const reviewKey = this.rList[ reviewIndex ].key;
    const commentKey = this.rList[ reviewIndex ].comment[ commentIndex ].key;

    console.log("[댓글삭제] " + "리뷰키: " + reviewKey + " 댓글키: " + commentKey);
    const fireDB = this.fireDB;

    //comment루트 삭제
    fireDB.object('Korea/comment/' + commentKey).remove();

    //menu_review루트 안의 comment삭제
    fireDB.object('Korea/menu_review/' + reviewKey + '/comment/' + commentKey).remove();

    //클라이언트 데이터 삭제
    this.rList[ reviewIndex ].comment.splice(commentIndex, 1);

}

  cancel(){
    console.log("back");
    this.routeLocation.back();

  }




}

//리뷰정보
export class MenuReview{

  key: string;
  uid: string;
  memo: string;
  menu_id: string;
  review_image: string;
  date: string;
  heart: any;
  fuck: any;
  taste: string;

  comment: ReviewComment[];
}

export class ReviewComment{

  key: string;
  comment_text: string;
  uid: string;
  date: string;

}



//메뉴정보
export class MenuInfo{
  key: string;
  menu_name: string;
  menu_category: string;
  res_id: string;
  price1: string;
  price2: string;
  price3: string;
  review_id: any;
}
