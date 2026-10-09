import { Routes } from "@angular/router";

export const ACCOUNT_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => 
            import('./profile/components/profile/profile')
                .then(m => m.Profile)
    }
];
