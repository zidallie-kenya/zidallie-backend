// routes/infrastructure/persistence/route.repository.ts
import { Route } from '../../domain/route';
import { RouteStop } from '../../domain/route-stop';
import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { FilterRouteDto, SortRouteDto } from '../../dto/query-route.dto';

export abstract class RouteRepository {
  abstract findById(id: Route['id']): Promise<NullableType<Route>>;

  abstract findManyWithPagination(params: {
    filterOptions?: FilterRouteDto | null;
    sortOptions?: SortRouteDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Route[]>;

  abstract findFlagged(term: string): Promise<Route[]>;

  abstract create(
    data: Omit<Route, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<Route>;

  abstract update(
    id: Route['id'],
    payload: Partial<Route>,
  ): Promise<Route | null>;

  abstract remove(id: Route['id']): Promise<void>;

  // Stops are always read/written through their parent route, never as an
  // independently addressable resource — matches how the driver app and
  // admin review screen both consume them (a whole ordered list at a time).
  abstract saveStops(
    routeId: Route['id'],
    stops: Omit<RouteStop, 'id' | 'created_at'>[],
  ): Promise<RouteStop[]>;

  abstract updateStopStatus(
    stopId: RouteStop['id'],
    status: RouteStop['status'],
    actualArrival?: Date,
  ): Promise<RouteStop | null>;
}
