const mongoose = require('mongoose')

// Exercise Schema
const exerciseSchema = mongoose.Schema({
    description: {
        type: String
    },
    duration: {
        type: Number
    },
    date: {
        type: String
    }
})

// User Schema
const userSchema = mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    exercise: [exerciseSchema],
    count : {
        type: Number
    }
})

const UserInfo = module.exports = mongoose.model('User', userSchema, 'users')
//const ExerciseInfo = module.exports = mongoose.model('Exercise', exerciseSchema, 'users')