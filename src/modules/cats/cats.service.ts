import { Injectable, OnModuleInit } from '@nestjs/common';
import { Cat } from './interfaces/cat.interface';

@Injectable()
export class CatsService implements OnModuleInit {
  private readonly cats: Cat[] = [];

  async onModuleInit() {
    // Simulate async initialization logic
    console.log('CatsService initialized');
  }

  create(cat: Cat) {
    this.cats.push(cat);
  }

  findAll(): Promise<Cat[]> {
    return Promise.resolve(this.cats);
  }
}
