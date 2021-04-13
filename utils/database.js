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
        let User = require('../model/user');
        let Sensor = require('../model/sensor');

        Sensor.findAll().then( sensors => {
            sensors.forEach( sensor => {
                console.log(sensor.id);
                console.log(sensor.externalIdentifier);
                if(sensor.isInsideBuilding == null) {
                    console.log("migraton neeeded")
                } else {
                    console.log("migraton done")
                }
                console.log(sensor.isInsideBuilding);
                if(sensor.externalIdentifier == 97) {
                    sensor.isInsideBuilding = true;
                    sensor.save();
                }
                if(sensor.externalIdentifier == 95) {
                    sensor.isInsideBuilding = false;
                    sensor.save()
                    User.findAll().then( users => {
                        users.forEach( user => {
                            console.log(user.email);
                            console.log(user.id);
                            if(user.mainSensorId == null) {
                                user.mainSensorId = sensor.externalIdentifier;
                                user.save();
                                console.log("user saved");
    
                            } else {
                                console.log("migration already done");
    
                            }
                        })
                    });                
                }

            })

            console.log("finish");
        })

    }
}

exports.database = Database;
exports.sequelize = sequelize;