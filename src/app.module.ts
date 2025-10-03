import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
import { AppController } from './app.controller'
import { BotModule } from './bot/bot.module'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs')

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        ScheduleModule.forRoot(),
        BotModule,
    ],
    controllers: [AppController],
})
export class AppModule {}
