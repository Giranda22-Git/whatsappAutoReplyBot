const router = require('express').Router()
const { Client, LocalAuth } = require('whatsapp-web.js');
const QRCode = require('qrcode');
const mongoTime = require('../models/time.js')
const mongoBeginText = require('../models/beginText.js')
const mongoSpecials = require('../models/specials.js')
const { PassThrough } = require('stream');
const path = require('path')
const fs = require('fs').promises

router.get('/', async (req, res) => {
  const client = new Client({
    authStrategy: new LocalAuth()
  });

  client.on('qr', async (qr) => {
    console.log('QR RECEIVED', qr)

    const qrStream = new PassThrough()
    const result = await QRCode.toFileStream(qrStream, qr,
      {
        type: 'png',
        width: 200,
        errorCorrectionLevel: 'H'
      }
    )

    qrStream.pipe(res)
  });

  client.on('ready', () => {
    console.log('Client is ready!');
  });

  client.on('message', async msg => {
    let messageText = msg.body
    console.log(await onTime())
    if (await onTime()) {
      const specials = await mongoSpecials.find().lean().exec()
      const specialsValueArray = []
      for (const iterator of specials) {
        specialsValueArray.push(iterator.index)
      }
      try {
        messageText = Number(messageText)
      }
      catch (err) {
        console.log(err)
      }

      if (specialsValueArray.includes(messageText - 1)) {
        const targetSpecial = await mongoSpecials.findOne({ index: messageText - 1 }).lean().exec()

        if (targetSpecial) {
          client.sendMessage(msg.from, targetSpecial.valueText + '\nЕсли вы хотите записаться, напишите фамилию ребенка и администратор в рабочее время ответит в какое именно время вы можете придти.')
        }
      } else {
        const beginText = await mongoBeginText.findOne({target: 'main'}).lean().exec()
        let finalText = beginText.text

        for (const [i, special] of specials.entries()) {
          finalText += `\n${i + 1}. ${special.buttonText}`
        }

        client.sendMessage(msg.from, finalText)
      }
    }
  })

  client.initialize();
})

router.get('/start', async (req, res) => {
  res.setHeader('Content-Type', 'text/html')

  const html = Buffer.from(await fs.readFile(path.join(__dirname, '..', 'index.html'))).toString()

  res.send(html)
})

module.exports = router

async function onTime () {
  const targetTime = await mongoTime.findOne({target: 'main'}).lean().exec()

  const clocks = []

  for (let iterations = 0; iterations <= 2; iterations++) {
    for (let hour = 0; hour < 24; hour++) {
      clocks.push(hour)
    }
  }

  const currentTime = Number(new Date().getHours())

  const timeRange = clocks.splice(targetTime.start, targetTime.end + 1)

  console.log(`currentTime: ${currentTime}`)
  console.log(`timeRange: ${timeRange}`)


  if (timeRange.includes(currentTime)) return true

  return false
}
