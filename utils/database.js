const Sequelize = require('sequelize');

const sequelize = new Sequelize('drupej0sbsdo6','ejmzumbjcgtdon','3c885eae5a43a59008945f08c0cd729e43ddbef47dd465cbaa59ef4bc1f48992', {
    host: 'ec2-52-50-171-4.eu-west-1.compute.amazonaws.com',
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false 
          }
    } 
});

class Database {
    static startRun(successCallback, failureCallBack) {
        let User = require('../model/user');
        let Sensor = require('../model/sensor');
        let SensorItem = require('../model/sensorItem');

        User.belongsToMany(Sensor, { through: SensorItem })
        Sensor.belongsToMany(User, { through: SensorItem })
        sequelize.sync({ alter: true }).then (result => {
            Database.runMigration();
            successCallback();
        }).catch( err => {
            console.log(err);
            failureCallBack(err);
        });     
    }


    static runMigration() {
        Database.addDefaultSensors();
    }

    static addDefaultSensors() {
    }
}

exports.database = Database;
exports.sequelize = sequelize;