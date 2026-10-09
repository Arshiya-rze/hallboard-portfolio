import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadChildren: () =>
            import('./features/storefront/storefront.routes')
                .then(m => m.STOREFRONT_ROUTES),
    },
    {
        path: '**',
        loadComponent: () =>
            import('./core/http/errors/components/not-found/not-found')
                .then(m => m.NotFound)
    }
];
