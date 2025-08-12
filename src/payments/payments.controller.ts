import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpStatus,
  HttpCode,
  SerializeOptions,
} from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../roles/roles.guard';
import {
  InfinityPaginationResponse,
  InfinityPaginationResponseDto,
} from '../utils/dto/infinity-pagination-response.dto';
import { NullableType } from '../utils/types/nullable.type';
import { Payment } from './domain/payment';
import { PaymentsService } from './payments.service';
import { infinityPagination } from '../utils/infinity-pagination';
import { QueryPaymentDto } from './dto/query-payment.dto';

@ApiBearerAuth()
@Roles(RoleEnum.admin)
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiTags('Payments')
@Controller({
  path: 'payments',
  version: '1',
})
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @ApiCreatedResponse({
    type: Payment,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createPaymentDto: CreatePaymentDto): Promise<Payment> {
    return this.paymentsService.create(createPaymentDto);
  }

  @ApiOkResponse({
    type: InfinityPaginationResponse(Payment),
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query() query: QueryPaymentDto,
  ): Promise<InfinityPaginationResponseDto<Payment>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) {
      limit = 50;
    }

    return infinityPagination(
      await this.paymentsService.findManyWithPagination({
        filterOptions: query?.filters,
        sortOptions: query?.sort,
        paginationOptions: {
          page,
          limit,
        },
      }),
      { page, limit },
    );
  }

  @ApiOkResponse({
    type: Payment,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  findOne(@Param('id') id: Payment['id']): Promise<NullableType<Payment>> {
    return this.paymentsService.findById(id);
  }

  @ApiOkResponse({
    type: Payment,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  update(
    @Param('id') id: Payment['id'],
    @Body() updatePaymentDto: UpdatePaymentDto,
  ): Promise<Payment | null> {
    return this.paymentsService.update(id, updatePaymentDto);
  }

  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: Payment['id']): Promise<void> {
    return this.paymentsService.remove(id);
  }

  @ApiOkResponse({
    type: [Payment],
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Get('user/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'userId',
    type: String,
    required: true,
  })
  findByUserId(
    @Param('userId') userId: Payment['user']['id'],
  ): Promise<Payment[]> {
    return this.paymentsService.findByUserId(userId);
  }

  @ApiOkResponse({
    type: Payment,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Get('transaction/:transactionId')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'transactionId',
    type: String,
    required: true,
  })
  findByTransactionId(
    @Param('transactionId') transactionId: string,
  ): Promise<NullableType<Payment>> {
    return this.paymentsService.findByTransactionId(transactionId);
  }

  @ApiOkResponse({
    type: [Payment],
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Get('date-range')
  @HttpCode(HttpStatus.OK)
  findByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<Payment[]> {
    return this.paymentsService.findByDateRange(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @ApiOkResponse({
    type: Number,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Get('user/:userId/total-amount')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'userId',
    type: String,
    required: true,
  })
  getTotalAmountByUserId(
    @Param('userId') userId: Payment['user']['id'],
  ): Promise<number> {
    return this.paymentsService.getTotalAmountByUserId(userId);
  }
}
