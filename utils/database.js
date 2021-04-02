const Sequelize = require('sequelize');

const sequelize = new Sequelize('server626040_WhiffTest','server626040_WhiffTest','Abcdef123*', {
    host: 'pgsql124.server626040.nazwa.pl',
    dialect: 'postgres',
    protocol: 'postgres',
});

class Database {
    static startRun(successCallback, failureCallBack) {
        let User = require('../model/user');
        let Sensor = require('../model/sensor');
        let SensorItem = require('../model/sensorItem');

        User.belongsToMany(Sensor, { through: SensorItem })
        Sensor.belongsToMany(User, { through: SensorItem })
        sequelize.sync({ alter: true })
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