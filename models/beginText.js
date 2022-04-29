const mongoose = require('mongoose')

const beginText = new mongoose.Schema({
  target: String,
  text: String
})

const mongoBeginText = mongoose.model('beginText', beginText)
module.exports = mongoBeginText
