const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');

const database = require('./utils/database');
const sensorsRoutes = require('./routes/sensors');
const userRoutes = require('./routes/user');

const app = express();

app.use(bodyParser.urlencoded({extended: false}));
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

