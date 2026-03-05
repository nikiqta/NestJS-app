import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { Model } from 'mongoose';
import { Session } from 'src/schemas/session.schema';

@Injectable()
export class ScheduleService implements OnModuleInit {
  private readonly logger = new Logger(ScheduleService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
    @InjectModel(Session.name) private sessionModel: Model<Session>,
  ) {}

  onModuleInit() {
    this.sessionsCheck();
  }

  sessionsCheck() {
    const pattern =
      this.configService.get<string>('cron.jobs.sessionsCheck') ||
      '45 * * * * *';

    const job = new CronJob(pattern, async () => {
      const fireDate = new Date();
      this.logger.warn(
        `Running cron task "sessionsCheck" at  ${fireDate.toLocaleString()}`,
      );

      try {
        const userSessions = await this.sessionModel.find();
        this.logger.log(
          `Currently active user sessions: ${userSessions?.length}`,
        );
      } catch (error) {
        this.logger.error('Failed to retrieve user sessions:', {
          error: error.message,
          jobName: 'sessionsCheck',
          stack: error.stack,
        });
        throw new InternalServerErrorException('An unexpected error occurred');
      }
    });

    this.schedulerRegistry.addCronJob('sessionsCheck', job);
    job.start();

    this.logger.log(
      `Cron job "sessionsCheck" registered with pattern: ${pattern}`,
    );
  }
}
