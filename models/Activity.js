'use strict';
const
	AmpedModel = require('./AmpedModel')(),
	sequelize = require('sequelize');

class Activity extends AmpedModel {

	constructor(app, socket) {
		super(app, socket);
		this.app = app;
	}

	addRelations(models) {
		this.models = models;
		this.models.activity.getModel().belongsTo(models.accounts.getModel(), {foreignKey: 'account_id'});
		this.models.activity.getModel().belongsTo(models.users.getModel(), {foreignKey: 'user_id'});
	}

	get schema() {
		return {
			account_id: sequelize.INTEGER,
			user_id: sequelize.INTEGER,
			action: sequelize.TEXT,
			description: sequelize.TEXT,
			data: sequelize.JSON
		}
	}

	getQueryIncludes(user, params) {
		return [
			{
				model: this.models.accounts.getModel(),
				attributes: ['id', 'name', 'created_at']
			},
			{
				model: this.models.users.getModel(),
				attributes: ['id', 'display_name', 'created_at'],
				include: {
					model: this.models.uploads.getModel(),
					attributes: ['id', 'filename', 'created_at']
				},
			}
		]
	}
}

module.exports = Activity;
