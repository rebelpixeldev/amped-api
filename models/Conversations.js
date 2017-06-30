'use strict';
const
  AmpedModel  = require('./AmpedModel')(),
  sequelize   = require('sequelize');

class Conversations extends AmpedModel {

  constructor(app, socket) {
    super(app, socket);
    this.app = app;
  }


  get schema() {
    return {
      account_id: sequelize.INTEGER,
      started_by : sequelize.INTEGER
    }
  }
}

module.exports = Conversations;
