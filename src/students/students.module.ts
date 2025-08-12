// students/students.module.ts
import { Module } from '@nestjs/common';
import { StudentsService } from './students.service';
import { StudentsController } from './students.controller';
import { RelationalStudentPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { SchoolsModule } from '../schools/schools.module';
import { RelationalUserPersistenceModule } from '../users/infrastructure/persistence/relational/relational-persistence.module';

@Module({
  imports: [
    RelationalStudentPersistenceModule,
    SchoolsModule,
    RelationalUserPersistenceModule,
  ], // <-- make sure this is here
  controllers: [StudentsController],
  providers: [StudentsService],
  exports: [StudentsService],
})
export class StudentsModule {}
