'use strict';
const
  AmpedModel = require('./AmpedModel')(),
  sequelize = require('sequelize');

class UserSettings extends AmpedModel {

  get getIdColumn(){
    return 'user_id';
  }

  get crudForm() {
    return [
      ['phone_number', 'contact_method', 'send_messages']
    ]
  }

  get schema() {
    return {
      user_id           : sequelize.INTEGER,
      phone_number      : sequelize.STRING,
      contact_method : {
        type : sequelize.ENUM( 'email', 'sms', 'phone', 'message')
      },
      send_messages : {
        type : 'BOOLEAN',
        defaultValue: true,
        allowNull: false,
        set: function(value) {
          if (value === 'true' || value === 1) value = true;
          else if (value === 'false' || value === 0) value = false;
          this.setDataValue('send_messages', value);
        }
      }
    }
  }
}

module.exports = UserSettings;
