import { GoogleGenerativeAI } from '@google/generative-ai'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import TelegramBot from 'node-telegram-bot-api'
const ct = require('countries-and-timezones')

@Injectable()
export class HandleMessageService {
    constructor(private readonly configService: ConfigService) {}

    async handleMessage(msg: TelegramBot.Message) {
        const bot: TelegramBot = global.bot
        bot.sendChatAction(msg.chat.id, 'typing')

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
                'Введите данные в формате <code>/time Время Город -> Город</code>',
                {
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: 'Скопировать формат',
                                    copy_text: {
                                        text: '/time Время Город -> Город',
                                    },
                                },
                            ],
                        ],
                    },
                }
            )
        }
        let time = textMain.split(' ')?.[0]?.trim()
        let cities = textMain.split(' ')?.slice(1)?.join('') || ''
        if (isNaN(Number(time.trim().split(':')[0]))) {
            time = new Date()
                .toUTCString()
                .split(' ')[4]
                .split(':')
                .slice(0, 2)
                .join(':')
            cities = textMain.split(' ')?.join('')
        }
        console.log(
            textMain.split(' ')?.[0] || null,
            textMain.split(' ')?.slice(1)?.join('') || '',
            textMain.split(' '),
            cities
        )

        const [city1, city2] = cities.split('->')
        if (!city1 || !city2) {
            return await bot.sendMessage(
                msg.chat.id,
                'Введите данные в формате <code>/time Время Город -> Город</code>',
                {
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: 'Скопировать формат',
                                    copy_text: {
                                        text: '/time Время Город -> Город',
                                    },
                                },
                            ],
                        ],
                    },
                }
            )
        }

        const timezone = await this.converTime(time, city1.trim(), city2.trim())
        if (timezone === 'error') {
            return await bot.sendMessage(
                msg.chat.id,
                'Не удалось определить таймзону, проверьте названия городов'
            )
        }
        return await bot.sendMessage(
            msg.chat.id,
            `Когда в ${city1.trim()} ${time}, в ${city2.trim()} ${timezone}`
        )
    }

    private async getTimezone(text: string): Promise<string> {
        const geminiToken = this.configService.get('GEMINI_API')
        const genAI = new GoogleGenerativeAI(geminiToken)
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
        })
        let text1 = null
        await model
            .generateContent(
                'Ты профессиональный переводчик. Ты получил название города или страны на любом языке, например русском. Переведи его на английский и верни тайм зону.\n' +
                    'Например, вводит Москва, ты должен ответить Europe/Moscow.\n' +
                    'Если пользователь ввел страну, верни столицу этой страны. Например, вводит Россия, ты должен ответить Europe/Moscow.\n' +
                    'Возвращай одну строку-саму зону. Не пиши ничего больше!! \n' +
                    'Вот первый город: ' +
                    text
            )
            .then((text2) => {
                text1 = text2.response.text()
            })
        return text1
    }

    private async converTime(time: string, city1: string, city2: string) {
        const city1TimeZone = (await this.getTimezone(city1)).trim()
        const city2TimeZone = (await this.getTimezone(city2)).trim()

        if (city1TimeZone === city2TimeZone) {
            return time
        } else if (!city1TimeZone || !city2TimeZone) {
            return 'error'
        }

        const timezone1 = ct.getTimezone(city1TimeZone)

        const date1 = new Date(`August 19, 1975 ${time}:00`)
        date1.setMinutes(date1.getMinutes() + date1.getTimezoneOffset() * -1)
        date1.setMinutes(date1.getMinutes() + timezone1.dstOffset * -1)
        return date1.toLocaleTimeString('en-US', {
            hour12: false,
            timeZone: city2TimeZone,
            hour: '2-digit',
            minute: '2-digit',
        })
    }
}
