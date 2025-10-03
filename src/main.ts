import { ConsoleLogger } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { config } from 'dotenv'
import { AppModule } from './app.module'
config()
async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        logger: new ConsoleLogger({
            prefix: 'TimeDiffBot',
            compact: 5,
        }),
    })
    app.enableCors()
    app.setGlobalPrefix('api')

    await app.listen(3000, async () => {
        console.log(`Server started on port ${await app.getUrl()}`)
    })
}
bootstrap()
