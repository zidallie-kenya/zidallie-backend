import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentKind, TransactionType } from '../../utils/types/enums';

export class FilterPaymentDto {
  @ApiPropertyOptional({ type: Number })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  userId?: number;

  @ApiPropertyOptional({ enum: PaymentKind })
  @IsEnum(PaymentKind)
  @IsOptional()
  kind?: PaymentKind;

  @ApiPropertyOptional({ enum: TransactionType })
  @IsEnum(TransactionType)
  @IsOptional()
  transaction_type?: TransactionType;

  @ApiPropertyOptional({ type: String })
  @IsString()
  @IsOptional()
  transaction_id?: string;

  @ApiPropertyOptional({ type: Number, example: 1000 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  minAmount?: number;

  @ApiPropertyOptional({ type: Number, example: 5000 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  maxAmount?: number;
}

export class SortPaymentDto {
  @ApiPropertyOptional({
    enum: ['amount', 'created_at', 'updated_at'],
    example: 'created_at',
  })
  @IsString()
  @IsOptional()
  orderBy?: 'amount' | 'created_at' | 'updated_at';

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], example: 'DESC' })
  @IsString()
  @IsOptional()
  order?: 'ASC' | 'DESC';
}

export class QueryPaymentDto {
  @ApiPropertyOptional({ type: Number, default: 1 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ type: Number, default: 10, maximum: 50 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({ type: FilterPaymentDto })
  @ValidateNested()
  @Type(() => FilterPaymentDto)
  @IsOptional()
  filters?: FilterPaymentDto;

  @ApiPropertyOptional({ type: [SortPaymentDto] })
  @ValidateNested({ each: true })
  @Type(() => SortPaymentDto)
  @IsOptional()
  sort?: SortPaymentDto[];
}
