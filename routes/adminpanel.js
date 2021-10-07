const express = require('express');
const router = express.Router();
const path = require('path');
const bcrypt = require('bcrypt');
const fs = require('fs');
const multer = require('multer');
const mongoose = require('mongoose');
const isAuth = require('./authMiddleware').isAuth;
const passport = require('passport');
const MongoStore = require('connect-mongo');
const session = require('express-session');

//passport and session initialization
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
}))

require('../passport-config')(passport);
router.use(passport.initialize());
router.use(passport.session());

//importing database models
const Admin = require('../models/Admin');
const Menu = require('../models/Menu');
const Order = require('../models/Order');

//multer feature for uploading files (images)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads')
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now())
    }
});
 
const upload = multer({ storage: storage });

router.use(express.urlencoded({ extended: true }));
router.use(express.json());
router.use(express.raw());


//<<<<<GET ROUTES>>>>>>>
router.use(function(req, res, next) {
    res.locals.user = req.session.user;
    res.locals.cart = req.session.cart;
    next();
  });

router.get('/', (req, res, next) => {
    
    if(req.user) res.redirect('adminpanel/logged');

    else res.render('./adminpanel/adminpanel', {title: 'Admin Panel | Login', session: req.session});
    
});

router.get('/admins', isAuth, async (req, res, next) => {

    await Admin.find({}, (err, items)=> {
        if(err) {
            req.session.msg = 'An error occured!';
            req.session.msgType = 'error';
            res.redirect('/adminpanel/logged');
        }
        res.render('./adminpanel/admins', {title: 'Admin Panel | Admins', items: items, session: req.session});
    })

});

router.get('/logged', isAuth, (req, res, next) =>{
    res.render('./adminpanel/logged', {title: 'Admin Panel', session: req.session});
});

router.get('/admins/addadmin', isAuth, (req, res, next) => {
    res.render('./adminpanel/addadmin', {title: 'Admin Panel | Add Admin', session: req.session});
});

router.get('/admins/delete/:id', isAuth, async (req,res, next) => {

    await Admin.findByIdAndRemove(req.params.id, (err) => {
        
        if (err){
            console.log(err);
            req.session.msg = 'An error occured!';
            req.session.msgType = 'error';
            return res
            .redirect('/adminpanel/admins');
        }
        req.session.msg = 'Administrator deleted!';
        req.session.msgType = 'error';
        res.redirect('/adminpanel/admins');
    })
});

router.get('/admins/edit/:id', isAuth, async (req,res, next) => {
    
    await Admin.findById(req.params.id, (err, admin) =>{
    
        if(err){
            console.log(err);
            res.redirect('/adminpanel/admins');
        } else{
    
        res.render('./adminpanel/editadmin', {title: 'Admin | Edit', admin: admin, session: req.session})   ;
            
        }
    
    })
});

router.get('/products', isAuth, async (req, res, next)=>{

    await Menu.find({}, (err, items)=> {
        if(err) {
            req.session.msg = 'An error occured!';
            req.session.msgType = 'error';
            res.redirect('/adminpanel/logged');
        }
        res.render('./adminpanel/products', {title: 'Products', items: items, session: req.session});
    })
    
    
});

router.get('/products/addproduct', isAuth, (req,res, next) => {

    res.render('./adminpanel/products/addproduct', {title: 'Add new product', session: req.session});

});

router.get('/products/remove/:productId', isAuth, async (req,res, next) => {

    await Menu.findByIdAndRemove(req.params.productId, (err) => {
        
        if (err){
            console.log(err);
            req.session.msg = 'An error occured!';
            req.session.msgType = 'error';
            return res
            .redirect('/adminpanel/products');
        }
        req.session.msg = 'Product removed!';
        req.session.msgType = 'error';
        res.redirect('/adminpanel/products');
    })
});

router.get('/products/edit/:productId', isAuth, async (req,res, next) => {
    
await Menu.findById(req.params.productId, (err, product) =>{

    if(err){
        console.log(err);
        res.redirect('/adminpanel/products');
    } else{

    res.render('./adminpanel/products/editproduct', {title: 'Edit product', product: product, session: req.session})   ;
        
    }

})

});

router.get('/orderslist', isAuth, async (req, res, next)=>{

    var date = new Date();
    year = date.getFullYear();
    month = date.getMonth();
    day = date.getDate();

    await Order.find({date: { $lt: new Date(), $gt: new Date(year,month,day) }}, (err, items)=> {
        if(err || typeof items==='undefined') {
            req.session.msg = 'An error occured!';
            req.session.msgType = 'error';
            res.redirect('/adminpanel/logged');
        }
        console.log(items);
        req.session.msg = 'Orders from today:';
        req.session.msgType = 'info';
        res.render('./adminpanel/orders/orderslist', {title: 'Orders', items: items, session: req.session});
    })
});

router.get('/orderslist/:day/:month/:year', isAuth, async (req, res, next)=>{
    

    var day = req.params.day-1;
    var month = req.params.month-1;
    var year = req.params.year;
    const start = new Date(Date.UTC(year,month,day));
    start.setUTCHours(0,0,0,1);
    const end = new Date(Date.UTC(year,month,day));
    end.setUTCHours(24,0,0,-1);
    
    if((day || month || year).isNumber == false){
        req.session.msg = 'Wrong date format!';
        req.session.msgType = 'error';
        res.redirect('/adminpanel/orderslist');
    }

    await Order.find({date:{ $gte: start , $lt: end}}, (err, items)=> {
        if(err) {
            console.log(err);
            req.session.msg = 'An error occured!';
            req.session.msgType = 'error';
            return res.redirect('/adminpanel/logged');
        }
        req.session.msg = 'Orders from ' + (day+1)+'/'+ (month+1) +'/'+ year;
        req.session.msgType = 'info';
        res.render('./adminpanel/orders/orderslist', {title: 'Orders ' + (day+1) +'.'+ (month+1)+'.'+ year, items: items, session: req.session});
    })
}); 

router.get('/orderslist/:id', isAuth, async (req, res, next)=>{

    await Order.findById(req.params.id, (err, item)=> {
        if(err) {
            console.log(err);
            req.session.msg = 'An error occured!';
            req.session.msgType = 'error';
            return res.redirect('/adminpanel/logged');
        }
        res.render('./adminpanel/orders/order', {title: 'Order ' + item._id, item: item, session: req.session});
    })

}); 

router.get('/orderslist/:id/cancel', isAuth, async (req, res, next)=>{

    await Order.findByIdAndUpdate(req.params.id, {orderStatus: 'canceled'}, {new: true}, (err, item) => {
        if(err) {
            console.log(err);
            req.session.msg = 'An error occured!';
            req.session.msgType = 'error';
            return res.redirect('/orderslist/' + item._id);
        }
        res.render('./adminpanel/orders/order', {title: 'Order ' + item._id, item: item, session: req.session});
    })

});

router.get('/orderslist/:id/refund', isAuth, async (req, res, next)=>{

    await Order.findByIdAndUpdate(req.params.id, {orderStatus: 'refund'}, {new: true}, (err, item) => {
        if(err) {
            console.log(err);
            req.session.msg = 'An error occured!';
            req.session.msgType = 'error';
            return res.redirect('/orderslist/' + item._id);
        }
        res.render('./adminpanel/orders/order', {title: 'Order ' + item._id, item: item, session: req.session});
    })

});

router.get('/kitchen-service', isAuth, async (req, res, next)=>{

    var date = new Date();
    year = date.getFullYear();
    month = date.getMonth();
    day = date.getDate();

    await Order.find({"products.item.productType":"kitchen", date: { $lt: new Date(), $gt: new Date(year,month,day)}}).sort({orderStatus: 1}).exec((err, items)=>{
        
        if(err) {
            console.log(err);
            req.session.msg = 'An error occured!';
            req.session.msgType = 'error';
            return res.redirect('/adminpanel/logged');
        }

        res.render('./adminpanel/service', {title: 'Kitchen Service', items: items, session: req.session});

        })

});

router.get('/kitchen-service/click/:id', isAuth, async (req, res, next)=>{

    await Order.findById(req.params.id, async (err, order)=> {
        if(err) {
            console.log(err);
            req.session.msg = 'An error occured!';
            req.session.msgType = 'error';
            return res.redirect('/adminpanel/kitchen-service');
        }
        var status;
        if(order.orderStatus==='awaiting') status='preparing';
        if(order.orderStatus==='preparing') status='sent';
        
        await Order.findByIdAndUpdate(req.params.id, {orderStatus:status}, (err)=> {
        if(err) {
            console.log(err);
            req.session.msg = 'An error occured!';
            req.session.msgType = 'error';
            return res.redirect('/adminpanel/kitchen-service');
        }
        return res.redirect('/adminpanel/kitchen-service');
    })
})

});

router.get('/floor-service', isAuth, async (req, res, next)=>{

    var date = new Date();
    year = date.getFullYear();
    month = date.getMonth();
    day = date.getDate();

    await Order.find({
        $or: [
          { 'orderStatus': 'preparing' },
          { 'orderStatus': 'sent' }],"products.item.productType":"kitchen", date: { $lt: new Date(), $gt: new Date(year,month,day)}}).sort({orderStatus: 1}).exec((err, items)=>{
        
        if(err) {
            console.log(err);
            req.session.msg = 'An error occured!';
            req.session.msgType = 'error';
            return res.redirect('/adminpanel/logged');
        }

        res.render('./adminpanel/service-floor', {title: 'Floor Service', items: items, session: req.session});

        })

});

router.get('/floor-service/click/:id', isAuth, async (req, res, next)=>{

    await Order.findById(req.params.id, async (err, order)=> {
        if(err) {
            console.log(err);
            req.session.msg = 'An error occured!';
            req.session.msgType = 'error';
            return res.redirect('/adminpanel/floor-service');
        }
        var status;

        if(order.orderStatus==='sent') status='completed';
        
        await Order.findByIdAndUpdate(req.params.id, {orderStatus:status}, (err)=> {
        if(err) {
            console.log(err);
            req.session.msg = 'An error occured!';
            req.session.msgType = 'error';
            return res.redirect('/adminpanel/floor-service');
        }
        return res.redirect('/adminpanel/floor-service');
    })
})

});

router.get('/failed', (req, res, next) => {
    req.session.msg = 'Failed to login!';
    req.session.msgType = 'error';
    res.redirect('/adminpanel');
});

router.get('/logout', isAuth, (req,res, next) => {

    req.logout();
    res.redirect('/adminpanel')

});

//<<<<<<POST ROUTES>>>>>>

//Logging in
router.post('/', passport.authenticate('local', { successRedirect: '/adminpanel/logged', failureRedirect: '/adminpanel/failed'}), (req, res, next) => {
});

router.post('/admins/addadmin', isAuth, async (req, res, next) => {

    var newadmin = new Admin({
        adminId: req.body.Id,
        password: await bcrypt.hash(req.body.Password, 10),
        name: req.body.Name,
        email: req.body.Email,
        phone: req.body.Phone
    });

    await Admin.findOne({ $or: [{ id: newadmin.adminId }, { email: newadmin.email }] }, async function (err, admin) {
        if (err){
            console.log(err);
            return res
            .redirect('/adminpanel/admins/addadmin', {title: 'Admin Panel | New Admin'});
        }
        if(!admin){
            try{
                await newadmin.save();
                req.session.msg = 'Admin registered! ' + newadmin.name + ' ' + newadmin.email + ' ' + newadmin.adminId + ' ' + newadmin.phone;
                req.session.msgType = 'success';
                res.redirect('/adminpanel/admins');
            } catch(err2){
                console.log(err2);
                req.session.msg = 'An error occured!';
                req.session.msgType = 'error';
                res.redirect('/adminpanel/admins');
            }

        }
        req.session.msg = 'Admin already exists!';
        req.session.msgType = 'error';
        res.redirect('/adminpanel/admins');
    });

});

router.post('/admins/edit/:id', isAuth, async (req,res, next) => {
   
    var edit = {};

    if(req.body.Id.length!=0) edit.adminId = req.body.Id;
    if(req.body.Name.length!=0) edit.name = req.body.Name;
    if(req.body.Email.length!=0) edit.email = req.body.Email;
    if(req.body.Phone.length!=0) edit.phone = req.body.Phone;

    await Admin.findByIdAndUpdate(req.params.id, edit, {new:true}, (err, changed)=>{
        if (err) {
            console.log(err);
            req.session.msg = 'An error occured!';
            req.session.msgType = 'error';
            res.redirect('/adminpanel/admins');
             }
        req.session.msg = 'Changes successfully made!';
        req.session.msgType = 'success';
        res.redirect('/adminpanel/admins');
    });

});

router.post('/products/addproduct', isAuth, async (req, res, next)=>{

    upload.single('image')(req, res, (error) => {

        if (error) {
            console.log(`upload.single error: ${error}`);
            return res.sendStatus(500);
        }
        var newproduct = new Menu({
            productName: req.body.Name,
            productDesc: req.body.Description,
            productPrice: req.body.Price,
            productType: req.body.Type,
            img: {
                data: fs.readFileSync(path.join(__dirname + '/../uploads/' + req.file.filename)),
                contentType: 'image/jpg'
            }
        });

        newproduct.save((err, product) => {
            if (err) {
                req.session.msg = 'An error occured!';
                req.session.msgType = 'error';
                res.redirect('/adminpanel/products');
            }
            req.session.msg = 'Product added!';
            req.session.msgType = 'success';
            res.redirect('/adminpanel/products');
        });

    })
});

router.post('/products/edit/:productId', isAuth, async (req,res, next) => {
   
    var edit = {};

    if(req.body.Name.length!=0) edit.productName = req.body.Name;
    if(req.body.Desc.length!=0) edit.productDesc = req.body.Desc;
    if(req.body.Price.length!=0) edit.productPrice = req.body.Price;
    if(req.body.Type.length!=0) edit.productType = req.body.Type;

    await Menu.findByIdAndUpdate(req.params.productId, edit, {new:true}, (err, changed)=>{
        if (err) {
            console.log(err);
            req.session.msg = 'An error occured!';
            req.session.msgType = 'error';
            res.redirect('/adminpanel/products/');
        }
        req.session.msg = 'Changes successfully made!';
        req.session.msgType = 'success';
        res.redirect('/adminpanel/products');
    });

});

router.post('/orderslist/getorders', (req,res,next) =>{
    res.redirect('/adminpanel/orderslist/' + req.body.day + '/' + req.body.month + '/' + req.body.year);
});
    

module.exports = router;