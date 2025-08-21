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
  Req,
} from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiQuery,
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
import { Notification } from './domain/notification';
import { NotificationsService } from './notifications.service';
import { infinityPagination } from '../utils/infinity-pagination';
import { QueryNotificationsDto } from './dto/query-notifications';
import { MyNotificationResponseDto } from './dto/response.dto';
import { JwtPayloadType } from '../auth/strategies/types/jwt-payload.type';

@ApiBearerAuth()
@Roles(RoleEnum.admin, RoleEnum.driver, RoleEnum.user, RoleEnum.parent)
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiTags('Notifications')
@Controller({
  path: 'notifications',
  version: '1',
})
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @ApiCreatedResponse({
    type: Notification,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createNotificationDto: CreateNotificationDto,
  ): Promise<Notification> {
    return this.notificationsService.create(createNotificationDto);
  }

  @ApiOkResponse({
    type: InfinityPaginationResponse(MyNotificationResponseDto),
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query() query: QueryNotificationsDto,
  ): Promise<InfinityPaginationResponseDto<MyNotificationResponseDto>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 30;
    if (limit > 50) {
      limit = 50;
    }

    return infinityPagination(
      await this.notificationsService.findManyWithPagination({
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
    type: [MyNotificationResponseDto],
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Get('user')
  @HttpCode(HttpStatus.OK)
  findByUserId(@Req() req: any): Promise<MyNotificationResponseDto[]> {
    const userJwtPayload: JwtPayloadType = req.user;

    return this.notificationsService.findByUserId(userJwtPayload);
  }

  @ApiOkResponse({
    type: [MyNotificationResponseDto],
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Get('user/unread')
  @HttpCode(HttpStatus.OK)
  findUnreadByUserId(@Req() req: any): Promise<MyNotificationResponseDto[]> {
    const userJwtPayload: JwtPayloadType = req.user;

    return this.notificationsService.findUnreadByUserId(userJwtPayload);
  }

  @ApiOkResponse({
    type: [MyNotificationResponseDto],
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Get('user/section/:section')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'section',
    type: String,
    required: true,
  })
  findByUserIdAndSection(
    @Param('section') section: string,
    @Req() req: any,
  ): Promise<MyNotificationResponseDto[]> {
    const userJwtPayload: JwtPayloadType = req.user;
    return this.notificationsService.findByUserIdAndSection(
      userJwtPayload,
      section,
    );
  }

  @ApiOkResponse({
    type: [MyNotificationResponseDto],
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Get('kind/:kind')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'kind',
    type: String,
    required: true,
  })
  findByKind(
    @Param('kind') kind: string,
  ): Promise<MyNotificationResponseDto[]> {
    return this.notificationsService.findByKind(kind);
  }

  @ApiOkResponse({
    type: Number,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Get('user/unread-count')
  @HttpCode(HttpStatus.OK)
  getUnreadCountByUserId(@Req() req: any): Promise<number> {
    const userJwtPayload: JwtPayloadType = req.user;
    return this.notificationsService.getUnreadCountByUserId(userJwtPayload);
  }

  @ApiOkResponse({
    type: Notification,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  markAsRead(@Param('id') id: Notification['id']): Promise<Notification> {
    return this.notificationsService.markAsRead(id);
  }

  @ApiOkResponse()
  @SerializeOptions({
    groups: ['admin'],
  })
  @Patch('user/mark-all-read')
  @HttpCode(HttpStatus.OK)
  markAllAsReadByUserId(@Req() req: any): Promise<void> {
    const userJwtPayload: JwtPayloadType = req.user;

    return this.notificationsService.markAllAsReadByUserId(userJwtPayload);
  }

  @ApiOkResponse({
    type: [MyNotificationResponseDto],
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Get('user/recent')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: [Notification] })
  @SerializeOptions({ groups: ['admin'] })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
  })
  async findRecentByUserId(
    @Req() req: any,
    @Query('limit') limit?: string,
  ): Promise<MyNotificationResponseDto[]> {
    const userJwtPayload: JwtPayloadType = req.user;
    return this.notificationsService.findRecentByUserId(
      userJwtPayload,
      parseInt(limit ?? '10', 10),
    );
  }

  @ApiOkResponse({
    type: MyNotificationResponseDto,
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
  findOne(
    @Param('id') id: Notification['id'],
  ): Promise<NullableType<MyNotificationResponseDto>> {
    return this.notificationsService.findById(id);
  }

  @ApiOkResponse({
    type: Notification,
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
    @Param('id') id: Notification['id'],
    @Body() updateNotificationDto: UpdateNotificationDto,
  ): Promise<Notification | null> {
    return this.notificationsService.update(id, updateNotificationDto);
  }

  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: Notification['id']): Promise<void> {
    return this.notificationsService.remove(id);
  }
}
