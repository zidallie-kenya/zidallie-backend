import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { DailyRideKind, DailyRideStatus } from '../../utils/types/enums';
import { DailyRideMetaDto } from './daily-ride-meta.dto';

class RelationDto {
  @IsNotEmpty()
  id: number;
}

// Custom date transform function
const transformDate = ({ value }: { value: string }) => {
  if (!value) return value;

  // Check if it's already in ISO format
  if (value.includes('T') || value.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return value;
  }

  // Handle MM/DD/YYYY format
  const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const match = value.match(dateRegex);

  if (match) {
    const [, month, day, year] = match;
    // Convert to ISO format YYYY-MM-DD
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  return value;
};

const transformDateTime = ({ value }: { value: string }) => {
  if (!value) return value;

  // Check if it's already in ISO format
  if (value.includes('T')) {
    return value;
  }

  // Handle MM/DD/YYYY format by converting to ISO datetime
  const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const match = value.match(dateRegex);

  if (match) {
    const [, month, day, year] = match;
    // Convert to ISO format with default time
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00.000Z`;
  }

  return value;
};

export class CreateDailyRideDto {
  @ValidateNested()
  @Type(() => RelationDto)
  @IsNotEmpty()
  ride: RelationDto;

  @ValidateNested()
  @Type(() => RelationDto)
  @IsNotEmpty()
  vehicle: RelationDto;

  @ValidateNested()
  @Type(() => RelationDto)
  @IsOptional()
  driver?: RelationDto;

  @IsEnum(DailyRideKind)
  @IsNotEmpty()
  kind: DailyRideKind;

  @Transform(transformDate)
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @Transform(transformDateTime)
  @IsOptional()
  @IsDateString()
  start_time?: string;

  @Transform(transformDateTime)
  @IsOptional()
  @IsDateString()
  end_time?: string;

  @IsOptional()
  comments?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => DailyRideMetaDto)
  meta?: DailyRideMetaDto;

  @IsEnum(DailyRideStatus)
  @IsOptional()
  status?: DailyRideStatus;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RelationDto)
  locations?: RelationDto[];
}
