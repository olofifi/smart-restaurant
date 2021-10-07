module.exports.isAuth = (req, res, next) => {
    if(req.isAuthenticated()){
        next();
    } else {
        req.session.msgType = 1;
        req.session.msg = 'You cannot see this content';
        res.render('./adminpanel/adminpanel', {title: 'Admin Panel', session: req.session})
    }
}