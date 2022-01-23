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


const devsequelize = new Sequelize('da3a5ttkqjb75','aknmfhbxkdgykz','a85197736f17034381e6b4eb46914a8edbc836056e09af19c06134ce46abe2aa', {
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

const isProd = false;

class Database {


    static startRun(successCallback, failureCallBack) {
        let User = require('../model/user');
        let Sensor = require('../model/sensor');
        let SensorItem = require('../model/sensorItem');
        let Session = require('../model/session');
        let SessionItem = require('../model/sessionItem');

        User.belongsToMany(Sensor, { through: SensorItem })
        Sensor.belongsToMany(User, { through: SensorItem })
        User.belongsToMany(Session, { through: SessionItem})
        Session.belongsToMany(User, { through: SessionItem})
        if(isProd) {
            sequelize.sync({ alter: true }).then (result => {
                Database.runMigration();
                User.findAll({ raw : true, nest : true }).then( users => {
                        users.forEach( user => {
                            console.log(user.email);
                            console.log(user.id);

                        });
                    });
        
                successCallback();
            }).catch( err => {
                console.log(err);
                failureCallBack(err);
            });  
        } else {
            devsequelize.sync({ alter: true }).then (result => {
                Database.runMigration();
                User.findAll({ raw : true, nest : true }).then( users => {
                        users.forEach( user => {
                            console.log(user.email);
                            console.log(user.id);

                        });
                    });
        
                successCallback();
            }).catch( err => {
                console.log(err);
                failureCallBack(err);
            });  
        }   
    }


    static runMigration() {
        Database.addDefaultSensors();
    }

    static addDefaultSensors() {
    }
}

exports.database = Database;
exports.sequelize = isProd ? sequelize : devsequelize;