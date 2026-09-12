import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateStudentDto } from './dto/create-student.dto';
import { NullableType } from '../utils/types/nullable.type';
import { StudentRepository } from './infrastructure/persistence/student.repository';
import { Student } from './domain/student';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { UpdateStudentDto } from './dto/update-student.dto';
import { School } from '../schools/domain/schools';
import { User } from '../users/domain/user';
import { FilterStudentDto, SortStudentDto } from './dto/query-stuudent.dto';
import { SchoolEntity } from '../schools/infrastructure/persistence/relational/entities/school.entity';
import { UserEntity } from '../users/infrastructure/persistence/relational/entities/user.entity';
import { UserRepository } from '../users/infrastructure/persistence/user.repository';
import { SchoolsService } from '../schools/schools.service';
import { Gender } from '../utils/types/enums';

@Injectable()
export class StudentsService {
  constructor(
    private readonly studentsRepository: StudentRepository,
    private readonly usersService: UserRepository,
    private readonly schoolsService: SchoolsService,
  ) {}

  async create(createStudentDto: CreateStudentDto): Promise<Student> {
    // Validate school reference
    let school: SchoolEntity | null = null;
    if (createStudentDto.school?.id) {
      const schoolEntity = await this.schoolsService.findById(
        createStudentDto.school.id,
      );
      if (!schoolEntity) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: { school: 'this school does not exists' },
        });
      }
      school = { id: createStudentDto.school.id } as SchoolEntity;
    } else if (createStudentDto.school && !createStudentDto.school.id) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { school: 'the school is is missing' },
      });
    }

    // Validate parent reference
    let parent: UserEntity | null = null;
    if (createStudentDto.parent?.id) {
      const parentEntity = await this.usersService.findById(
        createStudentDto.parent.id,
      );
      if (!parentEntity || parentEntity.kind !== 'Parent') {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            parent: parentEntity
              ? 'This is not a parent'
              : 'this parent does not exists',
          },
        });
      }
      parent = { id: createStudentDto.parent.id } as UserEntity;
    } else if (createStudentDto.parent && !createStudentDto.parent.id) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { parent: 'the parentId is missing' },
      });
    }

    try {
      return await this.studentsRepository.create({
        name: createStudentDto.name ?? '',
        school,
        parent,
        profile_picture: createStudentDto.profile_picture ?? null,
        gender: createStudentDto.gender ?? Gender.Female,
        address: createStudentDto.address ?? null,
        comments: createStudentDto.comments ?? null,
        meta: createStudentDto.meta ?? null,
        // 🆕 Payment fields
        account_number: createStudentDto.account_number ?? null,
        daily_fee: createStudentDto.daily_fee ?? null,
        rfid_code: createStudentDto.rfid_code ?? null,
        phone_number: createStudentDto.phone_number ?? null,
        emergency_contact: createStudentDto.emergency_contact ?? null,
        transport_term_fee: createStudentDto.transport_term_fee ?? null,
        service_type: createStudentDto.service_type ?? null,
        rides: [],
        discount_code: createStudentDto.discount_code ?? null,
        discount_code_amount: createStudentDto.discount_code_amount ?? null,
        discount_code_expiry: createStudentDto.discount_code_expiry ?? null,
      });
    } catch (error: any) {
      console.error('Error creating student:', error);
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { student: 'student creation failed' },
        message: error.message,
      });
    }
  }

  findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterStudentDto | null;
    sortOptions?: SortStudentDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Student[]> {
    const defaultSort: SortStudentDto[] = sortOptions ?? [
      { orderBy: 'name', order: 'ASC' },
    ];
    return this.studentsRepository.findManyWithPagination({
      filterOptions,
      sortOptions: defaultSort,
      paginationOptions,
    });
  }

  findById(id: Student['id']): Promise<NullableType<Student>> {
    return this.studentsRepository.findById(id);
  }

  findByIds(ids: Student['id'][]): Promise<Student[]> {
    return this.studentsRepository.findByIds(ids);
  }

  findByParentId(parentId: number): Promise<Student[]> {
    return this.studentsRepository.findByParentId(parentId);
  }

  findBySchoolId(schoolId: number): Promise<Student[]> {
    return this.studentsRepository.findBySchoolId(schoolId);
  }

  searchByName(searchTerm: string): Promise<Student[]> {
    return this.studentsRepository.searchByName(searchTerm);
  }

  findByGender(gender: string): Promise<Student[]> {
    return this.studentsRepository.findByGender(gender);
  }

  findStudentsWithActiveRides(): Promise<Student[]> {
    return this.studentsRepository.findStudentsWithActiveRides();
  }

  findStudentsWithoutParent(): Promise<Student[]> {
    return this.studentsRepository.findStudentsWithoutParent();
  }

  /**
   * Used by the booking flow to link (or create) the canonical student
   * record for a booked child. Matches by parent + normalized name so the
   * same child never ends up with two student rows. Callers that process
   * multiple children from one booking MUST await this one at a time
   * (not Promise.all) — see submitChildren in booking.service.ts — so that
   * two same-named children in one submission don't race past each other's
   * "does this already exist?" check.
   */

  // async findOrCreateForBooking(params: {
  //   parentId: number;
  //   name: string;
  //   schoolId?: number | null;
  //   serviceType?: string | null;
  // }): Promise<Student> {
  //   const normalizedName = params.name.trim().toLowerCase();

  //   const existing = await this.findByParentId(params.parentId);
  //   const match = existing.find(
  //     (s) => (s.name ?? '').trim().toLowerCase() === normalizedName,
  //   );

  //   if (match) {
  //     // Keep school in sync if it changed since the student was created
  //     if (params.schoolId && match.school?.id !== params.schoolId) {
  //       return this.update(match.id, {
  //         school: { id: params.schoolId } as School,
  //       }) as Promise<Student>;
  //     }
  //     return match;
  //   }

  //   return this.create({
  //     name: params.name.trim(),
  //     parent: { id: params.parentId } as User,
  //     school: params.schoolId ? ({ id: params.schoolId } as School) : undefined,
  //     service_type: (params.serviceType ?? undefined) as any,
  //     gender: 'Female', // Default gender to Female
  //   } as CreateStudentDto);
  // }

  /**
   * Plain Levenshtein edit distance — small, dependency-free, fine for
   * short human names.
   */
  private levenshtein(a: string, b: string): number {
    const m = a.length;
    const n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;

    const prev = new Array(n + 1);
    const curr = new Array(n + 1);
    for (let j = 0; j <= n; j++) prev[j] = j;

    for (let i = 1; i <= m; i++) {
      curr[0] = i;
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        curr[j] = Math.min(
          prev[j] + 1, // deletion
          curr[j - 1] + 1, // insertion
          prev[j - 1] + cost, // substitution
        );
      }
      for (let j = 0; j <= n; j++) prev[j] = curr[j];
    }

    return prev[n];
  }

  private normalizePhone(phone: string | null | undefined): string | null {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, '');
    if (!digits) return null;
    // Normalize 07xx / 01xx / 7xx / 254xx variants down to the last 9 digits
    // so "0712345678" and "254712345678" compare equal.
    return digits.slice(-9);
  }

  /**
   * Used by the booking flow to link (or create) the canonical student
   * record for a booked child. Matches by parent + normalized name so the
   * same child never ends up with two student rows on an exact match.
   *
   * Callers processing multiple children from one booking MUST await this
   * one at a time (not Promise.all) — see submitChildren in
   * booking.service.ts — so two same-named children in one submission don't
   * race past each other's "does this already exist?" check.
   */
  async findOrCreateForBooking(params: {
    parentId: number;
    name: string;
    schoolId?: number | null;
    serviceType?: string | null;
    emergencyContactPhone?: string | null;
  }): Promise<Student> {
    const normalizedName = params.name.trim().toLowerCase();
    const normalizedPhone = this.normalizePhone(params.emergencyContactPhone);

    const existing = await this.findByParentId(params.parentId);

    // 1. Exact match — safe to auto-link.
    const exactMatch = existing.find(
      (s) => (s.name ?? '').trim().toLowerCase() === normalizedName,
    );

    if (exactMatch) {
      if (params.schoolId && exactMatch.school?.id !== params.schoolId) {
        const updated = await this.update(exactMatch.id, {
          school: { id: params.schoolId } as School,
        });
        return updated ?? exactMatch;
      }
      return exactMatch;
    }

    // 2. No exact match — look for a fuzzy candidate to flag, but never
    //    auto-link on this. A wrong auto-link silently mixes up two
    //    children's records, which is worse than a duplicate row.
    const fuzzyCandidate = existing.find((s) => {
      const candidateName = (s.name ?? '').trim().toLowerCase();
      const nameClose =
        candidateName.length > 0 &&
        this.levenshtein(normalizedName, candidateName) <= 2;

      console.log(
        `Comparing new student "${normalizedName}" with existing "${candidateName}": nameClose=${nameClose}`,
      );

      const candidatePhone = this.normalizePhone(s.phone_number);
      const phoneMatches =
        !!normalizedPhone &&
        !!candidatePhone &&
        normalizedPhone === candidatePhone;

      console.log(
        `Comparing new student phone "${normalizedPhone}" with existing "${candidatePhone}": phoneMatches=${phoneMatches}`,
      );
      return nameClose || phoneMatches;
    });

    const newStudent = await this.create({
      name: params.name.trim(),
      parent: { id: params.parentId } as User,
      school: params.schoolId ? ({ id: params.schoolId } as School) : undefined,
      service_type: (params.serviceType ?? undefined) as any,
      phone_number: params.emergencyContactPhone ?? null,
      // gender intentionally omitted — not collected during booking
    } as CreateStudentDto);

    if (fuzzyCandidate) {
      console.warn(
        `Possible duplicate student: new id=${newStudent.id} ("${params.name}") ` +
          `may be the same child as existing id=${fuzzyCandidate.id} ("${fuzzyCandidate.name}") ` +
          `for parent ${params.parentId}. Flagging for admin review.`,
      );

      const flagged = await this.update(newStudent.id, {
        meta: {
          ...(newStudent.meta ?? {}),
          possible_duplicate_of: fuzzyCandidate.id,
          possible_duplicate_flagged_at: new Date().toISOString(),
          possible_duplicate_resolved: false,
        },
      } as UpdateStudentDto);

      return flagged ?? newStudent;
    }

    return newStudent;
  }

  /**
   * Admin-facing: list students flagged as possible duplicates that
   * haven't been reviewed yet.
   */
  async findPossibleDuplicates(): Promise<
    { student: Student; possibleDuplicateOfId: number }[]
  > {
    // Pulled via pagination helper since StudentRepository doesn't expose a
    // raw "all students" query — adjust paginationOptions/limit as needed
    // for your actual student volume, or add a dedicated repository method
    // backed by a `meta @> '{"possible_duplicate_resolved": false}'` query
    // if the table grows large enough that this becomes slow.
    const all = await this.findManyWithPagination({
      filterOptions: null,
      sortOptions: null,
      paginationOptions: { page: 1, limit: 1000 },
    });

    return all
      .filter(
        (s) =>
          s.meta?.possible_duplicate_of != null &&
          s.meta?.possible_duplicate_resolved !== true,
      )
      .map((s) => ({
        student: s,
        possibleDuplicateOfId: s.meta.possible_duplicate_of as number,
      }));
  }

  /**
   * Admin-facing: clear a flag once reviewed. This only marks the flag
   * resolved — it does NOT merge the two student records (reassigning
   * their rides, subscriptions, or other bookings). If the two turn out to
   * genuinely be the same child, that merge is a separate, more involved
   * operation — flag it and we can build that action once you confirm what
   * "merge" should move.
   */
  async resolveDuplicateFlag(studentId: number): Promise<Student | null> {
    const student = await this.findById(studentId);
    if (!student) return null;

    return this.update(studentId, {
      meta: {
        ...(student.meta ?? {}),
        possible_duplicate_resolved: true,
      },
    } as UpdateStudentDto);
  }

  async update(
    id: Student['id'],
    updateStudentDto: UpdateStudentDto,
  ): Promise<Student | null> {
    const updateData: Partial<Student> = {};

    if (updateStudentDto.name !== undefined) {
      updateData.name = updateStudentDto.name;
    }

    if (updateStudentDto.school !== undefined) {
      if (updateStudentDto.school?.id) {
        updateData.school = {
          id: updateStudentDto.school.id,
        } as School;
      } else if (updateStudentDto.school === null) {
        updateData.school = null;
      }
    }

    if (updateStudentDto.parent !== undefined) {
      if (updateStudentDto.parent?.id) {
        updateData.parent = {
          id: updateStudentDto.parent.id,
        } as User;
      } else if (updateStudentDto.parent === null) {
        updateData.parent = null;
      }
    }

    if (updateStudentDto.profile_picture !== undefined) {
      updateData.profile_picture = updateStudentDto.profile_picture;
    }

    if (updateStudentDto.gender !== undefined) {
      updateData.gender = updateStudentDto.gender;
    }

    if (updateStudentDto.address !== undefined) {
      updateData.address = updateStudentDto.address;
    }

    if (updateStudentDto.comments !== undefined) {
      updateData.comments = updateStudentDto.comments;
    }

    if (updateStudentDto.meta !== undefined) {
      updateData.meta = updateStudentDto.meta;
    }

    // 🆕 Payment fields
    if (updateStudentDto.account_number !== undefined) {
      updateData.account_number = updateStudentDto.account_number;
    }

    if (updateStudentDto.daily_fee !== undefined) {
      updateData.daily_fee = updateStudentDto.daily_fee;
    }

    if (updateStudentDto.transport_term_fee !== undefined) {
      updateData.transport_term_fee = updateStudentDto.transport_term_fee;
    }

    if (updateStudentDto.rfid_code !== undefined) {
      updateData.rfid_code = updateStudentDto.rfid_code;
    }

    if (updateStudentDto.phone_number !== undefined) {
      updateData.phone_number = updateStudentDto.phone_number;
    }

    if (updateStudentDto.service_type !== undefined) {
      updateData.service_type = updateStudentDto.service_type;
    }

    if (updateStudentDto.emergency_contact !== undefined) {
      updateData.emergency_contact = updateStudentDto.emergency_contact;
    }

    if (updateStudentDto.discount_code !== undefined) {
      updateData.discount_code = updateStudentDto.discount_code;
    }

    if (updateStudentDto.discount_code_expiry !== undefined) {
      updateData.discount_code_expiry = updateStudentDto.discount_code_expiry;
    }

    if (updateStudentDto.discount_code_amount !== undefined) {
      updateData.discount_code_amount = updateStudentDto.discount_code_amount;
    }

    return this.studentsRepository.update(id, updateData);
  }

  async remove(id: Student['id']): Promise<void> {
    await this.studentsRepository.remove(id);
  }
}
