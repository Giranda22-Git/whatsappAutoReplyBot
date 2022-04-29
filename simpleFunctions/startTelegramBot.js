const { Telegraf } = require('telegraf')
const settings = require('../staticData/settings.js').data
const mongoBeginText = require('../models/beginText.js')
const mongoSpecials = require('../models/specials.js')
const mongoTime = require('../models/time.js')

const startTelegramBot = async function () {
  const bot = new Telegraf(settings.telegramBotToken)

  bot.start(ctx => {
    const message = `
/text <текст начального сообщения> - изменяет начальный текст сообщения, Пример: /text Здравствуйте это автоответчик...

/new <текст сообщения о специалисте> - добавляет нового специалиста, Пример:
/new Педиатр-Кузнецов Евгений Сергеевич\nГрафик Работы: …\nСтоимость Приема: 5000тг

/list - выводит всех специалистов, с возможностью их удаления

/time <время начало работы бота> <сколько часов он должен работать> - изменяет время работы бота, Пример: /time 22 10 - в таком случае бот будет работать с 22 часов вечера до 8 часов утра
    `

    ctx.reply(message)
  })

  bot.command('text', async ctx => {
    const messageText = ctx.update.message.text
    const valueText = messageText.slice('/text '.length, messageText.length)

    if (valueText) {
      const targetText = await mongoBeginText.findOne({target: 'main'}).lean().exec()

      if (targetText) {
        await mongoBeginText.updateOne({ target: 'main' }, { text: valueText }).exec()
      } else {
        const newBeginText = new mongoBeginText({
          target: 'main',
          text: valueText
        })

        const resLog = await newBeginText.save()
        console.log(resLog)
      }

      ctx.reply('Сообщение успешно обновлено!')
    } else {
      ctx.reply('Неправельный формат, пример: /text Здравствуйте это автоответчик..., команда /text пробел! и текст начального сообщения автоответчика без номеров и Имен')
    }
  })

  bot.command('new', async ctx => {
    const messageText = ctx.update.message.text
    const valueText = messageText.slice('/new '.length, messageText.length)
    const buttonText = valueText.slice(0, valueText.indexOf('\n', 0) + 1)

    if (valueText && buttonText && valueText !== buttonText) {
      const index = await mongoSpecials.countDocuments()
      const newSpecials = new mongoSpecials({
        buttonText,
        valueText,
        index
      })

      const resLog = await newSpecials.save()
      console.log(resLog)
      ctx.reply('Новое направление успешно добавлено!')
    } else {
      ctx.reply('Неправельный формат, пример:\n/new Педиатр-Кузнецов Евгений Сергеевич\nГрафик Работы: …\nСтоимость Приема: 5000тг')
    }
  })

  bot.command('list', async ctx => {
    const allSpecials = await mongoSpecials.find().lean().exec()

    const buttons = {
      reply_markup: {
        inline_keyboard: []
      }
    }

    if (allSpecials.length) {
      for (const special of allSpecials) {
        buttons.reply_markup.inline_keyboard.push([{text: 'Удалить: ' + special.buttonText, callback_data: 'DEL' + special.index}])
      }

      ctx.reply('Список всех направлений:\nОсторожно! при нажатии на кнопку вы удалите выбранное направление.', buttons)
    } else {
      ctx.reply('У вас еще нет напрвлений, создайте новые командой /new <текст>')
    }
  })

  bot.action(/^DEL[0-9]{1,4}$/, async ctx => {
    try {
      const data = ctx.update.callback_query.data

      const index = Number(data.slice('DEL'.length, data.length))

      await mongoSpecials.deleteOne({
        index
      }).exec()

      ctx.reply('Успешно удалено, напишите /list для проверки')
    }
    catch (err) {
      console.log(err)
      ctx.reply('Непредвиденная ошибка, попробуйте еще раз')
    }
  })

  bot.command('/time', async ctx => {
    const messageText = ctx.update.message.text
    const valueText = messageText.slice('/time '.length, messageText.length)

    const [startTime, endTime] = valueText.split(' ')

    if (startTime && endTime) {
      const isExist = await mongoTime.findOne({target: 'main'}).lean().exec()

      if (isExist) {
        await mongoTime.updateOne({ target: 'main' }, { start: startTime, end: endTime }).exec()
      } else {
        const newTime = new mongoTime({
          target: 'main',
          start: startTime,
          end: endTime
        })

        const resLog = await newTime.save()
        console.log(resLog)
      }

      ctx.reply('Время обновлено')
    } else {
      ctx.reply('Неправельный формат, пример: /time 0 8 или /time 12 22')
    }
  })

  bot.launch()
}

module.exports = startTelegramBot

//Здравствуйте, это автоответчик, когда будет рабочее время администратор ответит на все ваши вопросы. Вы можете самостоятельно ознакомиться с информацией, для этого нужно набрать: