'use strict';
const
	AmpedModel = require('./AmpedModel')(),
	sequelize = require('sequelize');

class UserGroups extends AmpedModel {

	constructor(app, socket) {
		super(app, socket);
		this.app = app;
		this.models = {};
	}

	get schema() {
		return {
			user_id: sequelize.INTEGER,
			account_id: sequelize.INTEGER,
			group_id: sequelize.INTEGER
		}
	}


	addRelations(models) {
		this.models = models; // @TODO: Not sure I like this so much
		models.user_groups.getModel().belongsTo(models.groups.getModel());
	}

	get buildCrudRoutes() {
		return false;
	}

	getQueryIncludes(user, params) {
		return [
			{
				model: this.models.groups.getModel(),
				attributes: ['name']
			}
		]
	}
}

module.exports = UserGroups;
