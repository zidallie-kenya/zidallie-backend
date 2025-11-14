// payment_terms/infrastructure/persistence/relational/repositories/payment_term.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentTermEntity } from '../entities/payment_term.entity';
import { PaymentTermMapper } from '../mappers/payment_term.mapper';
import { PaymentTerm } from '../../../../domain/payment_term';

@Injectable()
export class PaymentTermRepository {
  constructor(
    @InjectRepository(PaymentTermEntity)
    private readonly repository: Repository<PaymentTermEntity>,
  ) {}

  async findById(id: number): Promise<PaymentTerm | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['school'],
    });
    return entity ? PaymentTermMapper.toDomain(entity) : null;
  }

  async getActiveTerm(schoolId: number): Promise<PaymentTerm | null> {
    const currentDate = new Date();
    const entity = await this.repository.findOne({
      where: {
        school: { id: schoolId },
        is_active: true,
        start_date: { $lte: currentDate } as any,
        end_date: { $gte: currentDate } as any,
      } as any,
      order: { start_date: 'DESC' },
    });

    return entity ? PaymentTermMapper.toDomain(entity) : null;
  }

  async getZidallieTerm(): Promise<PaymentTerm | null> {
    // Get Zidallie's active term (school_id is null for Zidallie-managed terms)
    const currentDate = new Date();
    const entity = await this.repository.findOne({
      where: {
        school: null,
        is_active: true,
        start_date: { $lte: currentDate } as any,
        end_date: { $gte: currentDate } as any,
      } as any,
      order: { start_date: 'DESC' },
    });

    return entity ? PaymentTermMapper.toDomain(entity) : null;
  }

  async create(data: {
    schoolId?: number | null;
    name: string;
    start_date: Date;
    end_date: Date;
    is_active?: boolean;
  }): Promise<PaymentTerm> {
    const term = this.repository.create({
      school: data.schoolId ? { id: data.schoolId } : null,
      name: data.name,
      start_date: data.start_date,
      end_date: data.end_date,
      is_active: data.is_active ?? true,
    });
    const saved = await this.repository.save(term);
    return PaymentTermMapper.toDomain(saved);
  }

  async findAll(schoolId?: number): Promise<PaymentTerm[]> {
    let entities: PaymentTermEntity[];
    if (schoolId) {
      entities = await this.repository.find({
        where: { school: { id: schoolId } },
        relations: ['school'],
        order: { start_date: 'DESC' },
      });
    } else {
      entities = await this.repository.find({
        relations: ['school'],
        order: { start_date: 'DESC' },
      });
    }
    return entities.map((entity) => PaymentTermMapper.toDomain(entity));
  }

  async update(
    id: number,
    data: Partial<PaymentTermEntity>,
  ): Promise<PaymentTerm | null> {
    await this.repository.update(id, data);
    return this.findById(id);
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }
}
