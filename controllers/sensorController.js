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
                    return res.status(200).json({"sensors":sensorsJson});
                }
                return res.status(500).json({"message": "internal error"});
            }
            return res.status(400).json({"message": "Didn't find user with requested id."});
        }
    res.status(400).json({"message": "You didn't set userId parameter in body."});
};

exports.getAllSensors = async (req, res, next) => {
    if(req.user.isAdmin == true) {
        const sensors = await Sensor.findAll({ raw : true, nest : true })
        sensors.forEach( sensor => {
            delete sensor['id']
            delete sensor['createdAt']
            delete sensor['updatedAt']
        })
        return res.status(200).json({"sensors":sensors});
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
                try { 
                    const response = await got(url, { json: true })
                    if(response.body["measures"]) {
                        return res.status(200).json({ "data": response.body });
                    } 
                    return res.status(500).json({"message":"Couldn't get to data provider"})    

                } catch (error) {
                    return res.status(500).json({"message":"Couldn't connect to data provider"})
                }
            }
            return res.status(400).json({"message": "You didn't set endDate parameter in body."});         
            }
        return res.status(400).json({"message": "You didn't set startDate parameter in body."}); 
    }   
    res.status(400).json({"message": "You didn't set sensorId parameter in body."});
}

exports.getLastPieceOfDataFromSensor = async (req, res, next) => {
    const sensorId = req.query.sensorId 
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
                        return res.status(200).json({ "data": response.body["measures"][response.body["measures"].length - 1]});
                    } 
                    return res.status(500).json({"message":"Couldn't get to data provider"})    
                } catch (error) {
                    return res.status(500).json({"message":"Couldn't connect to data provider"})
                    
                }
            } 
            return res.status(400).json({"message": "Didn't find sensor with requested external id."});
        } 
    res.status(401).json({"message": "You didn't set sensorId parameter in body."});
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
                                    return res.status(500).json({"message":"Couldn't get data from provider"})    
                                                   
                                } catch (error) {
                                    return res.status(500).json({"message":"Couldn't connect from data provider"})
                                }
                            }
                            return res.status(400).json({"message": "Didn't find sensor with requested external id."});
                        } 
                    return res.status(403).json({"message": "You didn't set sensorId parameter in body."});
                } 
                return res.status(400).json({"message": "User's main sensor is not set"});
            }
            return res.status(400).json({"message": "Didn't find user with requested id."});
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
                return res.status(400).json({"message": "Didn't set sensor insideBuilding parameter"});
                
             } else {
                const sensor = await Sensor.findOne({ where: { externalIdentifier: sensorId }})
                if(sensor != null) {
                    return res.status(409).json({"message": "Sensor already exists"});
                } else {
                    const product = await Sensor.create({ externalIdentifier: sensorId, name: sensorName, locationName: locationName, locationLat: locationLat, locationLon:locationLon, locationTimeZone: locationTimeZone, isInsideBuilding: insideBuilding, key: userKey })        
                    if(product) {
                        return res.status(201).json({"message": "Sensor created"});
                    } 
                    return res.status(500).json({"message": "Database error"});
                }
            } 
        }       
        return res.status(400).json({"message": "Didn't set external sensorId"});
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
                        const user = await User.findOne({ where: { id: userId }})
                            if(user != null) {
                                await user.addSensor(sensor)
                                if(defaultSensor == true){
                                    user.mainSensorId = sensor.externalIdentifier; 
                                }
                                await user.save()
                                if(user != null) {
                                    return res.status(201).json({"message": "success"});
                                } 
                                return res.status(500).json({"message": "server internal error"});
                            }
                        return res.status(400).json({"message": "Didn't find requested user"});
                    }
                    return res.status(400).json({"message": "Didn't find requested sensor"});
                } 
                return res.status(400).json({"message": "Didn't set userId"});
            }
        return res.status(400).json({"message": "Didn't set external sensorId"});
    }
    res.status(403).json({"message": "No rights to this operation."});
}

exports.removeSensorFromUser = async (req, res, next) => {
    if(req.user.isAdmin) {
        const userId = req.body.userId 
        const sensorId = req.body.sensorId 
        if(userId) {
            const user = await User.findOne({ where: { id: userId }})
            if(user) {
                const sensors = await user.getSensors({ where:  { externalIdentifier: sensorId }})
                if(sensors[0]) {
                    await user.removeSensor(sensors[0])
                    if(user.mainSensorId == sensors[0].externalIdentifier) {
                        user.mainSensorId = null
                        await user.save()
                        return res.status(201).json({"message": "Sensor deleted"});
                    }
                    return res.status(201).json({"message": "Sensor deleted"});
                }
                return res.status(400).json({"message": "Didn't find sensor with requested id."});
            } 
            return res.status(400).json({"message": "Didn't find user with requested id."});
        } 
        return res.status(400).json({"message": "You didn't set userId parameter in body."});
    } 
    res.status(403).json({"message": "No rights to this operation."});
}

exports.removeSensor = async (req, res, next) => {
    if(req.user.isAdmin) {
        const sensorId = req.query.sensorId 
        if(sensorId != null) {
            const sensor = await Sensor.findOne({ where: { externalIdentifier: sensorId }})
            if(sensor != null) {
                await sensor.destroy()
                return res.status(202).json({"message": "removed  object"});
            } 
            return res.status(422).json({"message": "Didn't find sensor you requested"});
        } 
        return res.status(400).json({"message": "Didn't set external sensorId"});
    } 
    res.status(403).json({"message": "No rights to this operation."});
}

exports.setSensorAsMain = async (req, res, next) => {
    const userId = req.user.id 
    if(userId != null) {
        const sensorId = req.body.sensorId 
        if(sensorId != null) {
            const sensor = await Sensor.findOne({ where: { externalIdentifier: sensorId }})
            if(sensor != null) {
                const user = await User.findOne({ where: { id: userId }})
                if(user != null) {
                    user.mainSensorId = sensorId
                    const user = await user.save()
                    return res.status(201).json({"message": "Main sensor has been set"});      
                } 
                return res.status(500).json({"message": "Internal error"});
            } 
            return res.status(422).json({"message": "Didn't find sensor you requested"});
        } 
        return res.status(400).json({"message": "Didn't set external sensorId"});
    } 
    res.status(500).json({"message": "internal error"});
}

function obtainDataUrl(startDate, endDate, deviceId){
    return primaryDataUrl + startDateParamaterName + startDate + endDateParamaterName + endDate + deviceParameterUrl + deviceId
}

function obtainHistoricalDataUrl(startDate, endDate, deviceId){
    return primaryDataHistoricalUrl + startDateParameterHistoricalUrl + startDate + endDateParameterHistoricalUrl + endDate + deviceParameterHistoricalUrl + deviceId
}