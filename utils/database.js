const Sequelize = require('sequelize');

const sequelize = new Sequelize('d6ffj1t93fs2po','pjzvciwbdnbghn','d85a0866e870bd18a891645a0da465cd6e4ddeaa352c4e36add6f6a47765f657', {
    host: 'ec2-54-247-71-245.eu-west-1.compute.amazonaws.com',
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
        sequelize.sync()
        .then (user => {
            successCallback();
        }).catch( err => {
            console.log(err);
            failureCallBack(err);
        });     
    }
}

exports.database = Database;
exports.sequelize = sequelize;