import { Module } from '@nestjs/common'
import { BotService } from './bot.service'
import { HandleMessageService } from './services/handleMessage.service'

@Module({
    providers: [BotService, HandleMessageService],
    exports: [BotService],
})
export class BotModule {}
