const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const mongo = require('mongodb')
const MongoClient = require('mongodb').MongoClient
const mongoose = require('mongoose')
const moment = require('moment')

require('dotenv').config()

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
  let newUser = new UserInfo({username: req.body.username, exercise: [], count: 0})
  //console.log('new user' + newUser);

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

// Add exercise to any user
app.post("/api/exercise/add",(req,res)=>{
  let today = new Date()
  let dd = (today.getDate()<10) ? '0'+today.getDate() : today.getDate()
  let mm = (today.getMonth()<10) ? '0'+today.getMonth() : today.getMonth()
  let yyyy = today.getFullYear()
  today = yyyy + '-' + mm + '-' + dd
  let date = (req.body.date === "") ? today : req.body.date

  UserInfo.findOne({"_id": req.body.userId},(err,user)=>{
    user.exercise.unshift({
      "description": req.body.description,
      "duration": req.body.duration,
      "date": date
    })
    user.count += Number(req.body.duration)
    user.save((err, user)=>{
      if (err) throw err
      
    })
    res.json(user)
  })
})

//Retrieve exercise log of any user
app.get("/api/exercise/log/:userId/:from?/:to?/:limit?",(req,res)=>{
  let limit = Number(req.params.limit)
  if(!isNaN(limit)){
    UserInfo.findOne({"_id":req.params.userId},(err,user)=>{
      if(err) throw err
      let exerciseLog = user.exercise.filter((value,index)=>{
        if(index<limit) return value
      })
      return res.json(exerciseLog)
    })
  } else if(moment(req.params.from,'YYYY-MM-DD',true).isValid() && moment(req.params.to,'YYYY-MM-DD',true).isValid()){
      UserInfo.findOne({"_id":req.params.userId},(err, user)=>{
        if(err) throw err
        let dateLog = user.exercise.filter((value)=>{
          if(moment(req.params.from).isBefore(value.date) && 
             moment(req.params.to).isAfter(value.date) &&
             moment(req.params.from).isBefore(req.params.to)
             ) return value 
        })
        return res.json(dateLog)
      })
  } else {
      UserInfo.findOne({"_id": req.params.userId.toString()}, (err,user)=>{
        return res.json(user)
      })
  }
})

// Get an array with all users and their ids
app.get('/api/exercise/users', (req,res)=>{
  UserInfo.find({},'username _id',(err,user)=>{
    res.json(user)
  })
})
// Retrieve part of the log

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
