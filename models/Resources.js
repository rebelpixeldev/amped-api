'use strict';
const
  AmpedModel = require('./AmpedModel')(),
  sequelize = require('sequelize');

class Resources extends AmpedModel {

  constructor(app, socket) {
    super(app, socket);
    this.app = app;
    this.models = {};
  }

  get schema() {
    return {
      name: sequelize.STRING
    }
  }

  get buildCrudRoutes(){ return false;}
}

module.exports = Resources;
