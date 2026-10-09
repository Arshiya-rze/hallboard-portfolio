import { Routes } from "@angular/router";

export const ADMIN_ROUTES: Routes = [
    {
        path: '', // mydomain.com/admin
        loadComponent: () =>
            import('./dashboard/components/dashboard/dashboard')
                .then(m => m.Dashboard)
    },
    {
        path: 'dashboard', // mydomain.com/admin/dashboard
        loadComponent: () =>
            import('./dashboard/components/dashboard/dashboard')
                .then(m => m.Dashboard)
    },
    {
        path: 'users',
        loadChildren: () =>
            import('./users/users.routes')
                .then(m => m.USERS_ROUTES)
    }
];
