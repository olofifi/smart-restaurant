const express = require('express');
const router = express.Router();
const session = require('express-session');
const MongoStore = require('connect-mongo');

//MODELS:
const Menu = require('../models/Menu');
const Cart = require('../models/Cart');
const Order = require('../models/Order');

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
    res.locals.msg = req.session.msg;
    next();
  });

router.get('/', (req, res) => {
    if(typeof req.session.cart ==='undefined' || null){
        res.render('./cart/cart', {title: 'Cart', session: req.session, items: null});
    } else {
        var cart = new Cart(req.session.cart);
        res.render('./cart/cart', {title: 'Cart', session: req.session, items: cart.generateArray()});
    }
});

router.get('/addone/:productId', async (req, res) => {
    
    if(req.session.cart){
       
        var productId = req.params.productId;
        var cart = new Cart(req.session.cart);

        await Menu.findById(productId, (err, product) => {
            if(err){
                return res.redirect('/cart');
            }

            cart.add(product, product.id);
            req.session.cart=cart;
            res.redirect(res.get('/cart'));

    });
    }
        else res.redirect('/cart');

});

router.get('/removeone/:productId', (req, res) => {
    if(req.session.cart){
        var productId = req.params.productId;
        var cart = new Cart(req.session.cart);

        Menu.findById(productId, (err, product) => {
            if(err){
                return res.redirect('/cart');
            }

            cart.remove(product, product.id);
            req.session.cart=cart;
            res.redirect(res.get('/cart'));

    });
}

});

router.get('/payment', (req, res, next) => {

    if(req.session.cart.totalQty!=0){
        var cart = new Cart(req.session.cart);
        res.render('./cart/payment', {title: 'Payment', session: req.session, items: cart.generateArray()});
    }
    else {
        req.session.msg = 'Your cart is empty! Cannot proceed to payment.';
        req.session.msgType = 'error';
        res.redirect('/cart');
    }

});

router.get('/payment/succeed', async (req, res, next) => {
    
    if(typeof req.session.cart === 'undefined' || null){
        req.session.msg = 'Your cart is empty.';
        req.session.msg = 'error';
        res.redirect('/cart');
    }
    else{
    try {
        var cart = new Cart(req.session.cart);
        var order = new Order({
            products: cart.generateArray(),
            totalPrice: cart.totalPrice,
            paymentDone: true,
            table: req.session.table
        });

        await order.save();

        req.session.msg = 'Payment successful.'
        req.session.msgType = 'success';
        delete req.session.cart.items;
        delete req.session.cart.totalQty;
        delete req.session.cart.totalPrice;
        return res.redirect('/cart');

    } catch(err){
        console.log(err);
            req.session.msg = 'Something went wrong!';
            req.session.msgType = 'error';
            return res.redirect('/cart');
        }
    }
});

module.exports = router;