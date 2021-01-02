const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');

const authentication = require('./utils/authentication');
const database = require('./utils/database');
const sensorsRoutes = require('./routes/sensors');
const userRoutes = require('./routes/user');

const app = express();

app.use((req, res, next) =>  {
    return authentication.authentication.authorize(req, res, next)
})


app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(sensorsRoutes.routes);
app.use(userRoutes.routes);

app.use((req, res, next) => {
    res.status(200).json({"message": "Hello World"});
 });

 database.database.startRun( () => {
    app.listen(process.env.PORT || 3000);
}, (error) => {
    console.log(err);
})

