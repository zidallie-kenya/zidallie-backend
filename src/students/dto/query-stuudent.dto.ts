import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Gender } from '../../utils/types/enums';
import { Student } from '../domain/student';

export class FilterStudentDto {
  @ApiPropertyOptional({ type: Number, description: 'Filter by School ID' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  schoolId?: number;

  @ApiPropertyOptional({
    type: Number,
    description: 'Filter by Parent User ID',
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  parentId?: number;

  @ApiPropertyOptional({
    type: String,
    description: 'Filter by partial name match',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: Gender, description: 'Filter by gender' })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({
    type: String,
    description: 'Filter by partial address match',
  })
  @IsOptional()
  @IsString()
  address?: string;
}

export class SortStudentDto {
  @ApiPropertyOptional({ description: 'Field to sort by', example: 'name' })
  @IsString()
  orderBy: keyof Student;

  @ApiPropertyOptional({
    description: 'Sort direction',
    enum: ['ASC', 'DESC'],
    example: 'ASC',
  })
  @IsEnum(['ASC', 'DESC'])
  order: 'ASC' | 'DESC';
}

export class QueryStudentDto {
  @ApiPropertyOptional({ description: 'Pagination page number', example: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    maximum: 50,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(50)
  limit?: number;

  @ApiPropertyOptional({
    type: FilterStudentDto,
    description: 'Filtering options',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => FilterStudentDto)
  filters?: FilterStudentDto | null;

  @ApiPropertyOptional({
    type: () => [SortStudentDto],
    description: 'Sorting options',
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SortStudentDto)
  sort?: SortStudentDto[] | null;
}
