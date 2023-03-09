## Create the Figma file

We decided to represent the services with icons, text and drop-down menus to connect or add a new action/reaction.

```
black : #231F20
blue : #BFD1E5
mauve : #BA7BA1
beige : #C2A878
gray : #C2A878
```

## Login/Register page

We have decided to display these components as a card.
We make requests for the creation and connection to different accounts.

##### Login
For log in we must request the server in the endpoint ```/api/login``` :
- type of request : POST
- body : ```username, password```
- res : ```status, message```
1.  `onSubmit` is an asynchronous function that takes an event object as its parameter.
2.  On line 2, the event's default behavior is prevented using the `preventDefault()` method.
3.  A new `FormData` object is created on line 4 by passing in the event's target element. This allows for easy access to the form's data.
4.  On line 5, an object is created from the `FormData` object's entries using the `Object.fromEntries()` method and the spread operator.
5.  The component's `error` property is set to `null` on line 7 to reset any previous error messages.
6.  On line 8, a fetch request is made to the endpoint '/api/login' with the headers containing the "content-type" and the body is the JSON stringified data object.
7.  On line 9, the response is awaited, then the json() method is used to parse the response's body.
8.  On line 11, a check is made to see if the `status` property of the response object is "ERROR". If so, the component's `error` property is set to the response's `message` property.
9.  If the status is not "ERROR", the component's `error` property is set to "Connecté avec succès" and the browser is redirected to the homepage using window.location.replace("/").
10.  Finally, the response object is logged to the console on the last line.

It should be noted that this code is written in a Vue.js component and the component should have a data property called `error`. It also assumes that the server has an endpoint called '/api/login' that accepts a POST request with a JSON body. It also assumes that the server will return a JSON object with a 'status' and 'message' properties in case of error, otherwise it redirects to homepage.

##### Register
For sign up we must request the server in the endpoint ```/api/register``` :
- type of request : POST
- body : ```username, password```
- res : ```status, message```
1.  `onSubmit` is an asynchronous function that takes an event object as its parameter.
2.  On line 2, the event's default behavior is prevented using the `preventDefault()` method.
3.  A new `FormData` object is created on line 4 by passing in the event's target element. This allows for easy access to the form's data.
4.  On line 5, an object is created from the `FormData` object's entries using the `Object.fromEntries()` method and the spread operator.
5.  The component's `error` property is set to `null` on line 7 to reset any previous error messages.
6.  On line 8, a fetch request is made to the endpoint '/api/register' with the headers containing the "content-type" and the body is the JSON stringified data object.
7.  On line 9, the response is awaited, then the json() method is used to parse the response's body.
8.  On line 11, a check is made to see if the `status` property of the response object is "ERROR". If so, the component's `error` property is set to the response's `message` property.
9.  If the status is not "ERROR", the component's `error` property is set to "Compte créé avec succès" which means account created successfully.

It should be noted that this code is written in a Vue.js component and the component should have a data property called `error`. It also assumes that the server has an endpoint called '/api/register' that accepts a POST request with a JSON body. It also assumes that the server will return a JSON object with a 'status' and 'message' properties in case of error, otherwise it will show a message that the account has been created successfully.

## Librairies used

We decided to use Tailwind CSS which will allow us to accelerate the development of the frontend. This CSS framework is designed to develop web application mockups quickly.
Its use facilitates the development of the responsive part of the app.
We chose this one for its lightness and ease of use with its extensive documentation.

## Dashboard

To create this page, we started with the architecture of the site, so I created the redirections I needed to advance on the dashboard.
We need a page that contains a form to create our actions/reactions. This form will send to the backend the data to activate the area.
It must contain the service, the desired action and the desired reaction. First you have to check if the user is connected to this service and if he has the permission to create an area.

## Request the server for the about.json file

We must request the server in the endpoint `/about.json` for get this file. In this file we can see all the service who can connect to this Action REAction project.
You have to parse the file to display the different services offered by our platform.
It is also necessary to think that services will be added later and therefore to ensure that it is generic so as not to have to modify the code when a new service is added.
