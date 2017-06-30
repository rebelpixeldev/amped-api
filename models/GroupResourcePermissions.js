'use strict';
const
  AmpedModel = require('./AmpedModel')(),
  sequelize = require('sequelize');

class GroupResourcePermissions extends AmpedModel {

  constructor(app, socket) {
    super(app, socket);
    this.app = app;
    this.models = {};
  }

  get schema() {
    return {
      group_id        : sequelize.INTEGER,
      resource_id     : sequelize.INTEGER,
      permission_id   : sequelize.INTEGER
    }
  }

  get buildCrudRoutes(){ return false;}
}

module.exports = GroupResourcePermissions;
