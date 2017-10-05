// Component빼고 나머지들은 modal때문에 넣은 것
import { Component, ViewContainerRef } from '@angular/core';
import { Modal } from 'angular2-modal/plugins/bootstrap';

import { Router,ActivatedRoute } from '@angular/router';

import { AngularFireDatabase, FirebaseListObservable, FirebaseObjectObservable  } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import { Observable } from 'rxjs/Observable';
import * as firebase from 'firebase/app';
import {PostsService} from './services/posts.service';

import 'firebase/storage';


@Component({
  selector: 'app-root',
  templateUrl: './htmlcss/move.component.html',
  styleUrls: ['./htmlcss/move.component.css'],
  providers: [PostsService]
})



export class MoveComponent {

  // [Firebase]
  user: Observable<firebase.User>; // allow us to access the user state
  items: FirebaseListObservable<any[]>; // stores the Firebase list (이건 리스트 단위)
  item: FirebaseObjectObservable<any>; // stores the Firebase list (이건 리스트 단위)
  item2: FirebaseObjectObservable<any>; // stores the Firebase list (이건 리스트 단위)


  fireDB: AngularFireDatabase; // 디비
  fireDB2: AngularFireDatabase; // 디비2

  // 업로드할 정보를 담고있는 객체
  resInfo: ResInfo;

  // post객체
  postsService: PostsService;

  // 이미지
  files: FileList;

  exterImage: File;
  interImage: File;

  // 식당이름이 겹치는지 확인
  resNameOverlap: boolean;

  //식당정보
  oldResInfo: OldResInfo[];
  newResInfo: ResInfo[];

  //메뉴정보
  oldMenuInfo: OldMenuInfo[];
  menuInfo: MenuInfo[];

  //리뷰정보
  oldMenuReview: OldMenuReview[];
  menuReview: MenuReview[];

  //리뷰 패키지(받을때 쓴다, 기존 서버의 구조)
  review: Review[];

  //리뷰 패키지(올릴때 쓴다, 새로운 서버의 구조)
  reviewUploadForm: ReviewUploadForm[];

  //사용자 정보
  userInfo: UserInfo[];

  // 생성자
  constructor(private router: Router, public afAuth: AngularFireAuth, public db: AngularFireDatabase, private ps: PostsService, public modal: Modal, private activatedRoute:ActivatedRoute) {


    this.user = this.afAuth.authState; // 유저정보
    this.resNameOverlap = false; // 식당이름 중복
    this.postsService = ps; // posts 초기화

    this.fireDB = db; // Firebase초기화
    this.fireDB2 = db; // Firebase초기화(두개면 좀 빠른가?)

    this.newResInfo = [];

  }

  // 기존 서버에서 식당 다운
  res_download(){
    this.postsService.sendData('http://kumchurk.ivyro.net/app/movetofire.php', 'resInfo').subscribe(posts => {
      this.oldResInfo = posts;
      this.res_ReMake(); // 자료 재정렬

      // console.log( this.newResInfo[1].res_theme );
    });

  }

  // 기존 서버에서 메뉴 다운
  menu_download(){
    this.postsService.sendData('http://kumchurk.ivyro.net/app/movetofire.php', 'menuInfo').subscribe(posts => {
      this.oldMenuInfo = posts;
      alert("메뉴 가져오기 성공");
    });
  }

  //기존 서버에서 리뷰 다운
  review_download(){
    this.postsService.sendData('http://kumchurk.ivyro.net/app/movetofire.php', 'menuReview').subscribe(posts => {
      this.oldMenuReview = posts;
      alert("리뷰 가져오기 성공");
    });
  }

  //기존 서버에서 패키지(리뷰, 리뷰에 딸린 하트,빠큐, 댓글) 다운
  pakage_download(){
    this.postsService.sendData('http://kumchurk.ivyro.net/app/movetofire.php', 'reviewPakage').subscribe(posts => {
      this.review = posts;

      //날짜에 초를 추가(기본값 00)
      for(let i=0; i<this.review.length; i++){
        if(this.review[i].review_comment != null){
          for(let j=0; j<this.review[i].review_comment.length; j++){
            this.review[i].review_comment[j].date = this.review[i].review_comment[j].date + "00";
          }
        }//if

      }



      alert("패키지 가져오기 성공");
    });
  }

  //기존 서버에서 사용자정보 가져오기
  user_download(){
    this.postsService.sendData('http://kumchurk.ivyro.net/app/movetofire.php', 'user').subscribe(posts => {
      this.userInfo = posts;
      console.log("유저정보 가져오기 성공");
      this.user_upload();
    });
  }

  // 이미지만 있는 것들을 쿰척이로 생성
  imgonly_download(){
    // this.postsService.sendData('http://kumchurk.ivyro.net/app/movetofire.php', 'imgonly').subscribe(posts => {
    //   this.userInfo = posts;
    //   console.log("유저정보 가져오기 성공");
    //
    //   this.imgOnly_upload();
    // });

    this.imgOnly_upload();
  }








  imgOnly_upload(){

    console.log("쿰척이 만들기");

    // 쿰척이를 생성하고 업로드
    const kumUid = "kumchurk";
    const kumUser = {
      username: "쿰척이",
      nickname: "쿰척이",
      profile_image: "http://http://kumchurk.ivyro.net/app/image/kumface/kumlogo.png",
      thumbnail: "http://http://kumchurk.ivyro.net/app/image/kumface/kumlogo.png",
      token: "토큰없다"
    };

    //menu_review에 업로드
    this.fireDB.object('/Korea/user/' + kumUid ).update( kumUser ).then(cb_review => {

    });




  }

  user_upload(){

    console.log("유저 업로드 시작");

    for(let i=0; i<this.userInfo.length; i++) {

      const uid = this.userInfo[i].uid;
      this.userInfo[i].uid = null;

      //menu_review에 업로드
      this.fireDB.object('/Korea/user/' + uid ).update( this.userInfo[i] ).then(cb_review => {

        console.log("진행률: "  + (i+1) + "/" + this.userInfo.length);

      });
    }

  }

  // 패키지(리뷰, 리뷰에 딸린 하트,빠큐, 댓글) 업로드
  pakage_upload1(){

    console.log("패키지업로드1");
    // 리뷰 업로드(하나씩)
    //
    // 1. 식당이름과 메뉴이름을 통해 메뉴의 키값 획득
    //
    // 2. Comment 업로드(키값 획득) ->
    //
    // 3. 클라이언트에서 heart, fuck, comment(comment키사용)를 review_info 내부에 포함 ->
    //
    // 4. review_info에 업로드(메뉴키값 사용, 키값 획득) ->
    //
    // 5. menu_info(review 키사용) 내부에 업로드 -> re_user_review, re_user_heart, re_user_fuck 업로드

    // 이 메소드에서는 3번까지, pakage_upload2에서 4,5번 처리


    this.reviewUploadForm = [];

    //리뷰를 하나씩 업로드
    for(let i=0; i<this.review.length; i++){

      //리뷰 폼 생성(기존 정보 중 사용할 것들은 생성자에서 처리)
      this.reviewUploadForm[i] = new ReviewUploadForm( this.review[i] );

      //리뷰의 식당명
      firebase.database().ref('Korea/res_info/').orderByChild("res_name").equalTo( this.review[i].res_name ).
      once('child_added', cb_resInfo => {

        // 이 식당의 메뉴들 검색
        firebase.database().ref('Korea/menu_info/').orderByChild("res_id").equalTo( cb_resInfo.key ).
        on('child_added', cb_menuInfo => {


          //메뉴이름이 일치하는 것
          if(cb_menuInfo.val().menu_name === this.review[i].menu_name){

            //리뷰가 속한 메뉴의 키값입력
            this.reviewUploadForm[i].menu_id = cb_menuInfo.key;


            //reviewUploadForm의 heart와 huck를 채운다
            if(this.review[i].review_vote != null){
              for(let j=0; j<this.review[i].review_vote.length; j++){

                const voteVal = this.review[i].review_vote[j];

                //하트넣음(uid: 날짜)
                if(voteVal.heart !== "0"){
                 this.reviewUploadForm[i].heart[voteVal.uid] = voteVal.vote_date;
                 console.log("하트입력");
                }

                //빠큐넣음(uid: 날짜)
                if(voteVal.fuck !== "0"){
                  this.reviewUploadForm[i].fuck[voteVal.uid] = voteVal.vote_date;
                  console.log("뻐큐입력");
                }

              }
            }


            //코멘트를 업로드하고 그 키값을 reviewUploadForm에 넣음
            if(this.review[i].review_comment != null){
              for(let j=0; j<this.review[i].review_comment.length; j++){

                this.fireDB.list('/Korea/comment').push(this.review[i].review_comment[j]).then((cb_comment) => {

                  //업로드 폼의 comment 부분 완성(값툴형태)
                  this.reviewUploadForm[i].comment[ cb_comment.key ] = true;
                  console.log("진행률: " + i + "/" + (this.review.length -1) );

                });
              }//for문
            }//if문


          }//메뉴이름이 일치하는 것
        });//이 식당의 메뉴들 검색
      });//리뷰의 식당명
    }//for문

  }

  // 패키지(리뷰, 리뷰에 딸린 하트,빠큐, 댓글) 업로드2
  pakage_upload2(){

    console.log("패키지업로드2");
    // 4. review_info에 업로드(메뉴키값 사용, 키값 획득) ->
    //
    // 5. menu_info(review 키사용) 내부에 업로드 -> re_user_review, re_user_heart, re_user_fuck 업로드

    //리뷰를 하나씩 업로드
    for(let i=0; i<this.review.length; i++){
      this.reviewUploadForm[i].review = null; //이 시발새끼가 왜 포함되어 있는지 모르겠네


      //menu_review에 업로드
      this.fireDB.list('/Korea/menu_review').push(this.reviewUploadForm[i]).then(cb_review => {

        //리뷰의 고유키
        const reviewId = {};
        reviewId[ cb_review.key ] = true;


        //menu_info에 업로드
        this.fireDB.object('/Korea/menu_info/' + this.reviewUploadForm[i].menu_id + "/review_id" ).update(reviewId);

        //re_user_review에 업로드
        this.fireDB.object('/Korea/re_user_review/' + this.reviewUploadForm[i].uid ).update(reviewId);

        //각 사용자가 날린 하트 표시
        for (const heart_uid of Object.keys(this.reviewUploadForm[i].heart)) {
          this.fireDB.object('/Korea/re_user_heart/' + heart_uid ).update(reviewId);
        }

        //각 사용자가 날린 뻐큐 표시
        for (const fuck_uid of Object.keys(this.reviewUploadForm[i].fuck)) {
          this.fireDB.object('/Korea/re_user_fuck/' + fuck_uid ).update(reviewId);
        }

      });
    }//for문

    console.log("패키지업로드2 for문 종료");

  }

  // 리뷰 업로드
  review_upload(){

    let count = 0;

    console.log("리뷰 업로드");

    this.menuReview = this.oldMenuReview; //menu_id를 찾아서 연결해줘야함

    for(let i=0; i<this.oldMenuReview.length; i++){

      // 식당이름이 같은 것을 검색
      firebase.database().ref('Korea/res_info/').orderByChild("res_name").equalTo( this.oldMenuReview[i].res_name ).
      once('child_added', resInfoData => {


        // 이 식당의 메뉴들 검색
        firebase.database().ref('Korea/menu_info/').orderByChild("res_id").equalTo( resInfoData.key ).
        on('child_added', menuInfoData => {

          //메뉴이름이 일치하는 것
          if(menuInfoData.val().menu_name === this.oldMenuReview[i].menu_name){ //=======================================

            //uid는 일단 지금의 것을 그대로 사용한다. 새로 가입한다면 해당uid를 바꿔주는 쿼리를 만들어야함

            //메뉴 키 획득
            this.menuReview[i].menu_id = menuInfoData.key;

            //필요없는거 안올라가게..
            this.oldMenuReview[i].res_name = null;
            this.oldMenuReview[i].menu_name = null;
            this.menuReview[i] = this.oldMenuReview[i];

            //리뷰 업로드(menu_review)
            this.fireDB.list('/Korea/menu_review').push(this.menuReview[i]).then((reviewPush) => {

              //리뷰업로드(menu_info 내부)
              const reviewData = { };
              reviewData[ reviewPush.key ] = true;
              this.fireDB.object('/Korea/menu_info/' + menuInfoData.key + "/review_id").update(reviewData).then((menuPush) => {

                count = count +1;
                console.log("진행률: " + i + "/" + this.oldMenuReview.length + ", 카운트: " + count);

              });
            });
          }//============================================================================================================
        });
      });
    }



  }

  // 식당 업로드
  res_upload() {

    console.log("식당 업로드");

    //res_info 업로드
    for (let i = 0; i < this.newResInfo.length; i++) {

      //res_info
      this.fireDB.list('/Korea/res_info').push(this.newResInfo[i]).then((pushData) => {

        //re_catgory_res
        const categoryData = { };
        categoryData[pushData.key] = true;
        this.fireDB.object('/Korea/re_category_res/' + this.newResInfo[i].res_category ).update(categoryData);


        //re_theme_res (https://stackoverflow.com/questions/38379972/how-do-you-foreach-a-dictionary)
        for (const theme_key of Object.keys(this.newResInfo[i].res_theme)) {
          const themeData = { };
          themeData[pushData.key] = true;
          this.fireDB.object('/Korea/re_theme_res/' + theme_key ).update(themeData);
        }

      });//res_info (push)
    }//for문

    console.log("식당 업로드 for문 완료");
  }



  // 메뉴 업로드(menu_info)
  menu_upload_start(){
    console.log("메뉴 업로드(menu_info)");

    this.menuInfo = this.oldMenuInfo; // menuInfo에는 res_name이 없음
    this.menu_upload(0);
  }

  // 메뉴 업로드(res_info)
  menu_upload_start2(){
    console.log("메뉴 업로드(res_info)");

    this.menuInfo = this.oldMenuInfo; // menu_upload_start()이후라면 메뉴키값과 레스토랑 키값이 저장되어 있다
    this.menu_upload2(0);
  }

  // firebase 메뉴 업로드(menu_info)
  menu_upload(startIndex: number){

    let endIndex = startIndex + 1000; //1000개씩 끊어서 올린다
    if(endIndex > this.menuInfo.length){
      endIndex = this.menuInfo.length;
    }

    //메뉴 하나하나씩 올린다
    for (let i = startIndex; i < endIndex; i++) {

      //레스토랑 이름을 검색
      firebase.database().ref('Korea/res_info/').orderByChild("res_name").equalTo(this.oldMenuInfo[i].res_name).
      on('child_added', resData => {

        //받아온 레스토랑의 키를 입력
        this.menuInfo[i].res_id = resData.key;

        //입력해놓음
        this.oldMenuInfo[i].res_id = resData.key;
        // console.log("레스토랑키: " + resData.key);

        //원래 안해도 되는데 왜...
        this.oldMenuInfo[i].res_name=null;
        this.menuInfo[i] = this.oldMenuInfo[i];

        //memu_info에 메뉴 업로드 ======================================================================================
        this.fireDB.list('/Korea/menu_info').push(this.menuInfo[i]).then((menuPushData) => {

          // 업로드한 메뉴키를 저장(DB에서 메뉴데이터들이 자신의 키 값을 내부에 중복해서 가질 필요가 없으므로 old에다 저장해놓고, res_info넣을 때 쓴다)
          this.oldMenuInfo[i].key = menuPushData.key;

          console.log("진행률: " + i + "/" + this.menuInfo.length);

          //업로드가 다 끝나면 다음 100개 업로드(콜백이기 때문에 for문 밖이 아니라 여기서 끝을 체크해야함)
          if(i === endIndex -1){
            //다음으로
            this.menu_upload(endIndex);
          }

        });//menu_info에 메뉴업로드 ====================================================================================
      });
    }//for문
  }

  // firebase 메뉴 업로드(res_info)
  menu_upload2(startIndex: number){

    let endIndex = startIndex + 1000; //100개씩 끊어서 올린다
    if(endIndex > this.menuInfo.length){
      endIndex = this.menuInfo.length;
    }

    //메뉴 하나하나씩 올린다
    for (let i = startIndex; i < endIndex; i++) {

      //res_info안의 menu_id에 메뉴 업로드
      const menuData = { };
      menuData[ this.oldMenuInfo[i].key ] = true;
      this.fireDB2.object('/Korea/res_info/' + this.menuInfo[i].res_id + '/menu_id' ).update(menuData).then( menuUpdate=>{

        console.log("진행률: " + i + "/" + this.menuInfo.length);

        //업로드가 다 끝나면 다음 100개 업로드(콜백이기 때문에 for문 밖이 아니라 여기서 끝을 체크해야함)
        if(i === endIndex -1){
          //다음으로
          this.menu_upload2(endIndex);
        }

      });
    }


  }



  // db전체삭제
  db_delete(){
    console.log("DB삭제");
    this.fireDB.object('/Korea' ).remove();
  }

  // 리뷰와 코멘트 삭제
  review_delete(){
    this.fireDB.object('/Korea/menu_review' ).remove();
    this.fireDB.object('/Korea/comment' ).remove();
    this.fireDB.object('/Korea/re_user_review' ).remove();
    this.fireDB.object('/Korea/re_user_heart' ).remove();
    this.fireDB.object('/Korea/re_user_fuck' ).remove();
    this.fireDB.object('/Korea/user' ).remove();

    console.log("menu_review 삭제");
    console.log("comment 삭제");
    console.log("re_user_review 삭제");
    console.log("re_user_heart 삭제");
    console.log("re_user_fuck 삭제");
    console.log("user 삭제");
  }



  test(){
    console.log("테스트");
  }

  // 새로운 서버에 맞게 형태를 수정( oldResInfo로 newResInfo만듦 )
  res_ReMake(){

    console.log("식당 데이터 형태 수정");

    for(let i=0; i<this.oldResInfo.length; i++) {

      // 하나의 식당 정보를 담을 객체를 만들어줌
      this.newResInfo.push( new ResInfo() );

      // 테마를 새로운 기준에 맞게 정리한다
      const themeArr = this.oldResInfo[i].theme.split(',');
      const themeData = { };

      for(let j=0; j<themeArr.length; j++){

        // 제일 앞의 공백 제거
        if(themeArr[j].substr(0,1) === " ") {
          themeArr[j] = themeArr[j].substr(1, themeArr[j].length);
          // console.log("공백제거");
        }

        // 슬래쉬 제거
        if(themeArr[j] === '썸/연인'){
          themeArr[j] = "썸&연인";
          // console.log("썸처리");
        }

        if(themeArr[j]=== ""){
          themeArr[j]="후배밥약";
        }

        // 딕셔너리 형태로 추가
        themeData[ themeArr[j] ] = true;
      }

      this.newResInfo[i].res_theme = themeData;


      // 변경된 기준에 위배되는 카테고리 값들 수정
      let category = this.oldResInfo[i].category;
      if(category === "패스트푸드"){
        category = "양식";
      }else if( category === "기타"){
        category = "횟집";
      }
      else if( category === "카페/제과"){
        category = "카페";
      }
      this.newResInfo[i].res_category = category;

      this.newResInfo[i].res_name = this.oldResInfo[i].name;
      this.newResInfo[i].phone = this.oldResInfo[i].phone;
      this.newResInfo[i].res_time.restime_weekday = this.oldResInfo[i].time;
      this.newResInfo[i].res_time.restime_sun = this.oldResInfo[i].time;
      this.newResInfo[i].res_time.restime_sat = this.oldResInfo[i].time;
      this.newResInfo[i].location = this.oldResInfo[i].location;
      this.newResInfo[i].latitude = this.oldResInfo[i].latitude;
      this.newResInfo[i].longitude = this.oldResInfo[i].longitude;
      this.newResInfo[i].extra_info = "";

      // 이미지 경로 앞에 http:// 없으면 붙여준다
      let imgPath1 = this.oldResInfo[i].res_image;
      if( imgPath1.substr(0,4) !== "http"){
        imgPath1 = "http://" + imgPath1;
      }

      let imgPath2 = this.oldResInfo[i].res_image2;
      if( imgPath2.substr(0,4) !== "http"){
        imgPath2 = "http://" + imgPath2;
      }

      this.newResInfo[i].image.image1 = imgPath1;
      this.newResInfo[i].image.image2 = imgPath2;

    } // for문 끝
  }

}



// Model
export class ResInfo {

  key: string;

  constructor() {
    this.res_time = new ResTime();
    this.image = new ResImage();
  }

  res_name: string;
  res_time: ResTime;
  phone: string;
  location: string;
  latitude: string;
  longitude: string;
  image: ResImage;
  res_category: string;
  extra_info: string;

  res_theme;
  // 딕셔너리인데 어떻게 선언해야 할지 모르겠다...

  // res_themes: ResTheme; //이것도
  // menu_id : MenuId; //폴더만 생성되지 않으니 이 부분은 메뉴를 입력하는 부분에서 설정
}
interface OldResInfo{
  name: string;
  category: string;
  theme: string;
  time: string;
  phone: string;
  location: string;
  latitude: string;
  longitude: string;
  res_image: string;
  res_image2: string;
}

export class MenuInfo{

  menu_name: string;
  menu_category: string;
  res_id: string;
  price1: string;
  price2: string;
  price3: string;
}
export class ResTime {
  restime_weekday: string;
  restime_sat: string;
  restime_sun: string;
}
export class ResImage {
  image1: string;
  image2: string;
}
export class OldMenuInfo extends MenuInfo {

  // DB에는 올라갈 필요가 없지만 클라이언트에서 필요한 값들은 이렇게 빼놓는다
  res_name: string;
  key: string;
}


export class MenuReview{
  uid: string;
  memo: string;
  menu_id: string;
  review_image: string;
  date: string;
  taste: string;

  // dictionary형태인데 어떻게 명시적으로 선언하는지 모르겠음
  heart;
  fuck;
  comment;
}
export class OldMenuReview extends MenuReview {
  menu_name: string;
  res_name: string;

}


export class Review{

  constructor(){
    this.review_comment = [];
  }
  //업로드 된 리뷰의 키값(메모용도)
  key: string;

  //Firebase 그대로 올라감
  uid: string;
  memo: string;
  review_image: string;
  date: string;
  taste: string;


  //검색에만 쓰임
  res_name: string;
  menu_name: string;

  //가공되어 올라감
  review_vote: Vote[];
  review_comment: Comment[];
}
export class Vote{
  uid: string;
  heart: string;
  fuck: string;
  vote_date: string;
}
export class Comment{
  uid: string;
  comment_text: string;
  date: string;
}


export class ReviewUploadForm{

  constructor(public review: Review){
    this.uid = review.uid;
    this.memo = review.memo;
    this.review_image = review.review_image;
    this.date = review.date;
    this.taste = review.taste;

    this.heart = {};
    this.fuck = {};
    this.comment = {};
    //menu_id는 review에는 없는 정보이니 따로 넣어줘야함
  }

  uid: string;
  memo: string;
  menu_id: string;
  review_image: string;
  date: string;
  taste: string;

  heart;
  fuck;
  comment;
}
export class UserInfo{
  uid: string; //여기에 저장만 해놓고 업로드에는 삭제
  username: string;
  nickname: string;
  profile_image: string;
  thumbnail: string;
  token: string;
}






