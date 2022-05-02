const Sensor = require('../model/sensor');
const User = require("../model/user");
const Request = require('request');
const got = require('got');

var dayjs = require('dayjs');

const primaryDataUrl = "https://www.airqlab.pl/pag_api.php?"
const startDateParamaterName = "DateFrom=\""
const endDateParamaterName = "\"&DateTo=\"" 
const deviceParameterUrl = "\"&DeviceId="

const primaryDataHistoricalUrl = "https://www.airqlab.pl/pgh_api.php?"
const startDateParameterHistoricalUrl = "StartDate=\""
const endDateParameterHistoricalUrl = "\"&EndDate=\"" 
const deviceParameterHistoricalUrl = "\"&DeviceId="


exports.getSensorListForUser = async (req, res, next) => {
    const userId = req.user.id 
    if(userId != null) {
        const user = await User.findOne({ where: { id: userId }})
            if(user) {
                let sensors = await user.getSensors()
                if(sensors){
                    let sensorsJson = sensors.map( sensor => { return sensor.toJSON()})
                    sensorsJson.forEach( sensor => {
                        delete sensor['id']
                        delete sensor['createdAt']
                        delete sensor['updatedAt']
                        delete sensor['SensorItem']
                        delete sensor['key']
                    })
                    res.status(200).json({"sensors":sensorsJson});
                    return
                }
                res.status(400).json({"message": "Didn't find user with requested id."});
                return
            }
            res.status(500).json({"message": "internal error."});
            return;
        }
    res.status(400).json({"message": "You didn't set userId parameter in body."});
};

exports.getAllSensors = async (req, res, next) => {
    if(req.user.isAdmin == true) {
        const sensors = await Sensor.findAll({ raw : true, nest : true }) //.then( sensors => {
        sensors.forEach( sensor => {
            delete sensor['id']
            delete sensor['createdAt']
            delete sensor['updatedAt']
        })
        res.status(200).json({"sensors":sensors});
        return   
    } 
    res.status(403).json({"message": "No rights to this operation."});
};

exports.getDataFromSensor = async (req, res, next) => {
    const sensorId = req.query.sensorId 
    const startDate = req.query.startDate
    const endDate = req.query.endDate
    if(sensorId) {
        if(startDate) {
            if(endDate) {
                const url = obtainHistoricalDataUrl(startDate, endDate, sensorId);
                const [err, response, body] = await Request(url, { json: true })
                if (err) { 
                    res.status(500).json({"message":"Couldn't connect to data provider"})
                    return
                }
                if(response.body) {
                    res.status(200).json({ "data": response.body });
                    return
                } 
                res.status(500).json({"message":"Couldn't get to data provider"})    
                return            
                     
                  
            }
             res.status(400).json({"message": "You didn't set endDate parameter in body."});
             return
            }
         res.status(400).json({"message": "You didn't set startDate parameter in body."});
         return
        }   
    res.status(400).json({"message": "You didn't set sensorId parameter in body."});
}

exports.getLastPieceOfDataFromSensor = async (req, res, next) => {
    const sensorId = req.query.sensorId 
    if(sensorId != null) {
        const sensor = await Sensor.findOne({ where: { externalIdentifier: sensorId }})
            if(sensor) {
                let currentDate = new dayjs().add(sensor.locationTimeZone, 'hour');
                if(sensor.locationTimeZone) {
                    currentDate = currentDate.add(sensor.locationTimeZone,'hour');
                }
                const endDate = currentDate.add(2,'hour').format('YYYY-MM-DD HH:mm:ss');
                const startDate = currentDate.add(-2,'hour').format('YYYY-MM-DD HH:mm:ss');
                const url = obtainDataUrl(startDate, endDate, sensorId);
                try {
                    const response = await got(url, { json: true });
                        if(response.body["measures"]) {
                            res.status(200).json({ "data": response.body["measures"][response.body["measures"].length - 1]});
                            return;
                        } 
                        res.status(500).json({"message":"Couldn't get to data provider"})    
                        return;                
                } catch (error) {
                    res.status(500).json({"message":"Couldn't connect to data provider"})
                    return;
                }
            } 
            res.status(400).json({"message": "Didn't find sensor with requested external id."});
            return 
        } 
    res.status(403).json({"message": "You didn't set sensorId parameter in body."});
}

exports.currentStateData = async (req, res, next) => {
    const userId = req.user.id 
    if(userId != null) {
        const user = await User.findOne({ where: { id: userId }})
            if(user) {
                if(user.mainSensorId != null) {
                    let currentDate = new Date()
                    const sensorId = user.mainSensorId;
                    if(sensorId) {
                        const sensor = await Sensor.findOne({ where: { externalIdentifier: sensorId }})
                            if(sensor) {
                                let currentDate = new dayjs().add(sensor.locationTimeZone, 'hour');
                                if(sensor.locationTimeZone) {
                                    currentDate = currentDate.add(sensor.locationTimeZone,'hour');
                                }
                                const endDate = currentDate.add(2,'hour').format('YYYY-MM-DD HH:mm:ss');
                                const startDate = currentDate.add(-2,'hour').format('YYYY-MM-DD HH:mm:ss');
                                const url = obtainDataUrl(startDate, endDate, sensorId);
                                try {
                                    const response = await got(url, { json: true });
                                    if(response.body["measures"]) {
                                        res.status(200).json({ "data": response.body["measures"][response.body["measures"].length - 1]});
                                        return;
                                    } 
                                    res.status(500).json({"message":"Couldn't get data from provider"})    
                                    return;                
                                } catch (error) {
                                    res.status(500).json({"message":"Couldn't connect from data provider"})
                                    return;
                                }
                            }
                            res.status(400).json({"message": "Didn't find sensor with requested external id."});
                            return           
                        } 
                    res.status(403).json({"message": "You didn't set sensorId parameter in body."});
                    return
                } 
                res.status(400).json({"message": "User's main sensor is not set"});
                return
            }
            res.status(400).json({"message": "Didn't find user with requested id."});
            return
        } 
    res.status(400).json({"message": "You didn't set userId parameter in body."});
}

exports.addSensor = async (req, res, next) => {
    if(req.user.isAdmin) {
        const sensorId = req.body.sensorId 
        const sensorName = req.body.sensorName
        const locationName = req.body.locationName
        const locationLat = req.body.locationLat
        const locationLon = req.body.locationLon
        const locationTimeZone = req.body.locationTimeZone
        const userKey = req.body.userKey
        const insideBuilding = req.body.insideBuilding
     
        if(sensorId != null) {
            if(insideBuilding == null) {
                res.status(400).json({"message": "Didn't set sensor insideBuilding parameter"});
                return
             } else {
                const sensor = await Sensor.findOne({ where: { externalIdentifier: sensorId }})
                if(sensor != null) {
                    res.status(409).json({"message": "Sensor already exists"});
                    return;
                } else {
                    const product = await Sensor.create({ externalIdentifier: sensorId, name: sensorName, locationName: locationName, locationLat: locationLat, locationLon:locationLon, locationTimeZone: locationTimeZone, isInsideBuilding: insideBuilding, key: userKey })        
                    if(product) {
                        res.status(201).json({"message": "Sensor created"});
                        return
                    } 
                    res.status(500).json({"message": "Database error"});
                    return;
                }
            } 
        }       
        res.status(400).json({"message": "Didn't set external sensorId"});
        return
    }
    res.status(403).json({"message": "No rights to this operation."});
}

exports.addSensorToUser = async (req, res, next) => {
    if(req.user.isAdmin) {
        const sensorId = req.body.sensorId 
        const userId = req.body.userId
        const defaultSensor = req.body.defaultSensor
        if(sensorId) {
            if(userId) {
                const sensor = await Sensor.findOne({ where: { externalIdentifier: sensorId }})
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
                return
                } 
                res.status(400).json({"message": "Didn't set userId"});
                return;
            }
        res.status(400).json({"message": "Didn't set external sensorId"});
        return
    }
    res.status(403).json({"message": "No rights to this operation."});
}

exports.removeSensorFromUser = async (req, res, next) => {
    if(req.user.isAdmin) {
        const userId = req.body.userId 
        const sensorId = req.body.sensorId 
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
                        } 
                        res.status(400).json({"message": "Didn't find sensor with requested id."});

                    })
                } 
                res.status(400).json({"message": "Didn't find user with requested id."});
            })
        } 
        res.status(400).json({"message": "You didn't set userId parameter in body."});

    } 
    res.status(403).json({"message": "No rights to this operation."});
    
}

exports.removeSensor = async (req, res, next) => {
    if(req.user.isAdmin) {
        const sensorId = req.query.sensorId 
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

exports.setSensorAsMain = async (req, res, next) => {
    const userId = req.user.id 
    if(userId != null) {
        const sensorId = req.body.sensorId 
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
        } 
        res.status(400).json({"message": "Didn't set external sensorId"});
    } 
    res.status(500).json({"message": "internal error"});

}

function obtainDataUrl(startDate, endDate, deviceId){
    return primaryDataUrl + startDateParamaterName + startDate + endDateParamaterName + endDate + deviceParameterUrl + deviceId
}

function obtainHistoricalDataUrl(startDate, endDate, deviceId){
    return primaryDataHistoricalUrl + startDateParameterHistoricalUrl + startDate + endDateParameterHistoricalUrl + endDate + deviceParameterHistoricalUrl + deviceId
}