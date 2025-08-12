import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchoolEntity } from './entities/school.entity';
import { SchoolRepository } from '../schools.repository';
import { SchoolsRelationalRepository } from './repositories/schools.repository';

@Module({
  imports: [TypeOrmModule.forFeature([SchoolEntity])],
  providers: [
    {
      provide: SchoolRepository,
      useClass: SchoolsRelationalRepository,
    },
  ],
  exports: [SchoolRepository], // 👈 this is what SchoolsModule will use
})
export class RelationalSchoolPersistenceModule {}
