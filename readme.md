App serves to authenticate and getting 

Endpoint list:

1. Sensor List 

method: GET 

url: /sensorList 

parameters:

- userId (String)

2. SensorData

method: GET 

url: /sensorData

parameters:

- sensorId(String)

- startDate(String)

- endDate(String)

3.

method: POST 

url: /addSensor

parameters:

- sensorURl(String)

3. Remove sensor 

method: DELETE 

url: /deleteSensor

parameters:

- sensorId(String)

