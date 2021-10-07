const express = require('express');
const router = express.Router();
const  Menu = require('../models/Menu');
const Cart = require('../models/Cart');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
router.use(session({
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

router.use(function(req, res, next) {
    res.locals.cart = req.session.cart;
    res.locals.table = req.session.table;
    next();
  });

router.get('/', async (req, res) => {
    await Menu.find({}, (err, items)=> {
        if(err) {
            req.session.msg = 'An error occured!';
            req.session.msgType = 'error';
            res.render('./menu/menu', {title:'Menu | Error', session: req.session})
        }
        console.log(req.session);
        res.render('./menu/menu', {title: 'Menu', items: items, session: req.session});
    })
});

router.get('/add/:productId', async (req, res, next) =>{

    var productId = req.params.productId;
    var cart = new Cart(req.session.cart ? req.session.cart: {items: {}});

    await Menu.findById(productId, (err, product) => {
        if(err){
            req.session.msg = 'An error occured!';
            req.session.msgType = 'error';
            return res.redirect('/menu');
        }
        else{
        cart.add(product, product.id);
        req.session.cart=cart;
        return res.redirect('/menu');
        }
    });

});

router.get('/qr/:table', (req, res) => {
        
    req.session.table= req.params.table;

    res.redirect('/menu')

});


module.exports = router;