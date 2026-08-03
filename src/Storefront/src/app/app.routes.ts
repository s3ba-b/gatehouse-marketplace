import { Routes } from '@angular/router';

import { Home } from './pages/home/home';
import { Login } from './pages/login/login';
import { Products } from './pages/products/products';
import { Registration } from './pages/registration/registration';
import { Verification } from './pages/verification/verification';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'registration', component: Registration },
  { path: 'login', component: Login },
  { path: 'products', component: Products },
  { path: 'verification', component: Verification },
];
