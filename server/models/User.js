const mongoose = require("mongoose")

const Schema = mongoose.Schema 
const ObjectID = mongoose.Schema.Types.ObjectId;

let userSchema = new Schema({
    username: String,
    email: String,
    gender: String
}, { collection: 'Users' })

module.exports = mongoose.model("User", userSchema)