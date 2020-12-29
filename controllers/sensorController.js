const Sensor = require('../model/sensor');

const primaryDataUrl = "https://www.airqlab.pl/pag_api.php?"
const startDatePamaterName = "DateFrom=\""
const endDatePamaterName = "\"&DateTo=\"" 
const deviceIdPamaterName = "\"&DeviceId="

exports.getSensorListForUser = (req, res, next) => {
    let userId = req.query.userId 
    if(userId) {
        return Sensor.findAll({ raw : true, nest : true }).then( sensors => {
            sensors.forEach( sensor => {
                delete sensor['id']
            })
            res.status(200).json({"sensors":sensors});
        })
    } else {
        res.status(403).json({"message": "You didn't set userId parameter in body."});
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
    let email = req.body.sensorId 
    let sensorName = req.body.sensorName
    let locationName = req.body.locationName
    let locationLat = req.body.locationLat
    let locationLon = req.body.locationLon

    if(sensorId) {
        return Sensor.findOne({ where: { externalIdentifier: sensorId}}).then( sensor => {
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
}

exports.addSensorToUser = (req, res, next) => {
    res.status(200).json({"message": "request succeeded"});
}

exports.removeSensorFromUser = (req, res, next) => {
    res.status(200).json({"message": "request succeeded"});
}

exports.removeSensor = (req, res, next) => {
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
}

function obtainDataUrl(startDate, endDate, deviceId){
    return primaryDataUrl + startDatePamaterName + startDate + endDatePamaterName + endDate + deviceIdPamaterName + deviceId
}