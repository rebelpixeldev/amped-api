'use strict';
const
	AmpedAuthorization = require('../utils/AmpedAuthorization')(),
	AmpedModel = require('./AmpedModel')(),
	sequelize = require('sequelize');

class Users extends AmpedModel {

	constructor(app, socket) {
		super(app, socket);
		this.app = app;
		this.models = {};
	}

	addRelations(models) {
		this.models = models; // @TODO: Not sure I like this so much
		models.users.getModel().belongsTo(models.accounts.getModel(), {foreignKey: 'account_id'});
		models.users.getModel().belongsTo(models.uploads.getModel());
		models.users.getModel().hasMany(models.activity.getModel());
		models.users.getModel().belongsToMany(models.groups.getModel(), {through:models.user_groups.getModel()});
	}

	get crudForm() {
		return [
			['display_name', 'email'],
			[{field: 'users_name'}],
			[{field: 'upload_id', label: 'Profile Image'}]
		]
	}

	get headerFields() {
		return {
			'Display Name': 'display_name',
			'Provider': 'provider',
			'Email': 'email',
			'Profile Image': 'upload',
			'Last seen': 'updated_at',
			'Joined': 'created_at'
		}
	}

	get schema() {
		return {
			account_id: {
				type: sequelize.INTEGER,
				user_editable: false,
				field_type: 'hidden'
			},
			provider: {
				type: sequelize.STRING,
				user_editable: false
			},
			service_id: {
				type: sequelize.STRING,
				user_editable: false
			},
			display_name: sequelize.STRING,
			token: {
				type: sequelize.STRING,
				user_editable: false
			},
			users_name: {
				type: sequelize.JSON,
				defaultValue: {
					givenName: '',
					familyName: ''
				}
			},
			email: sequelize.STRING,
			upload_id: {
				type: sequelize.INTEGER,
				field_type: 'image',
				value_field: 'upload',
				value_modifier: function (val) {
					return `/uploads/source/${val}.jpg`
				}
			},

			password: {
				type: sequelize.STRING
			}
		}
	}

	get defineOptions(){
		return {
			getterMethods : {
				user_groups : function(){
					if ( typeof this.getDataValue('groups') !== 'undefined' )
						return this.getDataValue('groups').map(( group ) => group.name)
					return [];
				},
			}
		}
	}

	get queryIncludes() {
		return [
			{
				model: this.models.accounts.getModel(),
				attributes: {include: 'created_at', exclude: Object.keys(this.defaultSchema)}
			},
			{
				model: this.models.uploads.getModel(),
				attributes: ['id', 'filename', 'extension', 'title', 'created_at']
			},
			{
				model : this.models.groups.getModel(),
				attributes : ['name']

			}
		]
	}
}

module.exports = Users;
