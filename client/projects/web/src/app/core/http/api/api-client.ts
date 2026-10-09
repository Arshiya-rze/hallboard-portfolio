import { HttpClient, HttpHeaders, HttpParams, httpResource, HttpResourceRef, HttpResponse } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';

@Service()
export class ApiClient {
    private readonly _http = inject(HttpClient);
    private readonly _env = environment.apiUrl;

    /**
    * Imperative, one-shot GET.
    */
    get<TResponse>(url: string): Observable<TResponse> {
        return this._http.get<TResponse>(this.buildUrl(url));
    }

    getText(url: string): Observable<string> {
        return this._http.get(this.buildUrl(url), {
            responseType: 'text',
        });
    }

    getWithQueryParams<TResponse>(
        url: string,
        queryParams: Record<
            string,
            string | number | boolean | readonly (string | number | boolean)[]
        >,
    ): Observable<TResponse> {
        let params = new HttpParams();

        Object.entries(queryParams).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                value.forEach((item) => {
                    params = params.append(key, String(item));
                });

                return;
            }

            params = params.set(key, String(value));
        });

        return this._http.get<TResponse>(this.buildUrl(url), {
            params,
        });
    }

    getHttpResponse<TResponse>(
        url: string,
        params?: HttpParams,
    ): Observable<HttpResponse<TResponse>> {
        return this._http.get<TResponse>(this.buildUrl(url), {
            observe: 'response',
            params,
        });
    }

    /**
    * Reactive GET whose URL may depend on signals.
    *
    * Returning undefined disables the request.
    */
    resource<TResponse>(
        relativeUrl: () => string | undefined
    ): HttpResourceRef<TResponse | undefined> {
        return httpResource<TResponse>(() => {
            const relative = relativeUrl();

            return relative
                ? this.buildUrl(relative)
                : undefined;
        });
    }

    post<TRequest, TResponse>(url: string, body: TRequest): Observable<TResponse> {
        return this._http.post<TResponse>(this.buildUrl(url), body);
    }

    postNoBody<TResponse>(url: string): Observable<TResponse> {
        return this._http.post<TResponse>(this.buildUrl(url), {});
    }

    postText<TRequest>(url: string, body: TRequest): Observable<string> {
        return this._http.post(this.buildUrl(url), body, {
            responseType: 'text',
        });
    }

    postTextNoBody(url: string): Observable<string> {
        return this._http.post(this.buildUrl(url), {}, {
            responseType: 'text',
        });
    }

    postWithHeaders<TRequest, TResponse>(url: string, body: TRequest, headers: HttpHeaders): Observable<TResponse> {
        return this._http.post<TResponse>(
            this.buildUrl(url),
            body,
            {
                headers,
            },
        );
    }

    put<TRequest, TResponse>(url: string, body: TRequest): Observable<TResponse> {
        return this._http.put<TResponse>(this.buildUrl(url), body);
    }

    putNoBody<TResponse>(url: string): Observable<TResponse> {
        return this._http.put<TResponse>(this.buildUrl(url), {});
    }

    putText<TRequest>(url: string, body: TRequest): Observable<string> {
        return this._http.put(this.buildUrl(url), body, {
            responseType: 'text',
        });
    }

    putTextNoBody(url: string): Observable<string> {
        return this._http.put(this.buildUrl(url), {}, {
            responseType: 'text',
        });
    }

    patch<TRequest, TResponse>(url: string, body: TRequest): Observable<TResponse> {
        return this._http.patch<TResponse>(this.buildUrl(url), body);
    }

    delete<TResponse>(url: string): Observable<TResponse> {
        return this._http.delete<TResponse>(this.buildUrl(url));
    }

    private buildUrl(url: string): string {
        return `${this._env}${url}`;
    }
}
