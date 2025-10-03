import { GoogleGenerativeAI } from '@google/generative-ai'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import TelegramBot from 'node-telegram-bot-api'

@Injectable()
export class HandleMessageService {
    constructor(private readonly configService: ConfigService) {}

    async handleMessage(msg: TelegramBot.Message) {
        const bot: TelegramBot = global.bot
        bot.sendChatAction(msg.chat.id, 'typing')
        console.log(msg.text)

        const [action, text] = [
            msg.text?.split(' ')?.[0] || msg.text?.split('@')?.[0] || '/start',
            msg.text?.split(' ')?.slice(1)?.join(' ') || '',
        ]
        switch (action) {
            case '/start':
                return await bot.sendMessage(msg.chat.id, 'Hello World!')
            case '/time':
                return await this.getTime(text)
        }
    }
    private async getTime(textMain: string) {
        const bot: TelegramBot = global.bot
        const msg: TelegramBot.Message = global.msg
        if (!textMain) {
            return await bot.sendMessage(
                msg.chat.id,
                'Введите данные в формате <code>/time Время Город - Город</code>',
                {
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: 'Скопировать формат',
                                    copy_text: {
                                        text: '/time Время Город - Город',
                                    },
                                },
                            ],
                        ],
                    },
                }
            )
        }
        const text = await this.converTime(textMain)
        return await bot.sendMessage(msg.chat.id, text, {
            parse_mode: 'MarkdownV2',
        })
    }

    private async converTime(text: string) {
        const geminiToken = this.configService.get('GEMINI_API')
        const genAI = new GoogleGenerativeAI(geminiToken)
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
        })
        let text1 = 'Произошла ошибка, попробуйте еще раз'
        await model
            .generateContent(
                'Ты профессиональный переводчик.Ты получаешь данные вида "время Город1 -> Город2".\n' +
                    'Эта строка значит что ты должен вернуть время в Город2, когда в Город1 время.\n' +
                    'Ты должен вернуть должен одну строку в формате “Когда в Город1 время, в Город2 …”\n' +
                    'Если пользователь ввел страну, то в качестве ответа ты должен вернуть время в столице этой страны, но пиши все равно страну в ответе\n' +
                    'В ответе дай только одну строчку - только время в формате “Когда в Город1 время, в Город2 ...”!!!!\n' +
                    'Если пользователь ввел что-то другое, или дал недостаточно данных, то в качестве ответа ты должен вернуть “Введите данные в формате /time Время Город - Город”, НО ' +
                    `Если пользователь ввел только города или страны, дай ответ относительно текущего времени, вот оно в UTC:${new Date().toUTCString().split(' ')[4].split(':').slice(0, 2).join(':')}\n` +
                    'Вот первая строка: ' +
                    text
            )
            .then((text2) => {
                text1 = text2.response.text()
            })
        return text1
    }
}
