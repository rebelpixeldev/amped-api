'use strict';
const
	AmpedModel = require('./AmpedModel')(),
	sequelize = require('sequelize');

class Accounts extends AmpedModel {

	constructor(app, socket) {
		super(app, socket);
		this.app = app;
	}

	addRelations(models) {
		models.accounts.getModel().hasMany(models.users.getModel());
		models.accounts.getModel().hasMany(models.activity.getModel());
	}

	get crudForm() {
		return [
			['name'],
			['address'],
			['city', 'state', 'country']
		]
	}

	get schema() {
		return {
			name: sequelize.STRING,
			address: sequelize.STRING,
			city: sequelize.STRING,
			state: sequelize.STRING,
			country: sequelize.STRING

		}
	}
}

module.exports = Accounts;
