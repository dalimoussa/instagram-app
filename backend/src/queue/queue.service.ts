import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

export interface PublishJobData {
  postId: string;
  igAccountId: string;
  mediaAssetId: string;
  caption?: string;
  hashtags?: string[];
}

export interface InsightsJobData {
  igAccountId: string;
  igMediaIds: string[];
}

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue('publish') private publishQueue: Queue,
    @InjectQueue('insights') private insightsQueue: Queue,
    @InjectQueue('scheduler') private schedulerQueue: Queue,
  ) {}

  /**
   * Add a publish job to the queue
   */
  async addPublishJob(data: PublishJobData, scheduledTime?: Date) {
    const delay = scheduledTime ? scheduledTime.getTime() - Date.now() : 0;
    
    return this.publishQueue.add(
      'publish-post',
      data,
      {
        delay: delay > 0 ? delay : 0,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000, // 5 seconds initial backoff
        },
        removeOnComplete: {
          age: 7 * 24 * 60 * 60, // 7 days
          count: 1000,
        },
        removeOnFail: {
          age: 30 * 24 * 60 * 60, // 30 days
        },
      },
    );
  }

  /**
   * Add insights collection job
   */
  async addInsightsJob(data: InsightsJobData) {
    return this.insightsQueue.add(
      'collect-insights',
      data,
      {
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 10000,
        },
      },
    );
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string, queueName: 'publish' | 'insights' | 'scheduler') {
    const queue = this.getQueue(queueName);
    const job = await queue.getJob(jobId);
    
    if (!job) {
      return null;
    }
    
    return {
      id: job.id,
      name: job.name,
      data: job.data,
      progress: await job.getState(),
      attemptsMade: job.attemptsMade,
      failedReason: job.failedReason,
      finishedOn: job.finishedOn,
      processedOn: job.processedOn,
    };
  }

  /**
   * Remove a job from queue
   */
  async removeJob(jobId: string, queueName: 'publish' | 'insights' | 'scheduler') {
    const queue = this.getQueue(queueName);
    const job = await queue.getJob(jobId);
    
    if (job) {
      await job.remove();
      return true;
    }
    
    return false;
  }

  private getQueue(queueName: string): Queue {
    switch (queueName) {
      case 'publish':
        return this.publishQueue;
      case 'insights':
        return this.insightsQueue;
      case 'scheduler':
        return this.schedulerQueue;
      default:
        throw new Error(`Unknown queue: ${queueName}`);
    }
  }
}
