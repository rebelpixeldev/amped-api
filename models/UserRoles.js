'use strict';
const
  AmpedModel = require('./AmpedModel')(),
  sequelize = require('sequelize');

class UserRoles extends AmpedModel {

  constructor(app, socket) {
    super(app, socket);
    this.app = app;
    this.models = {};
  }

  get schema() {
    return {
      user_id     : sequelize.INTEGER,
      role_id     : sequelize.INTEGER
    }
  }

  get buildCrudRoutes(){ return false;}
}

module.exports = UserRoles;
