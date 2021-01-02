const Sensor = require('../model/sensor');
const User = require("../model/user");

const primaryDataUrl = "https://www.airqlab.pl/pag_api.php?"
const startDatePamaterName = "DateFrom=\""
const endDatePamaterName = "\"&DateTo=\"" 
const deviceIdPamaterName = "\"&DeviceId="

exports.getSensorListForUser = (req, res, next) => {
    let userId = req.user.id 
    if(userId) {
        return User.findOne({ where: { id: userId }}).then( user => {
            if(user) {
                user.getSensors().then( sensors => {
                    let sensorsJson = sensors.map( sensor => { return sensor.toJSON()})
                    sensorsJson.forEach( sensor => {
                        delete sensor['id']
                        delete sensor['createdAt']
                        delete sensor['updatedAt']
                        delete sensor['SensorItem']
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
    if(req.user.isAdmin) {
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
    if(sensorId) {
        if(startDate) {
            if(endDate) {
                 var url = obtainDataUrl(startDate, endDate, sensorId);
                 res.redirect(url);
            } else {
                res.status(403).json({"message": "You didn't set endDate parameter in body."});
            }
        } else {
            res.status(403).json({"message": "You didn't set startDate parameter in body."});
        }   
    } else { 
        res.status(403).json({"message": "You didn't set sensorId parameter in body."});
   }
}

exports.addSensor = (req, res, next) => {
    if(req.user.isAdmin) {
        let sensorId = req.body.sensorId 
        let sensorName = req.body.sensorNamec
        let locationName = req.body.locationName
        let locationLat = req.body.locationLat
        let locationLon = req.body.locationLon

        if(sensorId) {
            return Sensor.findOne({ where: { externalIdentifier: sensorId }}).then( sensor => {
                if(sensor) {
                    res.status(409).json({"message": "Sensor already exists"});
                } else {
                return Sensor.create({ externalIdentifier: sensorId, name: sensorName, locationName: locationName, locationLat: locationLat, locationLon:locationLon }).then(
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
        if(sensorId) {
            if(userId) {
                return Sensor.findOne({ where: { externalIdentifier: sensorId }}).then( sensor => {
                    if(sensor) {
                        return User.findOne({ where: { id: userId }}).then( user => {
                            if(user) {
                                return user.addSensor(sensor).then( user => {
                                    res.status(201).json({"message": "success"});
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
                                res.status(201).json({"message": "Sensor deleted"});
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
        if(sensorId) {
            return Sensor.findOne({ where: { externalIdentifier: sensorId }}).then( sensor => {
                if(sensor) {
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

function obtainDataUrl(startDate, endDate, deviceId){
    return primaryDataUrl + startDatePamaterName + startDate + endDatePamaterName + endDate + deviceIdPamaterName + deviceId
}