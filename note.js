const mongoose = require("mongoose");
const note = new mongoose.Schema({
    description: {type: String},
    title: {type: String},
    user:{type:String}
  
});
module.exports = mongoose.model('note', note);