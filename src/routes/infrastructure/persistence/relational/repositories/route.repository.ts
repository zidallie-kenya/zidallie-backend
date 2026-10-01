// routes/infrastructure/persistence/relational/repositories/route.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RouteRepository } from '../../route.repository';
import { Route } from '../../../../domain/route';
import { RouteStop } from '../../../../domain/route-stop';
import { RouteEntity } from '../entities/route.entity';
import { RouteStopEntity } from '../entities/route-stop.entity';
import { RouteMapper, RouteStopMapper } from '../mappers/route.mapper';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';
import { FilterRouteDto, SortRouteDto } from '../../../../dto/query-route.dto';

@Injectable()
export class RouteRelationalRepository implements RouteRepository {
  constructor(
    @InjectRepository(RouteEntity)
    private readonly routeRepo: Repository<RouteEntity>,
    @InjectRepository(RouteStopEntity)
    private readonly stopRepo: Repository<RouteStopEntity>,
  ) {}

  async findById(id: number): Promise<NullableType<Route>> {
    const entity = await this.routeRepo.findOne({
      where: { id },
      relations: [
        'driver',
        'vehicle',
        'carpool_school',
        'bus_school',
        'stops',
        'stops.student',
        'stops.booking_child',
        'stops.pickup_station',
      ],
    });
    return entity ? RouteMapper.toDomain(entity) : null;
  }

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterRouteDto | null;
    sortOptions?: SortRouteDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Route[]> {
    const qb = this.routeRepo
      .createQueryBuilder('route')
      .leftJoinAndSelect('route.driver', 'driver')
      .leftJoinAndSelect('route.vehicle', 'vehicle')
      .leftJoinAndSelect('route.carpool_school', 'carpool_school')
      .leftJoinAndSelect('route.bus_school', 'bus_school');

    if (filterOptions?.term)
      qb.andWhere('route.term = :term', { term: filterOptions.term });
    if (filterOptions?.status)
      qb.andWhere('route.status = :status', { status: filterOptions.status });
    if (filterOptions?.kind)
      qb.andWhere('route.kind = :kind', { kind: filterOptions.kind });
    if (filterOptions?.service_type)
      qb.andWhere('route.service_type = :serviceType', {
        serviceType: filterOptions.service_type,
      });
    if (filterOptions?.trip_date)
      qb.andWhere('route.trip_date = :tripDate', {
        tripDate: filterOptions.trip_date,
      });

    (sortOptions ?? [{ orderBy: 'created_at', order: 'DESC' }]).forEach((s) =>
      qb.addOrderBy(`route.${String(s.orderBy)}`, s.order),
    );

    qb.skip((paginationOptions.page - 1) * paginationOptions.limit).take(
      paginationOptions.limit,
    );

    const entities = await qb.getMany();
    return entities.map(RouteMapper.toDomain);
  }

  async findFlagged(term: string): Promise<Route[]> {
    const entities = await this.routeRepo.find({
      where: { term: term as any, status: 'flagged' },
      relations: ['carpool_school', 'bus_school'],
    });
    return entities.map(RouteMapper.toDomain);
  }

  async create(
    data: Omit<Route, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<Route> {
    const entity = this.routeRepo.create(RouteMapper.toEntity(data));
    const saved = await this.routeRepo.save(entity);
    return RouteMapper.toDomain(saved);
  }

  async update(id: number, payload: Partial<Route>): Promise<Route | null> {
    const entity = await this.routeRepo.findOne({ where: { id } });
    if (!entity) return null;
    const merged = this.routeRepo.merge(entity, RouteMapper.toEntity(payload));
    const saved = await this.routeRepo.save(merged);
    return RouteMapper.toDomain(saved);
  }

  async remove(id: number): Promise<void> {
    await this.routeRepo.softDelete(id);
  }

  async saveStops(
    routeId: number,
    stops: Omit<RouteStop, 'id' | 'created_at'>[],
  ): Promise<RouteStop[]> {
    const entities = stops.map((s) =>
      this.stopRepo.create({
        ...RouteStopMapper.toEntity(s),
        route: { id: routeId } as any,
      }),
    );
    const saved = await this.stopRepo.save(entities);
    return saved.map(RouteStopMapper.toDomain);
  }

  async updateStopStatus(
    stopId: number,
    status: RouteStop['status'],
    actualArrival?: Date,
  ): Promise<RouteStop | null> {
    const entity = await this.stopRepo.findOne({ where: { id: stopId } });
    if (!entity) return null;
    entity.status = status;
    if (actualArrival) entity.actual_arrival = actualArrival;
    const saved = await this.stopRepo.save(entity);
    return RouteStopMapper.toDomain(saved);
  }
}
