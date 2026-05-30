import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then(m => m.HomeComponent),
  },
  {
    path: 'cart',
    loadComponent: () => import('./pages/cart/cart').then(m => m.CartComponent),
  },
  {
    path: 'admin/login',
    loadComponent: () => import('./pages/admin/login/admin-login').then(m => m.AdminLoginComponent),
  },
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin/layout/admin-layout').then(m => m.AdminLayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/admin/dashboard/admin-dashboard').then(m => m.AdminDashboardComponent),
      },
      {
        path: 'products',
        loadComponent: () => import('./pages/admin/products/admin-products').then(m => m.AdminProductsComponent),
      },
      {
        path: 'orders',
        loadComponent: () => import('./pages/admin/orders/admin-orders').then(m => m.AdminOrdersComponent),
      },
      // 🌟 พิมพ์กล่องโปรโมชั่นนี้เพิ่มต่อท้ายเข้าไปเลยครับ! 
      {
        path: 'promotions',
        loadComponent: () => import('./pages/admin/promotions/promotions').then(m => m.PromotionsComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
