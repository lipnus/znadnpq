import {Injectable} from '@angular/core';
import {Http, RequestOptions, Headers} from '@angular/http';
import 'rxjs/add/operator/map';

@Injectable()
export class PostsService {
  constructor(private http: Http) {
    console.log('PostsSrvice 초기화..');
  }


  // 입력받은 주소로 포스트한 결과값을 반환
  getPosts( address: string ) {
    return this.http.get(address).map(res => res.json());
  }


  // 서버로 보내기
  sendData( address: string, postData: string ) {

    console.log("접속경로: " + address + ", post:" + postData);

    const headers = new Headers({
      'Content-Type': 'application/x-www-form-urlencoded, multipart/form-data, text/plain'
    });

    const options = new RequestOptions({
      headers: headers
    });

    const body = "data=" + postData;

    return this.http.post( address, body, options ).map(response => response.json());
  }

}


