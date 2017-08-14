const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const env = require('node-env-file')
const mongo = require('mongodb')
const MongoClient = require('mongodb').MongoClient
const mongoose = require('mongoose')
require('dotenv').config()

// Reads from .env file
env(__dirname + '/.env')

const cors = require('cors')
app.use(cors())

// Connect to DB
mongoose.connect(process.env.MONGODB_URI)
const db = mongoose.connection

// Check connection
db.once('open',()=>{
  console.log('Connected to MongoDB...');
});

// Check for DB errors
db.on('error',()=>{
  console.log("Did not connect to MongoDb. Error: " + error)
})

// Bring in the Models
const UserInfo = require('./models/users.js')
//const ExerciseInfo = require('./models/users.js')


// Mount the POST body-parser
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

// Display Homepage
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

//----------- App logic


// Create new user
app.post("/api/exercise/new-user", (req,res)=> {
  let newUsername = req.body.username.toString()
  var newUser = new UserInfo({username: req.body.username, exercise: []})
  console.log('new user' + newUser);

  // Check for duplicates && Add new user
  UserInfo.findOne({"username": newUsername}, (err,user)=>{
    if (err) throw err
    if (user!==null) return res.json({"error": "Username already exists in database"})
    newUser.save((err,user)=>{
        if(err) throw err
        res.json({"username": newUsername, "_id": user._id})
    }) 
  })
})

//----------- End app logic

// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
