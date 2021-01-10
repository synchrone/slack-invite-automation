const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const i18n = require("i18n");
const parseAcceptLanguage = require('parse-accept-language');

const config = require('./config');
const routes = require('./routes/index');
const events = require('./routes/events')
const app = express();
app.set('trust proxy', 'loopback, linklocal, uniquelocal')

const Twig = require('twig');
Twig.cache(config.cacheTemplates)
Twig.extendFunction("env", (value) => process.env[value]);
Twig.extendFunction("log", console.log);
Twig.extendFunction("__", function () {
    return i18n.__(...arguments);
});

function requireHTTPS(req, res, next) {
    // The 'x-forwarded-proto' check is for Heroku
    if (!req.secure && req.get('x-forwarded-proto') !== 'https' && process.env.NODE_ENV !== "development") {
        return res.redirect('https://' + req.get('host') + req.url);
    }
    next();
}

i18n.configure({
    locales: ['ru', 'en'],
    defaultLocale: "en",
    autoReload: process.env.NODE_ENV === 'development',
    directory: __dirname + '/locales'
});

i18n.setLocale(config.locale);

// default: using 'accept-language' header to guess language settings
app.use(i18n.init);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'twig');
app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
if(config.requireHttps) {
    app.use(requireHTTPS);
}

app.use(express.static(path.join(__dirname, 'public')));
app.use(config.eventsPath, events)
app.use(config.subpath, routes)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    const err = new Error(req.i18n.t('Not Found'));
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('index.twig', {
            message: err.message,
            hasFailed: true
        });
    });
}


// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('index.twig', {
        message: err.message,
        hasFailed: true
    });
});


module.exports = app;
