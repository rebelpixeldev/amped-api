'use strict';
// @TODO make external npm module

const
  connection          = null,
  fs                  = require('fs'),
  path                = require('path'),
  Sequelize           = require('sequelize');

let config = null;

let models = {},
    modelMap = {};

/**
 * Used as the connector to the database for the app
 */

module.exports = function(c){

  if ( typeof c !== 'undefined')
    config = c;

  class AmpedConnector {

    constructor() {
      this.connection = null;
    }

    /**
     * Gets a sequelize database model by name
     *
     * @param {string} name  - The name of the model that wants to be found
     *
     * @returns {Sequelize}    - Sequelize database object
     */
    // static getModel(name) {
    //   return AmpedConnector.getConnection()[name];
    // }

    /**
     * Gets the connection to the database. If it has already been created, the existing connection will be returned
     *
     * @returns {null|Sequelize} - Sequelize datbase object
     */
    static getConnection() {
      if (typeof this.connection === 'undefined') {
        this.connection = new Sequelize(config.db.database, config.db.user, config.db.password, {
        // this.connection = new Sequelize('postgres', 'darijaradic', 'M0ther', {
            port : config.db.port,
            host : config.db.host,
          dialect: config.db.type,
          logging: config.db.logging,
          define: config.db.define
        });
      }
      return this.connection;
    }

    /**
     * Builds all the Sequalize models.
     *
     * Loops through the models directory
     * Creates a new instance of the model
     * Adds all the models to the a local object for use with `self.getModel`
     * Once done, call addRelations on each model
     *
     * @param {object} app          - Global express app object
     * @param {AmpedSocket} socket  - Amped socket instance
     */
    static buildModels(app, socket, modelPath) {

      const
        connection = AmpedConnector.getConnection();

      const dirs = [...this.getFullpathArray(modelPath), ...this.getFullpathArray(path.join(__dirname, '../models'))];
      models = dirs.reduce((carry, filepath) => {

          const
            clss = require(filepath),
            instance = new clss(app, socket);

          modelMap[instance.modelName] = instance.getModel();
          carry[instance.modelName] = instance;
        return carry;
      }, {});

      Object.keys(models).forEach( key => models[key].addRelations(models));

    }

    static getFullpathArray(targetPath){
      return fs.readdirSync(targetPath)
          .filter(( filename ) => filename.toLowerCase() !== 'ampedmodel.js')
          .map((filename) => path.join(targetPath, filename));
    }

    /**
     * Middleware function to attach the models to the request object.
     *
     * @param {object} app          - Global express app object
     * @param {AmpedSocket} socket  - Amped socket instance
     *
     * @returns {function}          - Express middleware function
     */
    static databaseMiddleware(app, socket){
      return (req, res, next) => {
        req.db = modelMap;
        req.dbRef = models;
        next();
      }
    }

    static getModelRef(name){
      return models[name];
    }

    static getModels(){
      return models;
    }

      static getModelRefs(){
          return modelMap;
      }

    /**
     * Middleware function to attach all the model crud routes
     *
     * @param {object} app          - Global express app object
     * @param {AmpedSocket} socket  - Amped socket instance
     *
     * @returns {function}          - Express middleware function
     */
    static crudRouteMiddleware(app, socket){
      return (req, res, next) => {
        Object.keys(models).forEach(key => models[key].addRoutes());
        next();
      };
    }
  }

	return AmpedConnector;
}


// Export AmpedConnector instance

