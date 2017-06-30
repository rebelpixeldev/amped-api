'use strict';
// @TODO make it come from external files service
const
  AmpedModel  = require('./AmpedModel')(),
  config      = require('../index').getConfig(),
  sequelize   = require('sequelize');

class Uploads extends AmpedModel {

  constructor(app, socket) {
    super(app, socket);
    this.app = app;
    this.models = {};
  }

  addRelations(models){
    this.models = models; // @TODO: Not sure I like this so much
    models.uploads.getModel().hasOne(models.users.getModel(), {foreign_key : 'photo_id'});
    // models.uploads.getModel().hasOne(models.accounts.getModel());
  }

  get schema() {
    return {
      amp_account_id: sequelize.INTEGER,
      amp_user_id: sequelize.INTEGER,
      title: sequelize.STRING,
      filename : sequelize.STRING,
      mime : sequelize.STRING,
      extension : sequelize.STRING,
      filesize : sequelize.INTEGER,
      width : sequelize.INTEGER,
      height: sequelize.INTEGER
    }
  }

  get defineOptions(){
    return {
      getterMethods : {
        source_path : function(){
          return `${config.uploads.sourceFilePath}/${this.getDataValue('id')}.${this.getDataValue('extension')}`;
        },
        thumb_path : function(){
          return `${config.uploads.thumbFilePath}/${this.getDataValue('id')}.${this.getDataValue('extension')}`;
        },
        source_url : function(){
          return `${config.urls.api.domain}${config.uploads.sourceFilePath}/${this.getDataValue('id')}.${this.getDataValue('extension')}`;
        },
        thumb_url : function(){
          return `${config.urls.api.domain}${config.uploads.thumbFilePath}/${this.getDataValue('id')}.${this.getDataValue('extension')}`;
        }
      }
    }
  }

}

module.exports = Uploads;
