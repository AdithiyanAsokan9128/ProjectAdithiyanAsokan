// import dependencies 
const express = require('express');
const path = require('path');
const fileUpload = require('express-fileupload');
const { check, validationResult } = require('express-validator');

// set up the DB connection
//const mongoose = require('mongoose');
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/gadget', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
const session = require('express-session');
const { name } = require('ejs');
const { connect } = require('http2');
// set up the model for the order

// set up the model for admin
const Admin = mongoose.model('Admin', {
    username: String,
    password: String
});
const Page = mongoose.model('Page', {
    title: String,
    image: String,
    content: String
});
// set up session

var myAssign = express();

myAssign.use(session({
    secret: 'adithiyanasokan',
    resave: false,
    saveUninitialized: true
}));
myAssign.use(express.urlencoded({ extended: false }));

myAssign.set('views', path.join(__dirname, 'views'));
myAssign.use(express.static(__dirname + '/public'));


myAssign.set('view engine', 'ejs');
myAssign.use(fileUpload());
//rendering login page
myAssign.get('/', function (req, res) {
    Page.find({}).exec(function (err, pages) {
        res.render('login', { pages: pages }); 
    });
})
//Authenticating Login and password
myAssign.post('/', function (req, res) {
    var user = req.body.username;
    var pass = req.body.password;

    Admin.findOne({ username: user, password: pass }).exec(function (err, admin) {
        // log any errors
        console.log('Error: ' + err);
        console.log('Admin: ' + admin);
        if (admin) {
            //store username in session and set logged in true
            req.session.username = admin.username;
            req.session.userLoggedIn = true;
            // redirect to the dashboard
            res.redirect('/dashboard');
        }
        else {
            res.render('login', { error: 'Sorry, cannot login' });
        }

    });

});
//rendering dashboard
myAssign.get('/dashboard', function (req, res) {
    Page.find({}).exec(function (err, pages) {
        res.render('dashboard', {pages: pages}); 
    });
})
//rendering addpage
myAssign.get('/addpage', function (req, res) {
    Page.find({}).exec(function (err, pages) {
        res.render('addpage', { pages: pages }); 
    });
})
//getting values from the add pages
myAssign.post('/process', function (req, res) {
    Page.find({}).exec(function(err, pages){
        var title = req.body.title; 
        var content = req.body.content;

        //fetch and save the 

        // getting the name of the file
        var imageName = req.files.image.name;
        // get the actual image file 
        var ImageFile = req.files.image;

        console.log(imageName);
        
        var ImagePath = 'public/uploads/' + imageName;
        // move temp file to the correct folder (public folder)
        ImageFile.mv(ImagePath, function (err) {
            console.log(err);
        });

        // create an object with the fetched data to send to the view
        var pageData = {
            title : title,
            content : content,
            imageName: imageName,
        }
       


        // save data to database
        var myPage = new Page(pageData); 
        myPage.save();
        res.render('page', {
            title : title,
            content : content,
            imageName: imageName,
            pages:pages
        });    
        // send the data to the view and render it      
   
    });
});

myAssign.get('/allpages',function(req, res){
    // check if the user is logged in
    if(req.session.userLoggedIn){
        Page.find({}).exec(function(err, pages){
            res.render('allpages', {pages:pages});
        });
    }
    else{ // otherwise send the user to the login page
        res.redirect('/login');
    }
});
//rendering logout page
myAssign.get('/logout', function (req, res) {
    Page.find({}).exec(function (err, pages) {
        res.render('logout', {pages: pages});  
    });
})

//rendering the added page
myAssign.get('/:pageid', function(req,res){
    Page.find({}).exec(function(err, pages){
        var pageId = req.params.pageid;
        console.log(pageId);
        Page.findOne({_id: pageId}).exec(function(err,page){
            console.log('Error: ' + err);
            console.log('Page found: ' + page);

            if(page){
                res.render('page', {
                    title : page.title,
                    content : page.content,
                    imageName: page.imageName,
                    pages: pages,
                });
            }
            else{
                res.send('404: Sorry buddy you are in wrong place.');
            }
        });
    });
});

//edit
myAssign.get('/edit/:pageid', function(req, res){
    // check if the user is logged in
    if(req.session.userLoggedIn){
        Page.find({}).exec(function(err, pages){
        var pageId = req.params.pageid;
        console.log(pageId);
        Page.findOne({_id: pageId}).exec(function(err, page){
            console.log('Error: ' + err);
            console.log('Page: ' + page);
            if(page){
                res.render('edit', {page:page,pages:pages});
            }
            else{
                res.send('No order found with that id...');
            }
        });
    });
    }
    else{
        res.redirect('/login');
    }
});

//edited data saves into the data base
myAssign.post('/edit/:id',function(req, res){

    const errors = validationResult(req);
    if (!errors.isEmpty()){
        //console.log(errors); // check what is the structure of errors

        var pageid = req.params.id;
        Page.findOne({_id: pageid}).exec(function(err, page){
            console.log('Error: ' + err);
            console.log('Page: ' + page);
            if(page){
                res.render('edit', {page:page, pages:pages, errors:errors.array()});
            }
            else{
                res.send('No order found with that id...');
            }
        });

    }
    else{
        var title = req.body.title; 
        var content = req.body.content;

        Page.find({}).exec(function(err, pages){
        var id = req.params.id;
        Page.findOne({_id:id}, function(err, page){
            page.title = title;
            page.content = content;
            page.save();   
            res.render('editsuccess', {pages:pages, message:'Page created successfully'});  
        });
    });
    }
});

//deleting the page
myAssign.get('/delete/:pageid', function(req, res){
    // check if the user is logged in
    if(req.session.userLoggedIn){
        //delete
        var pageId = req.params.pageid;
        console.log(pageId);
        Page.findByIdAndDelete({_id: pageId}).exec(function(err, page){
            console.log('Error: ' + err);
            console.log('page: ' + page);
            res.render('delete');
          
        });
    }
    else{
        res.redirect('/login');
    }
});

myAssign.listen(process.env.PORT || 8080);

console.log('execution done');