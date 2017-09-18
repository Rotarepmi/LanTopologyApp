let mongoose = require('mongoose');

// Article schema
let scanSchema = mongoose.Schema({
  scanTitle: {
    type: String,
    required: true
  },
  scanAuthor: {
    type: String,
    required: true
  },
  scanDate: {
    type: String,
    required: false
  },
  localhost: {
    type: Object,
    required: false
  },
  hosts: {
    type: Object,
    required: false
  }
});

let Scan = module.exports = mongoose.model('Scan', scanSchema);
