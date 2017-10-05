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
import {ResInfo, ResThemeMatching} from './resinfo';


@Component({
  selector: 'app-root',
  templateUrl: './htmlcss/resmodify.component.html',
  styleUrls: ['./htmlcss/resmodify.component.css'],
  providers: [PostsService]
})



export class ResmodifyComponent {

  // [Firebase]
  user: Observable<firebase.User>; // allow us to access the user state
  items: FirebaseListObservable<any[]>; // stores the Firebase list (이건 리스트 단위)
  item: FirebaseObjectObservable<any>; // stores the Firebase list (이건 리스트 단위)
  item2: FirebaseObjectObservable<any>; // stores the Firebase list (이건 리스트 단위)
  fireDB: AngularFireDatabase; // 디비

  // 업로드할 정보를 담고있는 객체
  resInfo: ResInfo;
  resTheme: ResThemeMatching;

  // post객체
  postsService: PostsService;

  // 이미지
  files: FileList;

  exterImage: File;
  interImage: File;

  // 식당이름이 겹치는지 확인
  resNameOverlap: boolean;

  // 바뀍 전의 카테고리
  originalCategory: string;

  // 생성자
  constructor(private router: Router, public afAuth: AngularFireAuth, public db: AngularFireDatabase, private ps: PostsService, public modal: Modal, private activatedRoute:ActivatedRoute) {

    this.user = this.afAuth.authState; // 유저정보
    this.resNameOverlap = false; // 식당이름 중복
    this.postsService = ps; // posts 초기화
    this.fireDB = db; // Firebase초기화

    this.resInfo = new ResInfo;
    this.resInfo.res_name = activatedRoute.snapshot.params['id']; // 이전 페이지에서 보내준 식당이름

    // 테마 초깃값
    this.resTheme = {
      withJunior : false,
      eatSolo : false,
      love : false,
      brother : false,
      sister : false,
      run : false,
      afterParty : false,
      feelSoGood : false,
      homeRice : false,
      wellBeing : false,
      study : false,
      teamPlay : false,
      dessert : false,
      brunch : false,
      nightMeal : false,
    };

    // 식당이름을 이용해서 DB에서 식당정보를 받아옴
    const ResRef = firebase.database().ref('Korea/res_info');
    ResRef.orderByChild('res_name').equalTo(this.resInfo.res_name).once('child_added', resData => {
      this.resInfo = resData.val();
      this.resInfo.key = resData.key;

      this.originalCategory = resData.val().res_category; // 업로드 할 때 기존경로를 찾아가서 삭제하기 위해서 원래 카테고리를 따로 저장해놓는다

      // 테마정보를 받아온다
      const ThemeRef = firebase.database().ref('Korea/res_info/' + resData.key + '/res_theme');
      ThemeRef.on('child_added', themeData => {
        this.themeCheck(themeData.key);
      });
    });
  }

  // DB에서 받은 정보로 클라이언트 값 지정
  themeCheck(theme: string){
    if(theme === '후배밥약'){
      this.resTheme.withJunior=true;
    }
    if(theme === '혼밥러'){
      this.resTheme.eatSolo=true;
    }
    if(theme === '썸&연인'){
      this.resTheme.love=true;
    }
    if(theme === '브로맨스'){
      this.resTheme.brother=true;
    }
    if(theme === '시스터즈'){
      this.resTheme.sister=true;
    }
    if(theme === '달려보자'){
      this.resTheme.run=true;
    }
    if(theme === '뒷풀이'){
      this.resTheme.afterParty=true;
    }
    if(theme === '알딸딸'){
      this.resTheme.feelSoGood=true;
    }
    if(theme === '집밥'){
      this.resTheme.homeRice=true;
    }
    if(theme === '웰빙'){
      this.resTheme.wellBeing=true;
    }
    if(theme === '공부'){
      this.resTheme.study=true;
    }
    if(theme === '팀플'){
      this.resTheme.teamPlay=true;
    }
    if(theme === '디저트'){
      this.resTheme.dessert=true;
    }
    if(theme === '브런치'){
      this.resTheme.brunch=true;
    }
    if(theme === '야식'){
      this.resTheme.nightMeal=true;
    }
  }

  // 등록버튼을 눌렀을 때
  UploadResInfo() {
    if ( this.UploadDataCheck() ) { // 모든 칸이 빠짐없이 작성된 경우 업로드

      // 데이터베이스 업로드
      this.item = this.fireDB.object('/Korea/res_info/' + this.resInfo.key );
      this.item.update( this.resInfo ).then((pushData) => {

        // 이미지 업로드
        if( this.exterImage != null){
          console.log("외부이미지 업로드");
          this.imgUpload(this.resInfo.res_name + '_1', this.exterImage, this.resInfo.key, 1); // 외부사진 업로드
        }
        if( this.interImage != null){
          console.log("내부이미지 업로드");
          this.imgUpload(this.resInfo.res_name + '_2', this.interImage, this.resInfo.key, 2); // 내부사진 업로드
        }

        // 테마 업로드
        this.fireDB.object('Korea/res_info/' + this.resInfo.key + '/res_theme').remove(); // 원래 꺼는 비운다
        this.themeUpload('Korea/res_info/' + this.resInfo.key + '/res_theme'); // 다시 올린다

        // 테마 연결관계 업로드
        this.themeRelationUpload('/Korea/re_theme_res/', this.resInfo.key);

        // 카테고리 연결관계 업로드
        if (this.resInfo.res_category === '카페/제과') { this.resInfo.res_category = '카페'; } // 슬래쉬 때문에 하위경로로 지정되어 버려서 이렇게함
        this.fireDB.object('/Korea/re_category_res/' + this.originalCategory + "/" + this.resInfo.key ).remove(); // 원래 카테고리는 삭제
        const categoryData = { };
          categoryData[this.resInfo.key] = true;
          this.item = this.fireDB.object('/Korea/re_category_res/' + this.resInfo.res_category);
          this.item.update(categoryData);



          alert("업로드 완료");

          // 메인으로 복귀
          this.router.navigate(['reslist']);
      });

    }// if문(모든 칸이 다 찼는지)
  }

  // res_info안의 res_theme 업로드
  themeUpload(path: string) {

    if (this.resTheme.withJunior === true) {
      this.item2 = this.fireDB.object(path);
      const themeData = { }; themeData['후배밥약'] = true; this.item2.update(themeData);
    }else{
      this.fireDB.object(path + '/후배밥약').remove();
    }

    if (this.resTheme.eatSolo === true) {
      this.item2 = this.fireDB.object(path);
      const themeData = { }; themeData['혼밥러'] = true; this.item2.update(themeData);
    }else{
      this.fireDB.object(path + '/혼밥러').remove();
    }

    if (this.resTheme.love === true) {
      this.item2 = this.fireDB.object(path);
      const themeData = { }; themeData['썸&연인'] = true; this.item2.update(themeData);
    }else{
      this.fireDB.object(path + '/썸&연인').remove();
    }

    if (this.resTheme.brother === true) {
      this.item2 = this.fireDB.object(path);
      const themeData = { }; themeData['브로맨스'] = true; this.item2.update(themeData);
    }else{
      this.fireDB.object(path + '/브로맨스').remove();
    }

    if (this.resTheme.sister === true) {
      this.item2 = this.fireDB.object(path);
      const themeData = { }; themeData['시스터즈'] = true; this.item2.update(themeData);
    }else{
      this.fireDB.object(path + '/시스터즈').remove();
    }

    if (this.resTheme.run === true) {
      this.item2 = this.fireDB.object(path);
      const themeData = { }; themeData['달려보자'] = true; this.item2.update(themeData);
    }else{
      this.fireDB.object(path + '/달려보자').remove();
    }

    if (this.resTheme.afterParty === true) {
      this.item2 = this.fireDB.object(path);
      const themeData = { }; themeData['뒷풀이'] = true; this.item2.update(themeData);
    }else{
      this.fireDB.object(path + '/뒷풀이').remove();
    }

    if (this.resTheme.feelSoGood === true) {
      this.item2 = this.fireDB.object(path);
      const themeData = { }; themeData['알딸딸'] = true; this.item2.update(themeData);
    }else{
      this.fireDB.object(path + '/알딸딸').remove();
    }

    if (this.resTheme.homeRice === true) {
      this.item2 = this.fireDB.object(path);
      const themeData = { }; themeData['집밥'] = true; this.item2.update(themeData);
    }else{
      this.fireDB.object(path + '/집밥').remove();
    }

    if (this.resTheme.wellBeing === true) {
      this.item2 = this.fireDB.object(path);
      const themeData = { }; themeData['웰빙'] = true; this.item2.update(themeData);
    }else{
      this.fireDB.object(path + '/웰빙').remove();
    }

    if (this.resTheme.study === true) {
      this.item2 = this.fireDB.object(path);
      const themeData = { }; themeData['공부'] = true; this.item2.update(themeData);
    }else{
      this.fireDB.object(path + '/공부').remove();
    }

    if (this.resTheme.teamPlay === true) {
      this.item2 = this.fireDB.object(path);
      const themeData = { }; themeData['팀플'] = true; this.item2.update(themeData);
    }else{
      this.fireDB.object(path + '/팀플').remove();
    }

    if (this.resTheme.dessert === true) {
      this.item2 = this.fireDB.object(path);
      const themeData = { }; themeData['디저트'] = true; this.item2.update(themeData);
    }else{
      this.fireDB.object(path + '/디저트').remove();
    }

    if (this.resTheme.brunch === true) {
      this.item2 = this.fireDB.object(path);
      const themeData = { }; themeData['브런치'] = true; this.item2.update(themeData);
    }else{
      this.fireDB.object(path + '/브런치').remove();
    }

    if (this.resTheme.nightMeal === true) {
      this.item2 = this.fireDB.object(path);
      const themeData = { }; themeData['야식'] = true; this.item2.update(themeData);
    }else{
      this.fireDB.object(path + '/야식').remove();
    }
  }

  // 저장소와 데이터베이스에 사진을 업로드
  imgUpload (fileName: string, fileData: File, dbPushKey: string, num: number) {

    const storage = firebase.storage(); // Get a reference to the storage service, which is used to create references in your storage bucket
    const storageRef = storage.ref(); // Create a storage reference from our storage service

    // 식당사진을 저장소에 업로드
    const ImgPath = 'res_images/' + fileName;
    const ImgRef = storageRef.child( ImgPath );
    ImgRef.put(fileData).then(snapshot => {

      console.log('사진경로: ' + snapshot.downloadURL );

      // 콜백으로 업로드한 사진의 경로를 받아서 DB에 업로드
      const imageKeyName: string = 'image' + num;
      this.item = this.fireDB.object('/Korea/res_info/' + dbPushKey + '/image');

      if (num === 1) {
        this.item.update({ image1 : snapshot.downloadURL });
      }else if (num === 2) {
        this.item.update({ image2 : snapshot.downloadURL });
      }

    });
}

  // 식당제목 실시간 중복체크
  resNameCheck() {
    this.resNameOverlap = false;



    const Ref = firebase.database().ref('Korea/res_info');
    Ref.orderByChild('res_name').equalTo(this.resInfo.res_name).once('child_added').then(data => {
      console.log("이름중복체크2");

      if (data.val().res_name !== '') {
        this.resNameOverlap = true;
      }

      // 지금 이 식당의 이름은 중복에서 제외
      if (this.resInfo.res_name === this.activatedRoute.snapshot.params['id']){
        this.resNameOverlap = false;
      }
    });



  }

  // 평일시간을 토요일과 일요일에 복붙
  timeCopy() {
    this.resInfo.res_time.restime_sat = this.resInfo.res_time.restime_weekday;
    this.resInfo.res_time.restime_sun = this.resInfo.res_time.restime_weekday;
  }

  // 구글의 지오코더를 이용하여 위도와 경도를 찾는다
  locationSearch(loca: string) {

    console.log('지오코더 INPUT값: ' + loca);
    const address = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + loca;

    this.postsService.getPosts(address).subscribe(posts => {
      const parsingData = posts;

      // 정확한 주소와 위도, 경도를 객체에 입력
      this.resInfo.location = parsingData.results[0].formatted_address;
      this.resInfo.latitude = parsingData.results[0].geometry.location.lat.toString();
      this.resInfo.longitude = parsingData.results[0].geometry.location.lng.toString();
    });
  }

  // 외부이미지 선택
  exterImageSelect(event) {

    this.files = event.target.files;

    const fileSize: number =  this.files.item(0).size;
    if( fileSize/1024 > 600 ){
      alert("600kb보다 큽니다. 600kb 미만으로 업로드해주세요 (update되지 않습니다)");
    }else{
      this.exterImage = this.files.item(0);
    }
  }

  // 내부이미지 선택
  interImageSelect(event) {
    this.files = event.target.files;

    const fileSize: number =  this.files.item(0).size;
    if( fileSize/1024 > 600 ){
      alert("600kb보다 큽니다. 600kb 미만으로 업로드해주세요 (update되지 않습니다)");
    }else{
      this.interImage = this.files.item(0);
    }
  }

  // 데이터들이 제대로 입력되어있는지 체크
  UploadDataCheck() {

    if (this.resInfo.res_name === '') {
      this.alertModal('식당이름을 입력하세요');
    }else if (this.resNameOverlap) {
      this.alertModal('이미 등록되어 있는 식당이름입니다');
    }else if (this.resInfo.res_time.restime_weekday === '' || this.resInfo.res_time.restime_sat=== '' || this.resInfo.res_time.restime_sun === '') {
      this.alertModal('시간을 입력하세요');
    }else if (this.resInfo.phone === '') {
      this.alertModal('전화번호 입력하세요');
    }else if (this.resInfo.location === '' || this.resInfo.latitude === '') {
      this.alertModal('위치를 입력하세요');
    }else if (this.resInfo.res_category === '') {
      this.alertModal('카테고리를 입력하세요');
    }else {
      // 모든 값이 제대로 입력된 경우
      return true;
    }

    return false;
  }

  // 입력 빈칸이 있을 때 뜨는 모달
  alertModal(text: string) {
    this.modal.alert()
      .showClose(true)
      .title('빠뜨린 것이 있습니다!')
      .body(text)
      .open();
  }

  // re_theme_res 업로드
  themeRelationUpload(path: string, resKey: string) {

    if( this.resTheme.withJunior === true) {
      this.item = this.fireDB.object(path + '후배밥약');
      const themeData = { }; themeData[resKey] = true; this.item.update(themeData);
    }else {
      this.item = this.fireDB.object(path + '후배밥약' + '/' + resKey);
      this.item.remove();
    }

    if( this.resTheme.eatSolo === true) {
      this.item = this.fireDB.object(path + '혼밥러');
      const themeData = { }; themeData[resKey] = true; this.item.update(themeData);
    }else {
      this.item = this.fireDB.object(path + '혼밥러' + '/' + resKey);
      this.item.remove();
    }

    if( this.resTheme.love === true) {
      this.item = this.fireDB.object(path + '썸&연인');
      const themeData = { }; themeData[resKey] = true; this.item.update(themeData);
    }else {
      this.item = this.fireDB.object(path + '썸&연인' + '/' + resKey);
      this.item.remove();
    }

    if( this.resTheme.brother === true) {
      this.item = this.fireDB.object(path + '브로맨스');
      const themeData = { }; themeData[resKey] = true; this.item.update(themeData);
    }else {
      this.item = this.fireDB.object(path + '브로맨스' + '/' + resKey);
      this.item.remove();
    }

    if( this.resTheme.sister === true) {
      this.item = this.fireDB.object(path + '시스터즈');
      const themeData = { }; themeData[resKey] = true; this.item.update(themeData);
    }else {
      this.item = this.fireDB.object(path + '시스터즈' + '/' + resKey);
      this.item.remove();
    }

    if( this.resTheme.run === true) {
      this.item = this.fireDB.object(path + '달려보자');
      const themeData = { }; themeData[resKey] = true; this.item.update(themeData);
    }else {
      this.item = this.fireDB.object(path + '달려보자' + '/' + resKey);
      this.item.remove();
    }

    if( this.resTheme.afterParty === true) {
      this.item = this.fireDB.object(path + '뒷풀이');
      const themeData = { }; themeData[resKey] = true; this.item.update(themeData);
    }else {
      this.item = this.fireDB.object(path + '뒷풀이' + '/' + resKey);
      this.item.remove();
    }

    if( this.resTheme.feelSoGood === true) {
      this.item = this.fireDB.object(path + '알딸딸');
      const themeData = { }; themeData[resKey] = true; this.item.update(themeData);
    }else {
      this.item = this.fireDB.object(path + '알딸딸' + '/' + resKey);
      this.item.remove();
    }

    if( this.resTheme.homeRice === true) {
      this.item = this.fireDB.object(path + '집밥');
      const themeData = { }; themeData[resKey] = true; this.item.update(themeData);
    }else {
      this.item = this.fireDB.object(path + '집밥' + '/' + resKey);
      this.item.remove();
    }

    if( this.resTheme.wellBeing === true) {
      this.item = this.fireDB.object(path + '웰빙');
      const themeData = { }; themeData[resKey] = true; this.item.update(themeData);
    }else {
      this.item = this.fireDB.object(path + '웰빙' + '/' + resKey);
      this.item.remove();
    }

    if( this.resTheme.study === true) {
      this.item = this.fireDB.object(path + '공부');
      const themeData = { }; themeData[resKey] = true; this.item.update(themeData);
    }else {
      this.item = this.fireDB.object(path + '공부' + '/' + resKey);
      this.item.remove();
    }

    if( this.resTheme.teamPlay === true) {
      this.item = this.fireDB.object(path + '팀플');
      const themeData = { }; themeData[resKey] = true; this.item.update(themeData);
    }else {
      this.item = this.fireDB.object(path + '팀플' + '/' + resKey);
      this.item.remove();
    }

    if( this.resTheme.dessert === true) {
      this.item = this.fireDB.object(path + '디저트');
      const themeData = { }; themeData[resKey] = true; this.item.update(themeData);
    }else {
      this.item = this.fireDB.object(path + '디저트' + '/' + resKey);
      this.item.remove();
    }

    if( this.resTheme.brunch === true) {
      this.item = this.fireDB.object(path + '브런치');
      const themeData = { }; themeData[resKey] = true; this.item.update(themeData);
    }else {
      this.item = this.fireDB.object(path + '브런치' + '/' + resKey);
      this.item.remove();
    }

    if( this.resTheme.nightMeal === true) {
      this.item = this.fireDB.object(path + '야식');
      const themeData = { }; themeData[resKey] = true; this.item.update(themeData);
    }else {
      this.item = this.fireDB.object(path + '야식' + '/' + resKey);
      this.item.remove();
    }
  }

}




