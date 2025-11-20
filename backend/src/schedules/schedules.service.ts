import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';

@Injectable()
export class SchedulesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createScheduleDto: CreateScheduleDto, userId: string) {
    // Validation: Check if theme exists and belongs to user
    const theme = await this.prisma.theme.findFirst({
      where: {
        id: createScheduleDto.themeId,
        userId,
      },
    });

    if (!theme) {
      throw new NotFoundException('Theme not found or you do not have permission to use it');
    }

    // Validation: Check if all target accounts exist and belong to user
    const accounts = await this.prisma.igAccount.findMany({
      where: {
        id: { in: createScheduleDto.targetAccounts },
        userId,
      },
    });

    if (accounts.length !== createScheduleDto.targetAccounts.length) {
      const foundIds = accounts.map(acc => acc.id);
      const missingIds = createScheduleDto.targetAccounts.filter(id => !foundIds.includes(id));
      throw new NotFoundException(
        `Instagram account(s) not found or you do not have permission: ${missingIds.join(', ')}`
      );
    }

    // Validation: Check scheduled time is in the future
    const scheduledTime = new Date(createScheduleDto.scheduledTime);
    if (scheduledTime <= new Date()) {
      throw new Error('Scheduled time must be in the future');
    }

    // Validation: Check if user has reached schedule limit (based on license)
    const scheduleCount = await this.prisma.schedule.count({
      where: { userId },
    });

    // Note: Add license check here when implemented
    // const license = await this.prisma.license.findFirst({ where: { userId } });
    // if (scheduleCount >= license.maxSchedules) throw error

    const schedule = await this.prisma.schedule.create({
      data: {
        userId,
        name: createScheduleDto.name,
        description: createScheduleDto.description,
        themeId: createScheduleDto.themeId,
        targetAccounts: createScheduleDto.targetAccounts,
        postType: createScheduleDto.postType,
        scheduledTime: scheduledTime,
        timezone: createScheduleDto.timezone || 'Asia/Tokyo',
        caption: createScheduleDto.caption,
        hashtags: createScheduleDto.hashtags || [],
        location: createScheduleDto.location,
        isRecurring: createScheduleDto.isRecurring || false,
        recurringPattern: createScheduleDto.recurringPattern,
      },
      include: {
        theme: true,
      },
    });

    return schedule;
  }

  async findAll(userId: string) {
    const schedules = await this.prisma.schedule.findMany({
      where: {
        userId,
      },
      include: {
        theme: true,
        _count: {
          select: {
            posts: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return schedules;
  }

  async findOne(id: string, userId: string) {
    const schedule = await this.prisma.schedule.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        theme: true,
        posts: {
          orderBy: {
            scheduledFor: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    return schedule;
  }

  async update(id: string, updateScheduleDto: UpdateScheduleDto, userId: string) {
    const schedule = await this.prisma.schedule.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    const updatedSchedule = await this.prisma.schedule.update({
      where: { id },
      data: {
        ...(updateScheduleDto.name && { name: updateScheduleDto.name }),
        ...(updateScheduleDto.description !== undefined && { description: updateScheduleDto.description }),
        ...(updateScheduleDto.themeId && { themeId: updateScheduleDto.themeId }),
        ...(updateScheduleDto.targetAccounts && { targetAccounts: updateScheduleDto.targetAccounts }),
        ...(updateScheduleDto.postType && { postType: updateScheduleDto.postType }),
        ...(updateScheduleDto.scheduledTime && { scheduledTime: new Date(updateScheduleDto.scheduledTime) }),
        ...(updateScheduleDto.timezone && { timezone: updateScheduleDto.timezone }),
        ...(updateScheduleDto.caption !== undefined && { caption: updateScheduleDto.caption }),
        ...(updateScheduleDto.hashtags && { hashtags: updateScheduleDto.hashtags }),
        ...(updateScheduleDto.location !== undefined && { location: updateScheduleDto.location }),
        ...(updateScheduleDto.isRecurring !== undefined && { isRecurring: updateScheduleDto.isRecurring }),
        ...(updateScheduleDto.recurringPattern !== undefined && { recurringPattern: updateScheduleDto.recurringPattern }),
        ...(updateScheduleDto.status && { status: updateScheduleDto.status }),
      },
      include: {
        theme: true,
      },
    });

    return updatedSchedule;
  }

  async remove(id: string, userId: string) {
    const schedule = await this.prisma.schedule.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    await this.prisma.schedule.delete({
      where: { id },
    });

    return { message: 'Schedule deleted successfully' };
  }

  async toggleActive(id: string, userId: string) {
    const schedule = await this.prisma.schedule.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    // Toggle status between PENDING and CANCELLED
    const newStatus = schedule.status === 'PENDING' ? 'CANCELLED' : 'PENDING';

    const updated = await this.prisma.schedule.update({
      where: { id },
      data: {
        status: newStatus,
      },
    });

    return updated;
  }

  async executeNow(id: string, userId: string) {
    const schedule = await this.prisma.schedule.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        theme: {
          include: {
            mediaAssets: {
              where: { isUsed: false },
              take: 1,
            },
          },
        },
      },
    });

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    if (schedule.status === 'COMPLETED') {
      throw new Error('Schedule already completed');
    }

    if (schedule.theme.mediaAssets.length === 0) {
      throw new Error('No unused media available. Please sync media from Google Drive first.');
    }

    // Force execute by updating scheduledTime to now
    await this.prisma.schedule.update({
      where: { id },
      data: {
        scheduledTime: new Date(),
        status: 'PENDING',
      },
    });

    return { 
      message: 'Schedule will be executed within 1 minute',
      scheduledTime: new Date(),
      scheduleId: id,
      status: 'PENDING',
    };
  }

  async getExecutionStatus(id: string, userId: string) {
    const schedule = await this.prisma.schedule.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        posts: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    // Get the latest post for this schedule
    const latestPost = schedule.posts[0];

    return {
      scheduleId: id,
      status: schedule.status,
      scheduledTime: schedule.scheduledTime,
      lastExecutedAt: latestPost?.publishedAt || null,
      latestPost: latestPost ? {
        id: latestPost.id,
        status: latestPost.status,
        igMediaId: latestPost.igMediaId,
        publishedAt: latestPost.publishedAt,
        errorMessage: latestPost.errorMessage,
      } : null,
    };
  }
}

