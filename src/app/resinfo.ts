
export class ResInfo {

  key: string;

  constructor() {
    this.res_time = new ResTime();
    this.image = new ResImage();
    // this.res_theme = [];
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

  // res_theme: any[];

  // res_themes: ResTheme; //이것도
  // menu_id : MenuId; //폴더만 생성되지 않으니 이 부분은 메뉴를 입력하는 부분에서 설정
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

// 초반에 생각없이 따로 만든것
export class ResThemeMatching {
  withJunior: boolean;
  eatSolo: boolean;
  love: boolean;
  brother: boolean;
  sister: boolean;
  run: boolean;
  afterParty: boolean;
  feelSoGood: boolean;
  homeRice: boolean;
  wellBeing: boolean;
  study: boolean;
  teamPlay: boolean;
  dessert: boolean;
  brunch: boolean;
  nightMeal: boolean;
}


