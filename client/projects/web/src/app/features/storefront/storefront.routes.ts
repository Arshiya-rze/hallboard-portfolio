import { Routes } from "@angular/router";

export const STOREFRONT_ROUTES: Routes = [
    {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
            import('./home/components/home/home')
                .then(m => m.Home)
    },
];
