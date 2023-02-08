
require("dotenv").config()
const { default: mongoose } = require("mongoose")
const MongoClient = require('mongoose')
const uri = `mongodb+srv://Ruhi:${process.env.DB_PASSWORD}@cluster0.fmgaspp.mongodb.net/test`
// const uri = process.env.DB_URI

const start = ()=>{
    // mongoose.set('strictQuery',false);
    mongoose.connect(uri)
    mongoose.connection.on("error",()=>{
        console.log("error connecting db")
    })

    mongoose.connection.once("db_connect",()=>{
        console.log("Database connected")
    })
}

module.exports= {start}
