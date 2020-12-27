App serves to authenticate and getting 

Endpoint list:

1. Get Sensor List 

method: GET 

url: /sensorList 

parameters:

- userId (String)

2. Get Sensor's url

method: GET 

url: /sensorUrl

parameters:

- sensorId(String)

- startDate(Date)

- endDate(Date)

3. Add sensor 

method: POST 

url: /addSensor

parameters:

- sensorURl(String)

3. Remove sensor 

method: DELETE 

url: /deleteSensor

parameters:

- sensorId(String)

