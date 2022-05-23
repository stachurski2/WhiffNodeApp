
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

3.AddSensor

method: POST 

url: /addSensor

parameters:

- externalId(String)

- name(String)

- location(String - optional)

- locationLat(Double - optional)

- locationLon(Double - optional)

4. Remove sensor 

method: DELETE 

url: /deleteSensor 

parameters:

- externalId(String)

5. Register User

method: POST

url: /registerUser

parameters:

- email(String)
- password(String)
- name(String - Optional)

6. Login User

method: GET

url: /loginUser

parameters:

- email(String)
- password(String)

returns token

6. Remind Password

method: POST

url: /resetPassword

parameters:

- email(String)

7. Delete Password

method: Delete

url: /deleteUser

parameters:

- userId(String)