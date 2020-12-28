const primaryDataUrl = "https://www.airqlab.pl/pag_api.php?"
const startDatePamaterName = "DateFrom=\""
const endDatePamaterName = "\"&DateTo=\"" 
const deviceIdPamaterName = "\"&DeviceId="

exports.getSensorListForUser = (req, res, next) => {
    let userId = req.query.userId 
    if(userId) {
        res.status(200).json({"message": "You have just requested about sensor list for user with id: " + userId});
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
    res.status(200).json({"message": "request succeeded"});
}

exports.addSensorToUser = (req, res, next) => {
    res.status(200).json({"message": "request succeeded"});
}

exports.removeSensor = (req, res, next) => {
    res.status(200).json({"message": "request succeeded"});
}

function obtainDataUrl(startDate, endDate, deviceId){
    return primaryDataUrl + startDatePamaterName + startDate + endDatePamaterName + endDate + deviceIdPamaterName + deviceId
}