import { PartialType } from '@nestjs/swagger';
import { CreateRediDto } from './create-redis.dto';

export class UpdateRediDto extends PartialType(CreateRediDto) {}
