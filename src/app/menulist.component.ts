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
  templateUrl: './htmlcss/menulist.component.html',
  styleUrls: ['./htmlcss/menulist.component.css'],
})

export class MenulistComponent {

  user: Observable<firebase.User>; // allow us to access the user state
  items: FirebaseListObservable<any[]>; // stores the Firebase list (이건 리스트 단위)
  fireDB: AngularFireDatabase; // 디비

  mList: MenuInfo[]; // 메뉴정보를 담고있는 리스트

  resInfo: ResInfo;  // 식당정보(이 객체에 담아서 저장)
  uploading: boolean; // 업로드가 진행중일때만 ture로 해서 리스너와의 충돌을 막음

  routeLocation: Location;


  constructor(public location: Location, public afAuth: AngularFireAuth, public db: AngularFireDatabase, public modal: Modal, private router:Router, private activatedRoute:ActivatedRoute) {

    //뒤로 돌아가는데 필요한 라우터의 위치
    this.routeLocation = location;

    this.uploading = false;

    // 유저정보
    this.user = this.afAuth.authState;

    // 데이터베이스
    this.fireDB = db;

    // 이전 페이지에서 보내준 식당이름
    this.resInfo = new ResInfo;
    this.resInfo.res_name = activatedRoute.snapshot.params['id'];

    // 식당이름을 이용해서 DB에서 식당정보를 받아옴
    const ResRef = firebase.database().ref('Korea/res_info');
    ResRef.orderByChild('res_name').equalTo(this.resInfo.res_name).once('child_added').then(resData => {
      this.resInfo = resData.val();
      this.resInfo.key = resData.key;

      console.log("식당이름 확보");

      // 식당 key를 이용하여 메뉴들을 다운받는다
      this.downloadMenu( this.resInfo.key );

    }); // 식당정보 받기
  }




  // 임시 메뉴를 넣음
  inputData(){

    console.log('임시데이터 넣기');

    // 메뉴가 하나도 업로드 되어 있지 않은경우 빈칸하나 만들어줌
    this.mList = [];
    const a = new MenuInfo();
    const b = new MenuInfo();
    const c = new MenuInfo();

    a.menu_name="설현";
    a.menu_category="설현설현";
    a.res_id=this.resInfo.key;
    a.price1="설현1";
    a.price2="설현2";
    a.price3="설현3";

    b.menu_name="조이";
    b.menu_category="조이조이";
    b.res_id=this.resInfo.key;
    b.price1="조이1";
    b.price2="조이2";
    b.price3="조이3";

    c.menu_name="조현";
    c.menu_category="조현조현";
    c.res_id=this.resInfo.key;
    c.price1="조현1";
    c.price2="조현2";
    c.price3="조현3";

    this.fireDB.list('/Korea/menu_info').push(a);
    this.fireDB.list('/Korea/menu_info').push(b);
    this.fireDB.list('/Korea/menu_info').push(c);
  }

  // 해당 칸 밑에 메뉴 추가(카테고리는 바로 위의 칸과 동일)
  addMenu(index: number){
    console.log("추가");

    const menu = new MenuInfo();
    menu.menu_category = this.mList[index].menu_category;
    this.mList.splice(index+1,0, menu);
  }

  // 제일 마지막칸에서 tab누르면 새로운 거 생성
  tabCheck(index: number){
    console.log("index: " + index + ", length: " + this.mList.length );

    // if(index === this.mList.length-1){
    //   this.addMenu(index);
    // }
  }

  // 해당 칸의 메뉴를 삭제(클라이언트 & DB)
  deleteMenu(index: number){
    console.log("삭제");
    if(this.mList.length !== 1){

      // DB에서 삭제
      if(this.mList[index].key != null) {

        const delConfirm = confirm(this.resInfo.res_name + " - " + this.mList[index].menu_name + "\n이 메뉴에 딸린 리뷰들," +
                                    " 댓글, 좋아요, 싫어요에 대한 모든 Data가 지금 즉시 DB에서 영구적으로 삭제됩니다. 계속하시겠습니까?");

        //삭제하겠다
        if (delConfirm) {
          console.log("키가 존재");

          //리스너 내부에서 읽으려면 이렇게 해줘야 한다
          const fireDB = this.fireDB;
          const menuKey =  this.mList[index].key;

          //메뉴삭제(menu_info)
          firebase.database().ref('Korea/menu_info/' + this.mList[index].key ).remove();

          //메뉴삭제(res_info의 menu_id)
          firebase.database().ref('Korea/res_info/' + this.mList[index].res_id + '/menu_id/' + this.mList[index].key ).remove();

          //==========================================================
          // 리뷰찾기 - menu_review (메뉴하나당 리뷰여러개)
          //==========================================================
          const review2Ref = firebase.database().ref('Korea/menu_info/' + menuKey + '/review_id');
          review2Ref.on('child_added', function(reviewData) {

            console.log("리뷰검색: " + reviewData.key);


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
            fuckRef.once('child_added', function(fuckUidData) {

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

                //메뉴자체가 지워지므로 menu_info안의 review_id는 생각하지 않아도 된다
              });
            });//리뷰찾기2
          });//리뷰찾기





          //새로고침
          this.downloadMenu( this.resInfo.key );



        }

      }

      // DB에서 받은개 아니라 클라이언트에서만 추가시킨 것을 삭제
      else{
        this.mList.splice(index,1);
      }
    }



  }


  // 카테고리를 표시해줘야 되는지 판단
  lineCheck(index: number){
    if ( index === 0 ){
      return true;
    }
    else{
      if(this.mList[index].menu_category !== this.mList[index-1].menu_category){
        return true;
      }else{
        return false;
      }
    }
  }

  // 입력한 데이터를 업로드
  updateMenu(){

    this.uploading = true;

    // 데이터들을 하나씩 업로드
    for(let i=0; i<this.mList.length; i++){

      // 제목이 비어있는 칸은 업로드 하지 앖음
      if(this.mList[i].menu_name == null){ }

      // 제목이 있는경우 (제목만 있으면 다른 칸이 비었어도 업로드 된디)
      else{

        this.mList[i] = this.menuDataCheck(this.mList[i]); // 빈칸이 있는경우 초깃값을 넣어줌
        console.log(this.mList[i].menu_name + "키: " + this.mList[i].key);


        if(this.mList[i].key != null){
          // 키가 존재하는 경우(원래 있었던 메뉴): update
          console.log("menu_info업데이트: " + this.mList[i].menu_name);
          this.fireDB.object('/Korea/menu_info/' + this.mList[i].key ).update( this.mList[i] );

        }else{
          // 새로 추가된 경우: push
          console.log("푸쉬: " + this.mList[i].menu_name);

          //menu_info에 등록
          const menuKey = this.fireDB.list('/Korea/menu_info/' ).push( this.mList[i] ).key;

          //res_info에 menu_id에 등록
          const menuId = { }; menuId[ menuKey ] = true;
          this.fireDB.object('/Korea/res_info/' + this.mList[i].res_id + '/menu_id' ).update( menuId );

        }

      }// 칸이 다 완성된 경우(else)
    }// (for)

    this.uploading = false;
    // 메뉴를 새로 다운로드 받는다
    this.downloadMenu( this.resInfo.key );

    alert("DB에 저장");

  }

  // DB에서 메뉴정보를 다운로드
  downloadMenu(resKey: string){

    console.log("downloadReview()");

    // 메뉴들을 담을 리스트를 초기화
    this.mList = [];

    // 기본으로 하나 만들어준다
    if(this.mList.length===0){
      const firstMenu = new MenuInfo();
      firstMenu.menu_category = "카테고리를 입력하세요";
      this.mList.push(firstMenu);
    }

    // 식당key값을 이용하여 메뉴정보를 받아와서 mList에 넣는다
    const MenuRef = firebase.database().ref( 'Korea/menu_info');
    MenuRef.orderByChild('res_id').equalTo(resKey).on('child_added', menuData => {

      console.log("Download: " + menuData.val().menu_name );

      if(this.uploading === false){ // 업로드가 진행중일때는 아무것도 하지 않는다(충돌방지)

        const menu = menuData.val();
        menu.key = menuData.key;

        let inputOk = false;

        // 데이터가 존재하므로 처음에 기본으로 만들어줬던거는 삭제
        if(this.mList[0].menu_category==="카테고리를 입력하세요"){
          this.mList.splice(0, 1);
        }

        // 같은 카테고리끼리 붙어있게 리스트에 넣는다(같은 것의 제일 마지막에)
        for(let i=0; i<this.mList.length; i++){
          if (i !== this.mList.length-1 && this.mList[i].menu_category === menu.menu_category && this.mList[i+1].menu_category !== menu.menu_category){
            console.log("붙여주기");
            this.mList.splice(i+1, 0, menu);
            inputOk = true;
            break;
          }
        }

        // 같은 카테고리가 없어서 그 뒤로 들어가지 못했으면 제일 뒤에 넣는다
        if(inputOk === false){
          this.mList.push( menu );
        }
      }
    });// 리스너



  }

  // 업로드 하기전에 검사
  menuDataCheck(menuInfo: MenuInfo){

    menuInfo.res_id = this.resInfo.key;

    if(menuInfo.price1 == null){
      menuInfo.price1="0";
    }
    if(menuInfo.price2 == null){
      menuInfo.price2="0";
    }
    if(menuInfo.price3 == null){
      menuInfo.price3="0";
    }

    return menuInfo;
  }

  //뒤로
  cancel(){

    const delConfirm = confirm('정말 취소할까요?');
    if (delConfirm) {
      console.log("back");
      this.routeLocation.back();
    }


  }

}


export class MenuInfo{
  key: string;
  menu_name: string;
  menu_category: string;
  res_id: string;
  price1: string;
  price2: string;
  price3: string;
}
