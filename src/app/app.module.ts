import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';


// [Component]
import { AppComponent } from './app.component';
import { EnrollresComponent } from './enrollres.component';
import { ReslistComponent } from './reslist.component';
import { MenulistComponent } from './menulist.component';
import {ResmodifyComponent} from "./resmodify.component";
import { ReviewlistComponent } from "./reviewlist.component";


// [Modal]
import { ModalModule } from 'angular2-modal';
import { BootstrapModalModule } from 'angular2-modal/plugins/bootstrap';

// [Firebase]
import { AngularFireModule } from 'angularfire2';
import { AngularFireDatabaseModule } from 'angularfire2/database';
import { AngularFireAuthModule } from 'angularfire2/auth';

// [Routing]
import {routing} from './app.routing';

// [Angular Meterial]
import {MdDialogModule} from '@angular/material';


// [Angular Metirial Animation]
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {LoginComponent} from "./login.component";
import {MoveComponent} from "./move.component";
import {UserlistComponent} from "./userlist.component";



// [Firebase] 이 정보들을 통해 내 데이터베이스와 연결
export const firebaseConfig = {
  apiKey: "AIzaSyCd9ZRlbJLmJUms4osw6J5i3VgE35Y4pXE",
  authDomain: "fireapp-9ef47.firebaseapp.com",
  databaseURL: "https://fireapp-9ef47.firebaseio.com",
  projectId: "fireapp-9ef47",
  storageBucket: "fireapp-9ef47.appspot.com",
  messagingSenderId: "439474738049",
};


@NgModule({
  declarations: [
    AppComponent,
    EnrollresComponent,
    ReslistComponent,
    MenulistComponent,
    LoginComponent,
    ResmodifyComponent,
    MoveComponent,
    ReviewlistComponent,
    UserlistComponent,
  ],

  // entryComponents: [DialogResultExampleDialog],

  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    AngularFireModule.initializeApp(firebaseConfig), // [Firebase]
    AngularFireDatabaseModule, // [Firebase]
    AngularFireAuthModule, // [Firebase]
    routing, // [Routing]
    ModalModule.forRoot(), // [Modal]
    BootstrapModalModule,  // [Modal]
    BrowserAnimationsModule, // [Angular Metirial Animation]
    MdDialogModule, // [Angular Meterial]
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
