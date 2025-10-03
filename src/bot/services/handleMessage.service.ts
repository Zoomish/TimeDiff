import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import TelegramBot from 'node-telegram-bot-api'
import { BotService } from '../bot.service'

@Injectable()
export class HandleMessageService {
    constructor(
        private readonly configService: ConfigService,
        @Inject(forwardRef(() => BotService))
        private readonly botService: BotService
    ) {}
    private readonly logger = new Logger(HandleMessageService.name)

    async handleMessage(msg: TelegramBot.Message) {
        const bot: TelegramBot = global.bot
        console.log(msg)
    }
}
