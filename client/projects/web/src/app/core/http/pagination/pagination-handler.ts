import { inject } from "@angular/core";
import { ApiClient } from "../api/api-client";
import { HttpParams } from "@angular/common/http";
import { PaginatedResult } from "./paginated-result";
import { map, Observable } from "rxjs";

export class PaginationHandler {
    private readonly _apiClient = inject(ApiClient);

    getPaginatedResult<T>(
        url: string,
        params: HttpParams,
    ): Observable<PaginatedResult<T>> {
        return this._apiClient
            .getHttpResponse<T[]>(url, params)
            .pipe(
                map(response => {
                    const result = new PaginatedResult<T>();

                    result.items = response.body ?? [];

                    const paginationHeader =
                        response.headers.get('Pagination');

                    if (paginationHeader) {
                        result.pagination =
                            JSON.parse(paginationHeader);
                    }

                    return result;
                }),
            );
    }
}