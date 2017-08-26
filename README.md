## Amped API

Is contains all the models and startup logic you will need to get started with your api and the Amped Framework. All of the models that you need to get going are in here and done for you. Things like User auth and profiles, user permissions and file upload models are built and the database query to get them setup can be found here.

By default Google, Facebook and local localregister strategies are implemented.

This project is automatically included in the [Amped API Boilerplates's](https://github.com/rebelpixeldev/amped-api.git) `package.json` file


**A demo can be found at: [http://demo.rebelpixel.ca/](http://demo.rebelpixel.ca/)**

**Username:** demo@demo.com

**Password:** 123

### How it works

The main file that you'll need to be framiliar with when extending the framework is [AmpedModel](https://github.com/rebelpixeldev/amped-api/blob/master/models/AmpedModel.js). There is full documentation in there with everything you can override and customize within the file