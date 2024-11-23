const mongoose = require("mongoose")

const Schema = mongoose.Schema 
const ObjectID = mongoose.Schema.Types.ObjectId;

let postSchema = new Schema({
    userid: ObjectID,
    content: String
}, { collection: 'Posts' })

module.exports = mongoose.model("Post", postSchema)