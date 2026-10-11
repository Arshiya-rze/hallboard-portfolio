import { Pagination } from "./models/pagination-model";

export class PaginatedResult<T> {
    pagination?: Pagination; // api's response pagination values
    items?: T[]; // api's response body
}
