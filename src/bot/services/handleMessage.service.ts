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
        const [action, text] = [
            msg.text.split(' ')[0],
            msg.text.split(' ').slice(1).join(' '),
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
        const text = await this.converTime(textMain)
        return await bot.sendMessage(msg.chat.id, text)
    }

    private async converTime(text: string) {
        const geminiToken = this.configService.get('GEMINI_API')
        const genAI = new GoogleGenerativeAI(geminiToken)
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
        })
        const text1 = await model.generateContent(
            'Ты профессиональный переводчик.Ты получаешь данные вида 12:00 Нью-Йорк -> Чикаго.\n' +
                'Эта строка значит что ты должен вернуть время в Чикаго, когда в Нью-Йорке 12:00 дня.\n' +
                'Ты должен вернуть должен одну строку в формате “Когда в Нью-Йорке 12, в Чикаго …”\n' +
                'Если пользователь ввел страну, то в качестве ответа ты должен вернуть время в столице этой страны, но пиши все равно страну в ответе\n' +
                'В ответе дай только одну строчку - только время в формате “Когда в Нью-Йорке 12, в Чикаго ...”!!!!' +
                'Вот первая строка: ' +
                text
        )
        return text1.response.text()
    }
}
