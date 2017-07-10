'use strict';
const
	AmpedModel = require('./AmpedModel')(),
	sequelize = require('sequelize');

class Messages extends AmpedModel {

	constructor(app, socket) {
		super(app, socket);
		this.app = app;
	}

	addRelations(models) {
		this.models = models;
		models.messages.getModel().belongsTo(models.users.getModel(), {foreignKey: 'sent_by'});
	}

	get schema() {
		return {
			conversation_id: sequelize.INTEGER,
			message: sequelize.STRING,
			sent_by: sequelize.INTEGER,
			source: sequelize.STRING,
		}
	}

	getQueryIncludes(user, params) {
		return [
			{
				model: this.models.users.getModel(),
				attributes: ['display_name', 'id'],
				include: {
					model: this.models.uploads.getModel(),
					attributes: ['id', 'extension']
				}
			}
		]
	}

}

module.exports = Messages;
