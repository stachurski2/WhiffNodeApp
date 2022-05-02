const Sensor = require('../model/sensor');
const User = require("../model/user");
const Request = require('request');
var dayjs = require('dayjs');
var utc = require('dayjs/plugin/utc');



var timezone = require('timezone');

const primaryDataUrl = "https://www.airqlab.pl/pag_api.php?"
const startDateParamaterName = "DateFrom=\""
const endDateParamaterName = "\"&DateTo=\"" 
const deviceParameterUrl = "\"&DeviceId="

const primaryDataHistoricalUrl = "https://www.airqlab.pl/pgh_api.php?"
const startDateParameterHistoricalUrl = "StartDate=\""
const endDateParameterHistoricalUrl = "\"&EndDate=\"" 
const deviceParameterHistoricalUrl = "\"&DeviceId="


exports.getSensorListForUser = (req, res, next) => {
    let userId = req.user.id 
    if(userId != null) {
        return User.findOne({ where: { id: userId }}).then( user => {
            if(user) {
                user.getSensors().then( sensors => {
                    let sensorsJson = sensors.map( sensor => { return sensor.toJSON()})
                    sensorsJson.forEach( sensor => {
                        delete sensor['id']
                        delete sensor['createdAt']
                        delete sensor['updatedAt']
                        delete sensor['SensorItem']
                        delete sensor['key']
                    })
                    res.status(200).json({"sensors":sensorsJson});
                })
            } else {
                res.status(400).json({"message": "Didn't find user with requested id."});
            }
        })
    } else {
        res.status(400).json({"message": "You didn't set userId parameter in body."});
    }
};

exports.getAllSensors = (req, res, next) => {
    if(req.user.isAdmin == true) {
        return Sensor.findAll({ raw : true, nest : true }).then( sensors => {
            sensors.forEach( sensor => {
                delete sensor['id']
                delete sensor['createdAt']
                delete sensor['updatedAt']
            })
            res.status(200).json({"sensors":sensors});
         })
    } else {
        res.status(403).json({"message": "No rights to this operation."});
    }
};

exports.getDataFromSensor = (req, res, next) => {
    let sensorId = req.query.sensorId 
    let startDate = req.query.startDate
    let endDate = req.query.endDate
    if(sensorId != null) {
        if(startDate) {
            if(endDate) {
                 var url = obtainHistoricalDataUrl(startDate, endDate, sensorId);
                 Request(url, { json: true }, (err, response, body) => {
                    if (err) { 
                        res.status(500).json({"message":"Couldn't connect to data provider"})
                        return;
                    }
                    if(response.body) {
                        res.status(200).json({ "data": response.body });
                        return;
                    } else {
                        res.status(500).json({"message":"Couldn't get to data provider"})    
                        return;              
                    }  
                  });
            } else {
                res.status(400).json({"message": "You didn't set endDate parameter in body."});
            }
        } else {
            res.status(400).json({"message": "You didn't set startDate parameter in body."});
        }   
    } else { 
        res.status(400).json({"message": "You didn't set sensorId parameter in body."});
   }
}

exports.getLastPieceOfDataFromSensor = (req, res, next) => {
    const sensorId = req.query.sensorId 
;
    if(sensorId != null) {
        return Sensor.findOne({ where: { externalIdentifier: sensorId }}).then( sensor => {
            if(sensor) {
                let currentDate = new dayjs().add(sensor.locationTimeZone, 'hour');
                if(sensor.locationTimeZone) {
                    currentDate.add(sensor.locationTimeZone, 'hour');
                }
                const endDate = currentDate.add(2,'hour').format('YYYY-MM-DD HH:mm:ss');
                const startDate = currentDate.add(-2,'hour').format('YYYY-MM-DD HH:mm:ss');
                var url = obtainDataUrl(startDate, endDate, sensorId);
                Request(url, { json: true }, (err, response, body) => {
                    if (err) { 
                        res.status(500).json({"message":"Couldn't connect to data provider"})
                        return;
                    }
                    if(response.body["measures"]) {
                        res.status(200).json({ "data": response.body["measures"][response.body["measures"].length - 1]});
                        return;
                    } else {
                        res.status(500).json({"message":"Couldn't get to data provider"})    
                        return;              
                    }  
                  });
            } else {
                res.status(400).json({"message": "Didn't find sensor with requested external id."});
                return 
            }

        })
    } else { 
        res.status(403).json({"message": "You didn't set sensorId parameter in body."});
   }
}

exports.currentStateData = (req, res, next) => {
    let userId = req.user.id 
    if(userId != null) {
        return User.findOne({ where: { id: userId }}).then( user => {
            if(user) {
                if(user.mainSensorId != null) {
                    let currentDate = new Date()
                    const sensorId = user.mainSensorId;
                    if(sensorId) {
                        return Sensor.findOne({ where: { externalIdentifier: sensorId }}).then( sensor => {
                            if(sensor) {
                                if(sensor.locationTimeZone) {
                                    currentDate.setHours(currentDate.getHours() + sensor.locationTimeZone);
                                }
                                currentDate.setHours(currentDate.getHours() + 2);
                                let endDate = currentDate.toISOString().replace(/T/, ' ').replace(/\..+/, '')
                                currentDate.setHours(currentDate.getHours() - 4);
                                let startDate = currentDate.toISOString().replace(/T/, ' ').replace(/\..+/, '')
                                var url = obtainDataUrl(startDate, endDate, sensorId);
                                Request(url, { json: true }, (err, response, body) => {
                                    if (err) { 
                                        res.status(500).json({"message":"Couldn't connect from data provider"})
                                        return;
                                    }
                                    if(response.body["measures"]) {
                                        res.status(200).json({ "data": response.body["measures"][response.body["measures"].length - 1]});
                                        return;
                                    } else {
                                        res.status(500).json({"message":"Couldn't get data from provider"})    
                                        return;              
                                    }  
                                  });
                            } else {
                                res.status(400).json({"message": "Didn't find sensor with requested external id."});
                                return 
                            }
                
                        })
                    } else { 
                        res.status(403).json({"message": "You didn't set sensorId parameter in body."});
                   }
                } else {
                    res.status(400).json({"message": "User's main sensor is not set"});
                }
            } else {
                res.status(400).json({"message": "Didn't find user with requested id."});
            }
        })
    } else {
        res.status(400).json({"message": "You didn't set userId parameter in body."});
    }

}

exports.addSensor = (req, res, next) => {
    if(req.user.isAdmin) {
        const sensorId = req.body.sensorId 
        const sensorName = req.body.sensorName
        const locationName = req.body.locationName
        const locationLat = req.body.locationLat
        const locationLon = req.body.locationLon
        const locationTimeZone = req.body.locationTimeZone
        const userKey = req.body.userKey
        let insideBuilding = req.body.insideBuilding
     
        if(sensorId != null) {
            if(insideBuilding == null) {
                res.status(400).json({"message": "Didn't set sensor insideBuilding parameter"});
             } else {
            return Sensor.findOne({ where: { externalIdentifier: sensorId }}).then( sensor => {
                if(sensor) {
                    res.status(409).json({"message": "Sensor already exists"});
                } else {
                return Sensor.create({ externalIdentifier: sensorId, name: sensorName, locationName: locationName, locationLat: locationLat, locationLon:locationLon, locationTimeZone: locationTimeZone, isInsideBuilding: insideBuilding, key: userKey }).then(
                        product => {
                            if(product) {
                                res.status(201).json({"message": "Sensor created"});
                            } else {
                                res.status(500).json({"message": "Database error"});
                            }
                        }
                    )
                }
            })
        }
        } else {
            res.status(400).json({"message": "Didn't set external sensorId"});
        }
    } else {
        res.status(403).json({"message": "No rights to this operation."});
    }
}

exports.addSensorToUser = (req, res, next) => {
    if(req.user.isAdmin) {
        let sensorId = req.body.sensorId 
        let userId = req.body.userId
        let defaultSensor = req.body.defaultSensor
        if(sensorId) {
            if(userId) {
                return Sensor.findOne({ where: { externalIdentifier: sensorId }}).then( sensor => {
                    if(sensor) {
                        return User.findOne({ where: { id: userId }}).then( user => {
                            if(user != null) {
                                return user.addSensor(sensor).then( rawData => {
                                    if(defaultSensor == true){
                                        user.mainSensorId = sensor.externalIdentifier; 
                                    }
                                    user.save().then( user => {
                                        if(user != null) {
                                            res.status(201).json({"message": "success"});
                                        } else {
                                            res.status(500).json({"message": "server internal error"});
                                        }
                                    })
                                })
                            } else {
                                res.status(400).json({"message": "Didn't find requested user"});
                            }
                        })
                    } else {
                        res.status(400).json({"message": "Didn't find requested sensor"});
                    }
                })
            } else {
                res.status(400).json({"message": "Didn't set userId"});
            }
        } else {
            res.status(400).json({"message": "Didn't set external sensorId"});
        }
    } else {
        res.status(403).json({"message": "No rights to this operation."});
    }
}

exports.removeSensorFromUser = (req, res, next) => {
    if(req.user.isAdmin) {
        let userId = req.body.userId 
        let sensorId = req.body.sensorId 
        if(userId) {
            return User.findOne({ where: { id: userId }}).then( user => {
                if(user) {
                    user.getSensors({ where:  { externalIdentifier: sensorId }}).then( sensors => {
                        if(sensors[0]) {
                            return user.removeSensor(sensors[0]).then( result => {
                                if(user.mainSensorId == sensors[0].externalIdentifier) {
                                    user.mainSensorId = null
                                    user.save().then( savedUser => {
                                        res.status(201).json({"message": "Sensor deleted"});
                                    });
                                } else {
                                    res.status(201).json({"message": "Sensor deleted"});
                                }
                            })
                        } else {
                            res.status(400).json({"message": "Didn't find sensor with requested id."});
                        }
                    })
                } else {
                    res.status(400).json({"message": "Didn't find user with requested id."});
                }
            })
        } else {
            res.status(400).json({"message": "You didn't set userId parameter in body."});
        }
    } else {
        res.status(403).json({"message": "No rights to this operation."});
    }
}

exports.removeSensor = (req, res, next) => {
    if(req.user.isAdmin) {
        let sensorId = req.query.sensorId 
        if(sensorId != null) {
            return Sensor.findOne({ where: { externalIdentifier: sensorId }}).then( sensor => {
                if(sensor != null) {
                    return sensor.destroy().then( result => {
                        res.status(202).json({"message": "removed  object"});
                    })
                } else {
                    res.status(422).json({"message": "Didn't find sensor you requested"});
                }
            })
        } else {
            res.status(400).json({"message": "Didn't set external sensorId"});
        }
    } else {
        res.status(403).json({"message": "No rights to this operation."});
    }
}

exports.setSensorAsMain = (req, res, next) => {
    let userId = req.user.id 
    if(userId != null) {
        let sensorId = req.body.sensorId 
        if(sensorId != null) {
            return Sensor.findOne({ where: { externalIdentifier: sensorId }}).then( sensor => {
                if(sensor != null) {
                   return User.findOne({ where: { id: userId }}).then( user => {
                        if(user != null) {
                            user.mainSensorId = sensorId
                            return user.save().then(user => {
                                res.status(201).json({"message": "Main sensor set"});
                            })
                        } else {
                            res.status(500).json({"message": "Internal error"});
                        }
                   })
                } else {
                    res.status(422).json({"message": "Didn't find sensor you requested"});
                }
            })
        } else {
            res.status(400).json({"message": "Didn't set external sensorId"});
        }
    } else {

    }
}

function obtainDataUrl(startDate, endDate, deviceId){
    console.log(startDate);
    console.log(endDate);
    return primaryDataUrl + startDateParamaterName + startDate + endDateParamaterName + endDate + deviceParameterUrl + deviceId
}

function obtainHistoricalDataUrl(startDate, endDate, deviceId){
    return primaryDataHistoricalUrl + startDateParameterHistoricalUrl + startDate + endDateParameterHistoricalUrl + endDate + deviceParameterHistoricalUrl + deviceId
}