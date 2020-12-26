const path = require('path');
const express = require('express');
const database = require('./utils/database');

const app = express();

app.use((req, res, next) => {
    res.status(200).json({"message": "Hello World"});
 });


 database.database.startRun( () => {
    app.listen(process.env.PORT || 3000);
}, (error) => {
    console.log(err);
})

