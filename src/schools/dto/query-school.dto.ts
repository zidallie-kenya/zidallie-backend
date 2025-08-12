import { ApiPropertyOptional } from '@nestjs/swagger';
import { ApiProperty } from '@nestjs/swagger';

export class FilterSchoolDto {
  @ApiPropertyOptional({
    type: String,
    description: 'Filter by partial school name',
  })
  name?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Filter by partial location',
  })
  location?: string;
}

export class SortSchoolDto {
  @ApiProperty({ description: 'Field to order by', example: 'name' })
  orderBy: string;

  @ApiProperty({
    description: 'Sort direction',
    enum: ['ASC', 'DESC'],
    example: 'ASC',
  })
  order: 'ASC' | 'DESC';
}
