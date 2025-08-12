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

@ApiBearerAuth()
@Roles(RoleEnum.admin, RoleEnum.user)
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
    type: InfinityPaginationResponse(Notification),
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query() query: QueryNotificationsDto,
  ): Promise<InfinityPaginationResponseDto<Notification>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
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
    type: Notification,
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
  ): Promise<NullableType<Notification>> {
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

  @ApiOkResponse({
    type: [Notification],
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
    @Param('userId') userId: Notification['user']['id'],
  ): Promise<Notification[]> {
    return this.notificationsService.findByUserId(userId);
  }

  @ApiOkResponse({
    type: [Notification],
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Get('user/:userId/unread')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'userId',
    type: String,
    required: true,
  })
  findUnreadByUserId(
    @Param('userId') userId: Notification['user']['id'],
  ): Promise<Notification[]> {
    return this.notificationsService.findUnreadByUserId(userId);
  }

  @ApiOkResponse({
    type: [Notification],
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Get('user/:userId/section/:section')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'userId',
    type: String,
    required: true,
  })
  @ApiParam({
    name: 'section',
    type: String,
    required: true,
  })
  findByUserIdAndSection(
    @Param('userId') userId: Notification['user']['id'],
    @Param('section') section: string,
  ): Promise<Notification[]> {
    return this.notificationsService.findByUserIdAndSection(userId, section);
  }

  @ApiOkResponse({
    type: [Notification],
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
  findByKind(@Param('kind') kind: string): Promise<Notification[]> {
    return this.notificationsService.findByKind(kind);
  }

  @ApiOkResponse({
    type: Number,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Get('user/:userId/unread-count')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'userId',
    type: String,
    required: true,
  })
  getUnreadCountByUserId(
    @Param('userId') userId: Notification['user']['id'],
  ): Promise<number> {
    return this.notificationsService.getUnreadCountByUserId(userId);
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
  @Patch('user/:userId/mark-all-read')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'userId',
    type: String,
    required: true,
  })
  markAllAsReadByUserId(
    @Param('userId') userId: Notification['user']['id'],
  ): Promise<void> {
    return this.notificationsService.markAllAsReadByUserId(userId);
  }

  @ApiOkResponse({
    type: [Notification],
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Get('user/:userId/recent')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: [Notification] })
  @SerializeOptions({ groups: ['admin'] })
  @ApiParam({
    name: 'userId',
    type: String,
    required: true,
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
  })
  async findRecentByUserId(
    @Param('userId') userId: Notification['user']['id'],
    @Query('limit') limit?: string,
  ): Promise<Notification[]> {
    return this.notificationsService.findRecentByUserId(
      userId,
      parseInt(limit ?? '10', 10),
    );
  }
}
