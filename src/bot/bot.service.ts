import { forwardRef, Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import TelegramBot, * as telegram from 'node-telegram-bot-api'
import { HandleMessageService } from './services/handleMessage.service'

@Injectable()
export class BotService implements OnModuleInit {
    constructor(
        @Inject(forwardRef(() => ConfigService))
        private readonly configService: ConfigService,
        private readonly handleMessageService: HandleMessageService
    ) {}

    async onModuleInit() {
        const telegramToken = this.configService.get('TELEGRAM_TOKEN')
        const bot: TelegramBot = new telegram(telegramToken, {
            polling: true,
            onlyFirstMatch: true,
        })
        global.bot = bot
        bot.setMyCommands([
            {
                command: '/start',
                description: 'Начало работы',
            },
            {
                command: '/time',
                description: 'Разница во времени в формате /time Город - Город',
            },
        ])
        bot.on('message', async (msg: TelegramBot.Message) => {
            global.msg = msg
            await this.handleMessageService.handleMessage(msg)
        })
    }
}
