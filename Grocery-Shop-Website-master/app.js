var express               = require("express");
var app                   = express();
var riceProducts          = require("./productsData/riceProducts");
var sugarProducts         = require("./productsData/sugarProducts");
var jaggeryProducts       = require("./productsData/jaggeryProducts");
var pulsesProducts        = require("./productsData/pulsesProducts");
var channaProducts        = require("./productsData/channaProducts");
var newProducts           = require("./productsData/newProducts");
var mongoose              = require("mongoose");
var bodyParser            = require("body-parser");
var passport              = require("passport");
var LocalStrategy         = require("passport-local");
var passportLocalMongoose = require("passport-local-mongoose");
var flash                 = require("connect-flash");
var methodOverride        = require("method-override");
var nodemailer            = require("nodemailer");
var dotenv                = require("dotenv");

dotenv.config();
    
// mongoose.connect("mongodb://localhost:27017/grocerry_shop_db",{useNewUrlParser:true});
mongoose.connect(process.env.DATABASEURL,{useNewUrlParser:true});
mongoose.set('useFindAndModify', false);

var historySchema = new mongoose.Schema({
    product: String,
    quantity: String,
    typeOfDelivery: String,
    want_to_know_currentPrice: String,
    date: {type: Date, default: Date.now()}
 });

var History = mongoose.model("History", historySchema);

var commentSchema = mongoose.Schema({
    text: String,
    starValue: Number,
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    }
});

var Comment = mongoose.model("Comment", commentSchema);

var customerSchema = new mongoose.Schema({
    name: String,
    email: String,
    contact: Number,
    message: String
});

var Customer = mongoose.model("Customer", customerSchema);

var UserSchema = new mongoose.Schema({
    username: String,
    password: String,
    fname: String,
    lname: String,
    contact: String,
    email: String,
    addressl1: String,
    addressl2: String,
    history: [
        historySchema
    ],
    comments: [
        commentSchema
    ]
});

UserSchema.plugin(passportLocalMongoose);

var User = mongoose.model("User", UserSchema);

app.set("view engine", "ejs");

app.use(flash());

app.use(methodOverride("_method"));

app.use(express.static(__dirname + "/public"));

app.use(bodyParser.urlencoded({extended: true}));

app.use(require("express-session")({
    secret: "This is secret code",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

// Routes

app.get("/",function(req, res){
    Comment.find({},function(err,comments){
        if(err){
            req.flash("error", "Something Went Wrong, Try Again.")
            res.redirect("back");
        }else{
            res.render("landing", {comments:comments});
        }
    });
});

app.get("/products/rice",isLoggedIn, function(req, res){
    res.render("products/rice",{riceProducts:riceProducts});
});

app.get("/products/sugar",isLoggedIn, function(req, res){
    res.render("products/sugar",{sugarProducts:sugarProducts});
});

app.get("/products/jaggery",isLoggedIn, function(req, res){
    res.render("products/jaggery",{jaggeryProducts:jaggeryProducts});
});

app.get("/products/pulses",isLoggedIn, function(req, res){
    res.render("products/pulses",{pulsesProducts:pulsesProducts});
});

app.get("/products/channa",isLoggedIn, function(req, res){
    res.render("products/channa",{channaProducts:channaProducts});
});

app.get("/products/new",isLoggedIn, function(req, res){
    res.render("products/new",{newProducts:newProducts});
});

app.post("/products/:product", function(req, res){
    History.create({
        product: req.body.title,
        quantity: req.body.quantity + " " + req.body.unit,
        typeOfDelivery: req.body.typeOfDelivery,
        want_to_know_currentPrice: req.body.currentPrice
    },function(err, history){
        if(err){
            req.flash("error", "Something Went Wrong, Try Again.")
            res.redirect("back");
        }
        User.findOne({username: req.user.username},function(err, user){
            if(err){
                req.flash("error", "Something Went Wrong, Try Again.")
                res.redirect("back");
            }else{
                user.history.push(history);
                user.save(function(err, data){
                    if(err){
                        req.flash("error", "Something Went Wrong, Try Again.")
                        res.redirect("back");
                    }
                });
            }
        });
    });

    const output1 = `
    <section style="max-width: 650px; border: 1px solid rgba(0,0,0,0.2); margin: 40px auto; background-color: rgba(0,0,0,0.04)" id="product" >
        <div style="width: 95%; margin: 5px auto !important" class="msg">
            <h2 style="color: #fff; font-size: 2rem; font-weight: 500; width: 100%; text-align: center; margin-top: 15px !important; padding: 10px 0px !important; background-color: steelblue">PRODUCT ENQUIRY</h2>
            <p style="font-size: 1.2rem; font-weight: 500; color: rgb(145, 93, 58)">Hello Mr/Mrs ${req.user.fname+" "+req.user.lname}, Your product enquiry about '${req.body.title}' is successfully submited.</p>
            <p style="font-size: 1.2rem; font-weight: 500; color: rgb(145, 93, 58)">Thank you for choosing us, We will contact you soon.</p>
            <p style="font-size: 1.2rem; font-weight: 700; color: rgb(145, 93, 58)">Regards,</p>
            <p style="font-size: 1.2rem; font-weight: 700; color: rgb(145, 93, 58)">SADGURU RICE TRADERS</p>
        </div>
    </section>
    `;

    // create reusable transporter object using the default SMTP transport
    let transporter1 = nodemailer.createTransport({
        // host: 'mail.google.com',
        // port: 587,
        // secure: false, // true for 465, false for other ports
        service: 'gmail',
        auth: {
            user: process.env.EMAIL, // generated ethereal user
            pass: process.env.PASSWORD  // generated ethereal password
        },
        tls:{
            rejectUnauthorized:false
        }
    });

    // setup email data with unicode symbols
    let mailOptions1 = {
        from: '"SADGURU RICE TRADERS" <process.env.EMAIL>', // sender address
        to: req.user.email, // list of receivers
        subject: 'Product Enquiry', // Subject line
        text: 'Hello world?', // plain text body
        html: output1 // html body
    };

    // send mail with defined transport object
    transporter1.sendMail(mailOptions1, (error, info) => {
        if (error) {
            console.log(error);
            req.flash("error", "Something Went Wrong, Try Again.");
            res.redirect("back");
        }else{
            console.log('Message sent: %s', info.messageId);   
            console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        }
    });       

    const output = `
    <section style="max-width: 650px; border: 1px solid rgba(0,0,0,0.2); margin: 40px auto; background-color: rgba(0,0,0,0.04)" id="product" >
        <div style="width: 95%; margin: 5px auto !important" class="msg">
            <h2 style="color: #fff; font-size: 2rem; font-weight: 500; width: 100%; text-align: center; margin-top: 15px !important; padding: 10px 0px !important; background-color: steelblue">PRODUCT ENQUIRY</h2>
            <p style="font-size: 1.2rem; font-weight: 500; color: rgb(145, 93, 58)">One of our customer Mr/Mrs ${req.user.fname+" "+req.user.lname} is Interested in '${req.body.title}'</p>
            <h3 style="font-size: 1.2rem; color: rgb(26, 5, 49)">Enquiry Details :</h3>
            <ul style="font-size: 1rem">  
                <li>Product: ${req.body.title}</li>
                <li>Quantity: ${req.body.quantity + " " + req.body.unit}</li>
                <li>Delivery Preference: ${req.body.typeOfDelivery}</li>
                <li>Want to know Current Price: ${req.body.currentPrice}</li>
            </ul>
            <h3 style="font-size: 1.2rem; color: rgb(26, 5, 49)">Customer Contact Details :</h3>
            <ul style="font-size: 1rem">  
                <li>Name: ${req.user.fname+" "+req.user.lname}</li>
                <li>Email: ${req.user.email}</li>
                <li>Contact No: ${req.user.contact}</li>
                <li>Address Line-1: ${req.user.addressl1}</li>
                <li>Address Line-2: ${req.user.addressl2}</li>
            </ul>
        </div>
    </section>
    `;

    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        // host: 'mail.google.com',
        // port: 587,
        // secure: false, // true for 465, false for other ports
        service: 'gmail',
        auth: {
            user: process.env.EMAIL, // generated ethereal user
            pass: process.env.PASSWORD  // generated ethereal password
        },
        tls:{
            rejectUnauthorized:false
        }
    });

    // setup email data with unicode symbols
    let mailOptions = {
        from: '"SADGURU RICE TRADERS" <process.env.EMAIL>', // sender address
        to: 'pratikbhosale773@gmail.com', // list of receivers
        subject: 'Product Enquiry', // Subject line
        text: 'Hello world?', // plain text body
        html: output // html body
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
            req.flash("error", "Something Went Wrong, Try Again.");
            res.redirect("back");
        }else{
            console.log('Message sent: %s', info.messageId);   
            console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
            req.flash("success", "Thank You for choosing Us. We will contact you shortly.");
            res.redirect("/products/"+req.params.product);
        }
    });  
});

app.get("/about_us", function(req, res){
    res.render("about_us");
});

app.get("/contact_us", function(req, res){
    res.render("contact_us");
});

app.post("/contact_us", function(req, res){
    Customer.create(req.body, function(err, customer){
        if(err){
            req.flash("error", "Something Went Wrong, Try Again.");
            res.redirect("back");
        }
    });

    const output1 = `
    <section style="max-width: 650px; border: 1px solid rgba(0,0,0,0.2); margin: 40px auto; background-color: rgba(0,0,0,0.04)" id="contact_request" >
        <div style="width: 95%; margin: 5px auto !important" class="msg">
            <h2 style="color: #fff; font-size: 2rem; font-weight: 500; width: 100%; text-align: center; margin-top: 15px !important; padding: 10px 0px !important; background-color: steelblue">CONTACT REQUEST</h2>
            <p style="font-size: 1.2rem; font-weight: 500; color: rgb(145, 93, 58)">Hello Mr/Mrs ${req.body.name}, Your contact request is successfully submited.</p>
            <p style="font-size: 1.2rem; font-weight: 500; color: rgb(145, 93, 58)">Thank you for choosing us, We will contact you soon.</p>
            <p style="font-size: 1.2rem; font-weight: 700; color: rgb(145, 93, 58)">Regards,</p>
            <p style="font-size: 1.2rem; font-weight: 700; color: rgb(145, 93, 58)">SADGURU RICE TRADERS</p>
        </div>
    </section>
    `;

    // create reusable transporter object using the default SMTP transport
    let transporter1 = nodemailer.createTransport({
        // host: 'mail.google.com',
        // port: 587,
        // secure: false, // true for 465, false for other ports
        service: 'gmail',
        auth: {
            user: process.env.EMAIL, // generated ethereal user
            pass: process.env.PASSWORD  // generated ethereal password
        },
        tls:{
            rejectUnauthorized:false
        }
    });

    // setup email data with unicode symbols
    let mailOptions1 = {
        from: '"SADGURU RICE TRADERS" <process.env.EMAIL>', // sender address
        to: req.body.email, // list of receivers
        subject: 'Contact Request', // Subject line
        text: 'Hello world?', // plain text body
        html: output1 // html body
    };

    // send mail with defined transport object
    transporter1.sendMail(mailOptions1, (error, info) => {
        if (error) {
            console.log(error);
            req.flash("error", "Something Went Wrong, Try Again.");
            res.redirect("back");
        }else{
            console.log('Message sent: %s', info.messageId);   
            console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        }
    });       

    const output = `
    <section style="max-width: 650px; border: 1px solid rgba(0,0,0,0.2); margin: 40px auto; background-color: rgba(0,0,0,0.04)" id="contact_request" >
        <div style="width: 95%; margin: 5px auto !important" class="msg">
            <h2 style="color: #fff; font-size: 2rem; font-weight: 500; width: 100%; text-align: center; margin-top: 15px !important; padding: 10px 0px !important; background-color: steelblue">CUSTOMER CONTACT REQUEST</h2>
            <p style="font-size: 1.2rem; font-weight: 500; color: rgb(145, 93, 58)">One of our customer want to interact with us...</p>
            <h3 style="font-size: 1.2rem; color: rgb(26, 5, 49)">Contact Details :</h3>
            <ul style="font-size: 1rem">  
                <li>Name: ${req.body.name}</li>
                <li>Email: ${req.body.email}</li>
                <li>Contact No: ${req.body.contact}</li>
            </ul>
            <h3 style="font-size: 1.2rem; color: rgb(26, 5, 49)">Message :</h3>
            <p style="font-size: 1rem">${req.body.message}</p>
        </div>
    </section>
    `;

    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        // host: 'mail.google.com',
        // port: 587,
        // secure: false, // true for 465, false for other ports
        service: 'gmail',
        auth: {
            user: process.env.EMAIL, // generated ethereal user
            pass: process.env.PASSWORD  // generated ethereal password
        },
        tls:{
            rejectUnauthorized:false
        }
    });

    // setup email data with unicode symbols
    let mailOptions = {
        from: '"SADGURU RICE TRADERS" <process.env.EMAIL>', // sender address
        to: 'pratikbhosale773@gmail.com', // list of receivers
        subject: 'Customer Contact Request', // Subject line
        text: 'Hello world?', // plain text body
        html: output // html body
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
            req.flash("error", "Something Went Wrong, Try Again.");
            res.redirect("back");
        }else{
            console.log('Message sent: %s', info.messageId);   
            console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
            req.flash("success", "Message has been send successfully.");
            res.redirect("/contact_us");
        }
    });   
});

app.get("/login", function(req, res){
    res.render("login");
});

app.post("/login", passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    successFlash: "You have Sign In successfully.",
    failureFlash: "Invalid username or password."
}) ,function(req, res){
});

app.get("/logout", function(req, res){
    req.logout();
    req.flash("success", "You have Log Out Successfully.");
    res.redirect("/");
});

app.get("/signup", function(req, res){
    res.render("signup");
});

app.post("/signup", function(req, res){
    User.register(new User({username: req.body.username, fname: req.body.fname, lname: req.body.lname, email: req.body.email, contact: req.body.contact, addressl1: req.body.addressl1, addressl2: req.body.addressl2}), req.body.password, function(err, user){
        if(err){
            req.flash("error", err.message);
            res.redirect("/signup");
        }
        passport.authenticate("local")(req, res, function(){
            const output1 = `
            <section style="max-width: 650px; border: 1px solid rgba(0,0,0,0.2); margin: 40px auto; background-color: rgba(0,0,0,0.04)" id="product" >
                <div style="width: 95%; margin: 5px auto !important" class="msg">
                    <h2 style="color: #fff; font-size: 2rem; font-weight: 500; width: 100%; text-align: center; margin-top: 15px !important; padding: 10px 0px !important; background-color: steelblue">WELCOME</h2>
                    <p style="font-size: 1.2rem; font-weight: 500; color: rgb(145, 93, 58)">Hello Mr/Mrs ${req.user.fname+" "+req.user.lname}, Welcome to Sadguru Rice Traders...</p>
                    <p style="font-size: 1.2rem; font-weight: 500; color: rgb(145, 93, 58)">Thank you for choosing us, We are the best Rice wholesalers in Navi Mumbai. Along with Rice we also sale best quality products like Sugar, Jaggery, Pulses, etc.</p>
                    <a href="https://sadguru-rice-traders.herokuapp.com/" style="font-size: 1.1rem; font-weight: 500">Click Here To Know More About Us</a>
                    <p style="font-size: 1.2rem; font-weight: 700; color: rgb(145, 93, 58)">Regards,</p>
                    <p style="font-size: 1.2rem; font-weight: 700; color: rgb(145, 93, 58)">SADGURU RICE TRADERS</p>
                </div>
            </section>
            `;

            // create reusable transporter object using the default SMTP transport
            let transporter1 = nodemailer.createTransport({
                // host: 'mail.google.com',
                // port: 587,
                // secure: false, // true for 465, false for other ports
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL, // generated ethereal user
                    pass: process.env.PASSWORD  // generated ethereal password
                },
                tls:{
                    rejectUnauthorized:false
                }
            });

            // setup email data with unicode symbols
            let mailOptions1 = {
                from: '"SADGURU RICE TRADERS" <process.env.EMAIL>', // sender address
                to: req.user.email, // list of receivers
                subject: 'Welcome', // Subject line
                text: 'Hello world?', // plain text body
                html: output1 // html body
            };

            // send mail with defined transport object
            transporter1.sendMail(mailOptions1, (error, info) => {
                if (error) {
                    console.log(error);
                    req.flash("error", "Something Went Wrong, Try Again.");
                    res.redirect("back");
                }else{
                    console.log('Message sent: %s', info.messageId);   
                    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
                }
            });       
            req.flash("success", "You have registered successfully.");
            res.redirect("/");
        });
    });
});

app.get("/comments/new", isLoggedIn, function(req, res){
    res.render("comments/new");
});

app.post("/comments", isLoggedIn, function(req, res){
    Comment.create(req.body, function(err, comment){
        if(err){
            req.flash("error", "Something Went Wrong, Try Again.")
            res.redirect("back");
        }else{
            comment.author.id = req.user._id;
            comment.author.username = req.user.username;
            comment.save(function(err, comment){
                if(err){
                    req.flash("error", "Something Went Wrong, Try Again.")
                    res.redirect("back");
                }else{
                    User.findOne({username: req.user.username},function(err, user){
                        if(err){
                            req.flash("error", "Something Went Wrong, Try Again.")
                            res.redirect("back");
                        }else{
                            user.comments.push(comment);
                            user.save();
                            req.flash("success", "Review added successfully.")
                            res.redirect("/");
                        }
                    });
                }
            });
        }
    });
});

app.get("/edit-comments/:id", isCommentOwner, function(req, res){
    Comment.findById(req.params.id, function(err, comment){
        if(err){
            req.flash("error", "Something Went Wrong, Try Again.")
            res.redirect("back");
        }else{
            res.render("comments/edit", {comment: comment});
        }
    });
});

app.put("/comments/:id", isCommentOwner, function(req, res){
    Comment.findByIdAndUpdate(req.params.id, req.body, function(err, comment){
        if(err){
            req.flash("error", "Something Went Wrong, Try Again.")
            res.redirect("back");
        }else{
            req.flash("success", "Review updated successfully.");
            res.redirect("/");
        }
    });
});

app.delete("/comments/:id", isCommentOwner, function(req, res){
    Comment.findByIdAndRemove(req.params.id, function(err){
        if(err){
            req.flash("error", "Something Went Wrong, Try Again.")
            res.redirect("back");
        }
        else{
            req.flash("success", "Review deleted successfully");
            res.redirect("/");
        }
    });
});

app.get("*",function(req, res){
    res.render("error");
});

// Middlewares

function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error", "You must be Sign In first.");
    res.redirect("/login");
}

function isCommentOwner(req, res, next) {
    if(req.isAuthenticated()){
        Comment.findById(req.params.id, function(err, foundComment){
            if(err){
                req.flash("error", "Something Went Wrong, Try Again.")
                res.redirect("back");
            }else{
                if(foundComment.author.id.equals(req.user._id)) {
                    next();
                } else {
                    req.flash("error", "You don't have permission to do that");
                    res.redirect("back");
                }
            }
        });
    } else {
        req.flash("error", "You must be Sign In first.");
        res.redirect("/login");
    }
}

app.listen(process.env.PORT || 1000, function(){
    console.log("Server started...");
});