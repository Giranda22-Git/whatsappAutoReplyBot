const mongoose = require('mongoose')

const time = new mongoose.Schema({
  target: String,
  start: Number,
  end: Number
})

const mongoTime = mongoose.model('time', time)
module.exports = mongoTime
