import { Module } from '@nestjs/common';
import { StudentRepository } from '../student.repository';
import { StudentsRelationalRepository } from './repositories/students.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentEntity } from './entities/student.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StudentEntity])],
  providers: [
    {
      provide: StudentRepository,
      useClass: StudentsRelationalRepository,
    },
  ],
  exports: [StudentRepository],
})
export class RelationalStudentPersistenceModule {}
