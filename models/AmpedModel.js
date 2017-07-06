'use strict';

//@TODO create two way binding for database entries

const
	AmpedConnector = require('../utils/AmpedConnector')(),
	AmpedAcl = require('../utils/AmpedAcl')(),
	sequelize = require('sequelize'),
	url = require('url'),
	util = require('../utils/AmpedUtil')();

/**
 * Maps a sequelize type to client side type for use in building the crud forms and data tables
 *
 * @type {object}
 */
const typeMap = {
	STRING: 'text',
	JSON: 'json_text',
	INTEGER: 'number',
	DATE: 'date',
	ENUM: 'select',
	BOOLEAN: 'switch'
};

let config = {};

module.exports = function(c) {

	if ( typeof c !== 'undefined' )
		config = c;

	class AmpedModel {

		/**
		 *
		 * @param {ExpressApp} app
		 * @param {AmpedSocket} socket
		 */
		constructor(app, socket) {
			this.app = app;
			this.socket = socket;
			this.models = {};
			this.editSchema = this.buildEditSchema();

			this.registerSchema();
		}

		/**
		 * Gives the class access to all the models to setup egar loading
		 * @param models
		 */
		addRelations(models) {
			this.models = models; // @TODO: Not sure I like this so much
		}

		/**
		 * @TODO add acl middleware onto the routes
		 * Adds the crud routes to the app if the model has enabled `buildCrudRoutes`
		 */
		addRoutes() {

			if (this.buildCrudRoutes) {

				this.app.get(this.route, this.getModelDataRoute.bind(this));

				this.app.get(this.route + '/account', [AmpedAcl.can.bind(this, 'view-account', this.modelName)], (req, res) => {
					const params = util.getParams(req);
					params.account_id = req.user.account_id;
					this.getModelData(req, res, params);
				});//this.getModelDataRoute.bind(this));

				// this.app.route(this.route, acl.can('view', this.model))
				//   .get(this.getModelData.bind(this))
				//   .post(this.createModelData.bind(this));
				this.app.get(`${this.route}/tableHeaders`, [AmpedAcl.can.bind(this, 'view-tableheaders', this.modelName)], this.getTableHeaders.bind(this));
				this.app.get(`${this.route}/edit`, [AmpedAcl.can.bind(this, 'view-form', this.modelName)], this.getModelDataRoute.bind(this));
				this.app.get(`${this.route}/edit/:_id`, [AmpedAcl.can.bind(this, 'view-form', this.modelName)], this.getModelDataRoute.bind(this))

				// this.app.post(this.route + '/:_id', this.updateModelData.bind(this));

				// this.app.route(this.route)
				// 	.post(this.updateModelData.bind(this));

				this.app.get(`${this.route}/:_id`, [AmpedAcl.can.bind(this, 'view', this.modelName)], this.getModelDataRoute.bind(this));
				this.app.post(`${this.route}/:_id`, [AmpedAcl.can.bind(this, 'update', this.modelName)], this.updateModelData.bind(this));
				this.app.post(`${this.route}`, [AmpedAcl.can.bind(this, 'create', this.modelName)], this.updateModelData.bind(this));
				this.app.delete(`${this.route}/:_id`, [AmpedAcl.can.bind(this, 'delete', this.modelName)], this.deleteModelData.bind(this));

			}
		}

		/**
		 * Registers the current models schema so it can be queried on
		 */
		registerSchema() {
			this.DB = AmpedConnector.getConnection().define(this.modelName, this.schemaData, Object.assign({}, this.defaultDefineOptions, this.defineOptions));
		}

		/**
		 * Should be extended in the child model class.
		 *
		 * It is used to provide relations for the egarloading in queries
		 * @param models
		 */
		addRelations(models) {
		}

		/**
		 * Routes
		 */
		/**
		 * @TODO handle errors
		 * @TODO fix this naming mess
		 *
		 * Handles the callback to the get request in the crud routes
		 *
		 * @param {object} req - Express request object
		 * @param {object} res  - Express response object
		 */
		getModelDataRoute(req, res) {
			this.getModelData(req, res);
		}

		/**
		 * @TODO handle errors
		 *
		 * This should be overidden if you need to return a custom set of data.
		 * By default it will fetch the data from the current model
		 *
		 * @param {object} req      - Express request object
		 * @param {object} res      - Express response object
		 * @param {object} params   - Parameters that are used in the request
		 * @param {string} message  - Message for the response
		 */
		getModelData(req, res, params, message = '') {

			if (typeof params === 'undefined')
				params = util.getParams(req);

			return this.getQuery(req, res, params)
			// @TODO JSON.parse(JSON.stringify(data)) removes all the sequelize object shit on the variable, see if there is a better way to do this
				.then(data => this.sendResponse(req, res, this.modifyGetData(req, JSON.parse(JSON.stringify(data))), message))
				.catch((err) => {
					console.log('ERROR', err);
				});
		}


		/**
		 * Sends the response.
		 *
		 * This will check if the route is an edit route or not.
		 *    If it is an edit route the editSchema is copied and the values is added to the orm fields
		 *    If it is just a get route, return the data
		 * @param {object} req      - Express request object
		 * @param {object} res      - Express response object
		 * @param {object} data     - The data for the response
		 * @param {string} message  - Message for the response
		 */
		sendResponse(req, res, data, message = '') {

			if (data === null)
				data = [];
			res.setHeader('Content-Type', 'application/json');

			res.feedback({
				message, response: this.isEditRoute(req.url) ?
					this.editSchema.slice(0).map((row) => {
						return row.map((col) => {
							if (typeof data === 'undefined' && col.name === 'id')
								return col;
							col.value = col.name === 'id' ? data[col.name] : data[this.schemaData[col.name].value_field] || data[col.name] || this.schema[col.name].defaultValue || '';
							return col;
						});
					}) : data
			});
			return data;
		};

		/**
		 * Builds the get query for the current model.
		 * If anything needs to be done that cannot be achieved with egarloading and the `getIncludes` method,
		 * override this method
		 *
		 * @param {object} req    - Express request object
		 * @param {object} res    - Express response object
		 * @param {object} params - The params of the current request
		 *
		 * @returns {Promise} - A sequelize promise
		 */
		getQuery(req, res, params) {
			if (this.isEditRoute(req.url) && typeof params._id === 'undefined') {
				return new Promise((resolve) => {
					resolve({});
				})

			} else if (typeof params._id === 'undefined') {
				return this.DB.findAll(this.buildQuery({}, params, req));
			} else {
				const where = {};
				where[this.getIdColumn] = params._id;

				delete params._id;

				return this.DB.findOne(this.buildQuery({where}, params, req))
			}
		}

		/**
		 * @TODO Check values being sent against the schema
		 * @TODO handle errors
		 *
		 * Route handler for the update route.
		 * Will convert the dot notation keys to objects
		 *
		 * @param {object} req - Express request object
		 * @param {object} res  - Express response object
		 */
		updateModelData(req, res) {

			const params = util.getParams(req);

			// @TODO Check values being sent against the schema VERRY TEMP ---\/. use this.paramsToQuery
			if (typeof params.upload_id !== 'undefined' && params.upload_id === '')
				params.upload_id = 0;


			const
				data = util.dotNotationToObject(params),
				isCreation = typeof data.id === 'undefined' || data.id === null || data.id === 0;

			
			if ( isCreation && typeof this.schema.amp_user_id !== 'undefined' )
				params.amp_user_id = req.user.id;

			( isCreation ?
				this.DB.build(params).save() :
				this.DB.findById(data.id))
				.then((result) => {

					// Remove things that are read only in crud
					delete data.id;
					delete data.token;
					delete data._id;
					const attrs = Object.keys(data).reduce((ret, key) => {
						if (typeof data[key] === 'object') {
							switch (this.schema[key].key || this.schema[key].type.key) {
								case 'INTEGER':
									ret[key] = parseInt(typeof data[key] === 'object' ? data[key].id : data[key]);
									break;
								case 'JSON':
									ret[key] = data[key];
									break;
							}

						} else ret[key] = data[key];
						return ret;

					}, {});

					attrs.updated_at = new Date();

					result.updateAttributes(attrs)
						.then((modelData) => {

							this.getModelData(req, res, {_id: result.id}, isCreation ? this.successMessage : this.updateMessage)
								// @TODO user below is actually the full data that you would get through a get request
								// Added fullData so the rest of the stuff still works but should really figure out where the
								// fuck user and data values are being used
								.then((user) => {
									if (isCreation) {
										this.sendSocket('CREATE', {user, data: modelData, fullData : user}, req.user);
										this.logActivity(req, 'create', `${this.modelName} was created`, user);
									} else {
										this.sendSocket('UPDATE', {user, data: modelData, fullData : user}, req.user);
										this.logActivity(req, 'update', `${this.modelName} was updated`, user);
									}
								});
						});
				});

		}

		/**
		 * @TODO handle errors
		 * @TODO check permissions
		 * Route handler for the delete route.
		 *
		 * Deletes a resource from the database
		 *
		 * @param {object} req - Express request object
		 * @param {object} res  - Express response object
		 */
		deleteModelData(req, res) {
			const params = util.getParams(req);

			this.DB.destroy({where: {id: params._id}})
				.then(() => {
					this.sendSocket('DELETE', {id: params._id}, req.user);
					res.feedback();
				})
				.catch(res.feedback.bind(this));
			// const params = this.getParams(req);
			//
			// if ( typeof params._id === 'undefined' )
			//     res.send('no id');
			// else
			//     this.DB.update({_id:params._id}, {deleted_at:new Date().getTime()}, {}, (err, raw) => {
			//         res.send('removed successfully');
			//     });

		}

		/**
		 * @TODO make the edit keyword in the url dynamic from a config variable
		 *
		 * Checks whether or not the route is an edit route or not
		 *
		 * @param {string} url - the url that should be checked for the edit route
		 *
		 * @returns {boolean}
		 */
		isEditRoute(url) {
			const parts = url.split('/');
			return parts.pop().indexOf('edit') === 0 || parts[3] === 'edit';
		}

		/**
		 * Builds the edit schema for use when returning the crud form structure that is used on the client side.
		 * If a custom crud for is needed, this function should be overridden
		 */
		buildEditSchema() {
			const fields = this.crudForm.reduce((ret, row) => {
				return [...ret, row.reduce((colRet, col) => {
					const
						colName = typeof col === 'string' ? col : col.field,
						row = this.schema[colName];

					let type = row.field_type;

					if (typeof row.field_type === 'undefined')
						type = (typeof row.type === 'undefined' ? typeMap[row.key] : typeMap[row.type || row.type.key]);

					// Catch JSON type
					if (typeof type === 'undefined')
						type = typeMap[row.type.key];

					const resp = {
						type,
						label: typeof col.label === 'undefined' ? this.colNameToLabel(colName) : col.label,
						name: colName
					};

					if (type === 'select')
						resp.options = row.type.values;


					return [...colRet, resp]
				}, [])]
			}, [[{type: 'hidden', name: 'id'}]]);

			return fields;
		}

		getTableHeaders(req, res) {
			res.feedback(this.headerFields);
		}

		/**
		 * Builds the get query taking into account the sort order, sort field, page, and perpage
		 *
		 * @param {object} baseQuery - The base query that all the meta info should be added onto
		 * @param {object} params - The params for the current request
		 * @returns {object}
		 */
		buildQuery(baseQuery, params, req) {

			const query = Object.assign({}, baseQuery);

			if (typeof query.include === 'undefined')
				query.include = this.queryIncludes;


			const {order_by = this.queryOrderBy, order = this.queryOrder} = params;
			query.order = `${order_by} ${order}`;//typeof params.order === 'undefined' ? `${order_by} ${order}` : params.order;
			query.limit = typeof params.limit === 'undefined' ? this.queryPerPage : params.limit;

			//@TODO add json querying
			query.attributes = {exclude: ['deleted_at', 'deleted_by']};
			query.where = Object.assign({}, this.paramsToQuery(params), (query.where || {}));

			if ( this.getByUser && typeof query.where.amp_user_id === 'undefined' && typeof req.user !== 'undefined' )
				query.where.amp_user_id = req.user.id;

			console.log(query);

			if (typeof params.in !== 'undefined') {
				delete query.where.in;
				query.where.id = {$in: params.in.split(',')};
			}

			return query;

		}

		/**
		 * Checks if the value of a column is valid
		 *
		 * @param {any} value                   - The value that is to be checked
		 * @param {any:boolean} additionalCheck - Any other check conditions
		 * @returns {boolean}
		 */
		schemaValueValid(value, additionalCheck = true) {
			return (typeof value !== 'undefined' &&
			value !== null &&
			value !== '' &&
			additionalCheck);
		}

		/**
		 * Converts the params that have been sent to search by to a proper query which takes type into consideration
		 *
		 * @param {object} params - The params for the current request
		 *
		 * @returns {object}
		 */
		paramsToQuery(params) {
			return Object.keys(params).reduce((ret, paramKey) => {
				if (paramKey === 'id' || paramKey === '_id')
					ret.id = params[paramKey];
				else if (typeof this.schemaData[paramKey] !== 'undefined') {
					switch (this.schema[paramKey].key || this.schema[paramKey].type.key) {
						case 'INTEGER':
							ret[paramKey] = this.schemaValueValid(params[paramKey], !isNaN(parseInt(params[paramKey]))) ?
								parseInt(params[paramKey]) : 0;
							break;
						default:
							ret[paramKey] = params[paramKey].toString();
							break;
					}
				}
				return ret;
			}, {});
		}

		/**
		 * @TODO deprecate - Should be moved to AmpedUtil
		 * Converts underscore to spaces to get a title
		 * @param field
		 */
		colNameToLabel(field) {
			return field.replace('_', ' ');
		}

		/**
		 * Builds the event name to be used with sockets based on the modelName and evt that is passed
		 *
		 * @param {string} evt - The string that should be the suffix on the modelName
		 *
		 * @returns {string}
		 */
		getEvent(evt) {
			return [this.modelName, evt].join('_').toUpperCase();
		}

		/**
		 * Emits a socket emit using AmpedSocket
		 *
		 * @param {string} evt  - The event to be emitted
		 * @param {any} data    - The data that should be sent with the socket
		 */
		sendSocket(evt, data, user) {
			this.socket.sendSocket(this.getEvent(evt), data, user, this.customSocketEmit);
		}
		//
		// customSocketEmit(sockets, evt, data, user){
		// 	// do nothing by default, used for child models
		// }

		/**
		 * Logs an activity using the AmpedActivityLog
		 *
		 * @param {object} req          - Express request object
		 * @param {string} action       - The action that is passed to the activity log
		 * @param {string} description  - The description to be passed to the activity log
		 * @param {any} data            - The data that should be passed to the activity log
		 */
		logActivity(req, action, description, data) {
			req.logActivity(action, description, data);
		}

		/**
		 * Return the Sequelize model for the current class
		 * @returns {Model|*}
		 */
		getModel() {
			return this.DB;
		}


		modifyGetData(req, data){
			return data;
		}

		/**
		 * Get the includes for use in the get query and used with the Sequelize egar loading
		 * @returns {Array}
		 */
		get queryIncludes() {
			return [];
		}

		/**
		 * The default column to order by when fetching the data from the model
		 * @returns {string}
		 */
		get queryOrderBy() {
			return 'updated_at';
		}

		/**
		 * The default sort order when fetching data from the model
		 * @returns {string}
		 */
		get queryOrder() {
			return 'DESC';
		}

		/**
		 * The default per page when fetching data
		 * @returns {number}
		 */
		get queryPerPage() {
			return 10000;
		}

		/**
		 * The default crud form that is returned when getting the edit route
		 * When an empty array is passed, each field is returned on its own line.
		 * @returns {Array}
		 */
		get crudForm() {
			return [];
		}


		get tablePrefix() {
			return 'amp_';
		}

		get connection() {
			return connection;
		}

		/**
		 * @TODO make `api` dynamic
		 *
		 * The default route for crud routes in the model
		 *
		 * @returns {string}
		 */
		get route() {
			return `${config.url.prefix}/${this.modelName}`;
		}

		/**
		 * The model name which is saved into the sequelize object
		 * @returns {*}
		 */
		get modelName() {
			return this.baseName;
		}

		/**
		 * The name of the models table
		 * @returns {*}
		 */
		get tableName() {
			return this.tablePrefix + this.baseName;
		}

		/**
		 * Get the name that is used in the model name and table name which is created from the filename
		 * @returns {string}
		 */
		get baseName() {
			return util.pascalToUnderscore(this.constructor.name)
		}

		/**
		 * The default column for getting data through get requests when _id is passed
		 * @returns {string}
		 */
		get getIdColumn() {
			return 'id'
		}

		get schema() {
			return {};
		}

		get schemaData() {
			return Object.assign({}, this.defaultSchema, this.schema);
		}

		get buildCrudRoutes() {
			return true;
		}

		get defineOptions() {
			return {};
		}

		/**
		 * Property for get requests to only get results based on user id from req.user
		 * @returns {boolean}
		 */
		get getByUser(){
			return false;
		}

		get headerFields() {
			const headers = Object.keys(this.schema).reduce((ret, field) => {
				ret[field] = field;
				return ret;
			}, {});
			headers.updated_at = 'updated_at';
			headers.created_at = 'created_at';

			return headers;
		}

		get defaultDefineOptions() {
			return {
				underscored: true,
				paranoid: true,
				freezeTable: true,
				tableName: this.tableName
			}
		}

		get successMessage() {
			return `${util.capitalize(this.modelName)} has been added`;
		}

		get updateMessage() {
			return ` ${util.capitalize(this.modelName)} has been updated`;
		}



		/**
		 * The default columns that should be on every model
		 * @returns {object}
		 */
		get defaultSchema() {
			return {
				// id: {
				// 	allowNull: false,
				// 	autoIncrement: true,
				// 	primaryKey: true,
				// 	type: sequelize.INTEGER
				// },
				created_at: {type: 'TIMESTAMP', user_editable: false},
				updated_at: {type: 'TIMESTAMP', user_editable: false},
				deleted_at: {type: 'TIMESTAMP', user_editable: false},
				deleted_by: {type: sequelize.INTEGER, user_editable: false}
			}
		}

		get supermanAclPermissions() {
			return ['view', 'update', 'create', 'delete', 'view-account', 'view-form', 'view-tableheaders'];
		}

		get adminAclPermissions() {
			return ['view', 'update', 'create', 'delete', 'view-account', 'view-form', 'view-tableheaders'];
		}

		get managerAclPermissions() {
			return ['view', 'update', 'create', 'delete', 'view-account', 'view-form', 'view-tableheaders'];
		}

		get userAclPermissions() {
			return ['view', 'update', 'create', 'delete', 'view-account', 'view-form', 'view-tableheaders'];
		}
	}
	return AmpedModel;
}

