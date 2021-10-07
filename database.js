const mongoose = require('mongoose');

//accessing .env file for database string and session secret
require('dotenv/config');

//database connection
const connection = mongoose.connect(process.env.DB_KEY, {
    dbName: 'testDB', 
    useNewUrlParser: true,
    useFindAndModify: false,
    useCreateIndex: true,
    useUnifiedTopology: true}, ()=>{
        console.log("Database connected");
})

//connection check
mongoose.connection.on('connected', () => {
    console.log("Mongoose is connected!");
});


module.exports = connection;