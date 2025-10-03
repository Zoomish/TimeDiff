import { GoogleGenerativeAI } from '@google/generative-ai'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import TelegramBot from 'node-telegram-bot-api'
const cityTimezones = require('city-timezones')

@Injectable()
export class HandleMessageService {
    constructor(private readonly configService: ConfigService) {}

    async handleMessage(msg: TelegramBot.Message) {
        const bot: TelegramBot = global.bot
        if (msg.text === '/start') {
            return await bot.sendMessage(msg.chat.id, 'Hello World!')
        } else if (msg.text.includes('/time')) {
            const texts = [
                msg.text.split(' ')[0],
                msg.text.split(' ').slice(1, 2).join(' '),
                msg.text.split(' ').slice(2).join(''),
            ]
            return await this.getTime(texts[1], texts[2])
        }
    }
    private async getTime(time: string, cities: string) {
        const bot: TelegramBot = global.bot
        const msg: TelegramBot.Message = global.msg
        const [fromCity, toCity] = cities.split('->')
        if (!time || !fromCity || !toCity) {
            return await bot.sendMessage(
                msg.chat.id,
                'Неправильный формат. Правильный формат /time Время Город -> Город'
            )
        }
        const fromCityTimezone = this.getTimezoneByCity(
            await this.convertToEnglish(fromCity)
        )

        const toCityTimezone = this.getTimezoneByCity(
            await this.convertToEnglish(toCity)
        )
        if (fromCityTimezone && toCityTimezone) {
            const text = this.convertTime(
                time,
                fromCityTimezone,
                toCityTimezone
            )
            return await bot.sendMessage(
                msg.chat.id,
                `Когда в ${fromCity} ${time}, в ${toCity} ${text}`
            )
        }
        return await bot.sendMessage(
            msg.chat.id,
            'Не могу определить город. Проверьте название города'
        )
    }

    private async convertToEnglish(text: string) {
        const geminiToken = this.configService.get('GEMINI_API')
        const genAI = new GoogleGenerativeAI(geminiToken)
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
        })
        await model.generateContent(
            'Ты профессиональный переводчик. Ты получил название города или страны на любом языке, например русском. Переведи его на английский.\n' +
                'Например, вводит Москва, ты должен ответить Moscow.\n' +
                'Если пользователь ввел страну, верни столицу этой страны. Например, вводит Россия, ты должен ответить Moscow.\n' +
                'Возвращай одно слово-сам город. Не пиши ничего больше.\n' +
                'Вот первое слово: ' +
                text
        )
    }

    private getTimezoneByCity(cityName) {
        const results = cityTimezones.lookupViaCity(cityName)
        if (results && results.length > 0) {
            return results[0].timezone
        }
        return null
    }

    private convertTime(
        time: string,
        fromTimeZone: string,
        toTimeZone: string
    ): string {
        const [hour, min] = time.split(':')
        const date = new Date()
        date.setHours(+hour)
        date.setMinutes(+min)
        date.setSeconds(0)
        date.setMilliseconds(0)
        const timeInZone2 = new Intl.DateTimeFormat('en-US', {
            timeZone: toTimeZone,
            hour12: false,
            hour: 'numeric',
            minute: 'numeric',
        }).format(date)

        return timeInZone2
    }
}
