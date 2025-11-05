const mongoose = require('mongoose');

const connectString = "mongodb://localhost:27017/shopDev";


mongoose.connect(connectString).then(_ => console.log('connected Mongodb success'))
.catch(err => console.log('Error connect!'));

//dev
if(1 === 1 ){
    mongoose.set('debug', true)
    mongoose.set('debug', {color: true})
}

module.exports = mongoose;