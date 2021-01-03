const Sequelize = require('sequelize');

const sequelize = new Sequelize('da3a5ttkqjb75','aknmfhbxkdgykz','a85197736f17034381e6b4eb46914a8edbc836056e09af19c06134ce46abe2aa', {
    host: 'ec2-34-253-148-186.eu-west-1.compute.amazonaws.com',
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