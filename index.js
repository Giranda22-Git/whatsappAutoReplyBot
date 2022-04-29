const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const cors = require('cors')

// require mounted data as serverData
const serverData = require('./staticData/settings.js').data

// activate mounted functions
//----

// require simple functions
const startTelegramBot = require('./simpleFunctions/startTelegramBot.js')

// initial express js application
const app = express()

// standart middleweare settings
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use((req, res, next) => {
	res.contentType('application/json')
	next()
})
app.use(cors())


// function of init all process
async function init(serverData) {
	mongoose.connect(serverData.mongoUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })

  mongoose.connection.once('open', async () => {
		app.listen(serverData.PORT, '0.0.0.0', (err) => {
			if (err) return new Error(`error in starting server, error: ${err}`)
			else console.log(`server started on \nPORT: ${serverData.PORT}\nURL: ${serverData.serverUrl}`)
		})

    // require all end points
		app.use('/api', require('./endPoints/api.js'))

    await startTelegramBot()
	})

	mongoose.connection.emit('open')
}

init (serverData)
