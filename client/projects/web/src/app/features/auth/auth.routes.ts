import { Routes } from "@angular/router";

export const AUTH_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('./login/components/login/login')
                .then(m => m.Login)
    },
    {
        path: 'login',
        loadComponent: () =>
            import('./login/components/login/login')
                .then(m => m.Login)
    },
    {
        path: 'register',
        loadComponent: () =>
            import('./register/components/register/register')
                .then(m => m.Register)
    },
    {
        path: 'reset-password',
        loadComponent: () =>
            import('./reset-password/components/reset-password/reset-password')
                .then(m => m.ResetPassword)
    }
];
