import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, scheduleId?: string, status?: string) {
    const where: any = {
      schedule: {
        userId,
      },
    };

    if (scheduleId) {
      where.scheduleId = scheduleId;
    }

    if (status) {
      where.status = status;
    }

    const posts = await this.prisma.post.findMany({
      where,
      include: {
        schedule: {
          include: {
            theme: true,
          },
        },
      },
      orderBy: {
        scheduledFor: 'desc',
      },
      take: 100,
    });

    return posts;
  }

  async findOne(id: string, userId: string) {
    const post = await this.prisma.post.findFirst({
      where: {
        id,
        schedule: {
          userId,
        },
      },
      include: {
        schedule: {
          include: {
            theme: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return post;
  }

  async delete(id: string, userId: string) {
    // Verify ownership
    const post = await this.prisma.post.findFirst({
      where: {
        id,
        schedule: {
          userId,
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Only allow deletion if post is in certain states
    if (post.status === 'PROCESSING') {
      throw new Error('Cannot delete post while it is being processed');
    }

    // Delete the post
    await this.prisma.post.delete({
      where: { id },
    });

    return { message: 'Post deleted successfully' };
  }
}
