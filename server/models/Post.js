const mongoose = require("mongoose")

const Schema = mongoose.Schema 
const ObjectID = mongoose.Schema.Types.ObjectId;

let postSchema = new Schema({
    userid: ObjectID,
    content: String
}, { collection: 'Posts', versionKey: false })

module.exports = mongoose.model("Post", postSchema)