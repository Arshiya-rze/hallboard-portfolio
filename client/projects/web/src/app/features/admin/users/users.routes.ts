import { Routes } from "@angular/router";

export const USERS_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => 
            import('./components/user-list/user-list')
                .then(m => m.UserList)
    },
    {
        path: ':id',
        loadComponent: () => 
            import('./components/user-detail/user-detail')
                .then(m => m.UserDetail)
    }
];
