const express = require('express');
const path = require('path');
const app = express();
const router = express.Router();
const mongoose = require('mongoose');
const fs = require('fs');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const connection = require('./database.js');

//accessing .env file for database string and session secret
require('dotenv/config');

//Start of listening
const PORT = process.env.PORT || 8080;

app.listen(PORT, ()=>{
    console.log(`server running on port ${PORT}...`)
});

require('./passport-config');

app.use(session({
    store: MongoStore.create({
        dbName: 'testDB',
        mongoUrl: process.env.DB_KEY,
    }),
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie:{
        maxAge: 1000 * 60 * 60 * 4 // 4 hours
    }
}));

//registering view engine
app.set('view engine', 'ejs');

//implementing body parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.raw());

//website routes
const adminpanel = require('./routes/adminpanel');
const menu = require('./routes/menu');
const cart = require('./routes/cart');

app.use('/adminpanel', adminpanel);
app.use('/menu', menu);
app.use('/cart', cart);

app.use(function(req, res, next) {
    res.locals.cart = req.session.cart;
    next();
  });

app.use((req, res, next) =>{
    console.log(req.session);
    console.log(req.user);
    next();
})

//home page
app.get('/', (req, res) =>{
    res.render('index', {title: 'Home', session: req.session});
})

//404 page
app.use((req, res) => {
    res.status(404).render('404', {title: 'Error', session: req.session});
})
