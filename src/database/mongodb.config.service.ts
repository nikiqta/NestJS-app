import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  MongooseModuleOptions,
  MongooseOptionsFactory,
} from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class MongodbConfigService implements MongooseOptionsFactory {
  private readonly logger = new Logger(MongodbConfigService.name);

  constructor(private readonly configService: ConfigService) {}

  //You can retrun promise as well
  public createMongooseOptions(): MongooseModuleOptions {
    return {
      uri: this.configService.get<string>('db.uri', ''),
      onConnectionCreate: (db: Connection) => {
        db.once('open', () => this.logger.log('MongoDB database ready!'));

        db.on('error', (reason) => {
          this.logger.error('MongoDB error:', reason);
        });

        return db;
      },
    };
  }
}
