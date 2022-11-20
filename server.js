const express = require('express');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const MongoDBSession = require('connect-mongodb-session')(session);
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

const UserModel = require('./models/User');

const mongoURI = 'mongodb://localhost:27017/sessions';


/** START OF MIDDLEWARE SECTION */

/*
mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
}).then( res => console.log('MongoDB Connected'));
*/
mongoose.connect(mongoURI).then(res => console.log('MongoDB Connected'));

const store = new MongoDBSession({
    uri: mongoURI,
    collection: 'mySessions'
});


app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname+'/public'));
app.use(cors({
    origin: ['https://localhost:3000']
}));
app.use(session({
    secret: 'key that will sign the cookie',
    resave: false,
    saveUninitialized: false,
    store: store
}));

/** END OF MIDDLEWARE SECTION */

const isAuth = (req, res, next) => {

    if (req.session.isAuth) {
        res.redirect('/' + req.session.userType)
    } else {
        res.redirect('/login');
    }
}

app.get('/seller', (req, res) => {
    res.render('sellerPage');
})

app.get('/customer', (req, res) => {
    res.render('customerPage');
})

app.get('/', (req, res) => {
    res.render('landing');
});

app.get('/login', (req, res) => {
    res.render('login');
})

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const user = await UserModel.findOne({ email });

    if (!user) {
        return res.redirect('/login');
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        return res.redirect('/login');
    }

    req.session.isAuth = true;
    req.session.userType = user.usertype;
    req.session.userID = user._id;
    res.redirect('/home');

});

app.get('/register', (req, res) => {
    res.render('register');
})

app.post('/register', async (req, res) => {
    const { username, email, password, usertype } = req.body;
    let user = await UserModel.findOne({ email });

    if (user) {
        return res.redirect('/register');
    }

    const hashedPsw = await bcrypt.hash(password, 12);

    user = new UserModel({
        username,
        email,
        usertype,
        password: hashedPsw,
        cart: []
    });

    await user.save();

    res.redirect('/login');

});

app.get('/home', isAuth, (req, res) => {
})

app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) throw err;
        res.redirect('/');
    })
});

app.get('/retrievecart', async (req, res) => {
    const user = await UserModel.findOne({ _id: req.session.userID });
    return res.send(user.cart);
})

app.get('/cart', (req, res) => {
    res.render('cartPage');
});

app.post('/addtocart', async (req, res) => {
    const user = await UserModel.findOne({ _id: req.session.userID });
    user.cart.push(
        {'productName': 'Dressed Chicken'}
    );
    console.log(user.cart);
    await user.save();
})

app.listen(3000, console.log('Server Running on http://localhost:3000'))