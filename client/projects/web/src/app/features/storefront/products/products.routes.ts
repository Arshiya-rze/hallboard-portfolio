import { Routes } from "@angular/router";

export const PRODUCTS_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('./components/product-list/product-list')
                .then(m => m.ProductList)
    },
    {
        path: ':id',
        loadComponent: () =>
            import('./components/product-detail/product-detail')
                .then(m => m.ProductDetail)
    }
];
