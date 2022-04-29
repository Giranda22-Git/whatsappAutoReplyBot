const mongoose = require('mongoose')

const specials = new mongoose.Schema({
  buttonText: String,
  valueText: String,
  index: Number
})

const mongoSpecials = mongoose.model('specials', specials)
module.exports = mongoSpecials
