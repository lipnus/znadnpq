import {ModuleWithProviders} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

import {AppComponent} from './app.component';
import {EnrollresComponent} from './enrollres.component';
import {ReslistComponent} from './reslist.component';
import {MenulistComponent} from './menulist.component';
import {LoginComponent} from "./login.component";
import {ResmodifyComponent} from "./resmodify.component";
import {MoveComponent} from "./move.component";
import {ReviewlistComponent} from "./reviewlist.component";
import {UserlistComponent} from "./userlist.component";


const appRoutes: Routes = [


  {
    path: '',
    component: LoginComponent
  },

  {
    path: 'reslist',
    component: ReslistComponent
  },

  {
    path: 'userlist',
    component: UserlistComponent
  },

  {
    path: 'resenroll',
    component: EnrollresComponent
  },

  {
    path: 'menulist/:id',
    component: MenulistComponent
  },

  {
    path: 'reviewlist/:id',
    component: ReviewlistComponent
  },

  {
    path: 'resmodify/:id',
    component: ResmodifyComponent,
  },

  {
    path: 'move',
    component: MoveComponent,
  },

  {
    path: 'app',
    component: AppComponent
  }

];

// export const routing: ModuleWithProviders = RouterModule.forRoot(appRoutes);
export const routing = RouterModule.forRoot(appRoutes);
