'use strict';


const
	SHA1 = require('sha1'),
	JWT = require('jsonwebtoken'),
	util = require('./AmpedUtil')();

// @TODO make external npm module
const url = require('url');

let config = {};

module.exports = function(c) {

	if ( typeof c !== 'undefined' )
		config = c;

	const AmpedConnector = require('./AmpedConnector')(config);

	class AmpedAuthorization {

		constructor(params) {
			this._params = params;
		}

		/**
		 * The login route for the system when the user wants to login through a local strategy
		 *
		 * @param {object} req     - Express request object
		 * @param {object} res     - Express response object
		 */
		login(req, res) {
			const params = util.getParams(req);
			return new Promise((resolve, reject) => {

				req.db.users.findOne({where: {email: params.email}})
					.then((user) => {

						if (user === null || SHA1(params.password) !== user.password) {
							reject(config.errors.getError('no-user-login'))
						} else {

							// req.logActivity('login', user);
							resolve({
								token: AmpedAuthorization.encodeToken(user),
								user: user.get({raw: true})
							});
						}

					}).catch(reject)

			})
		}

		/**
		 * Creates a signed JWT token for the system to authenticate the user with in all api requests.
		 *
		 * @param {object} user - An object with all the current users data in it
		 *
		 * @returns {string} - A JWT signed token
		 */
		static encodeToken(user) {

			if (typeof user.dataValues !== 'undefined')
				user = user.dataValues;

			return util.generateJWT({
				id: user.id,
				email: user.email
			}, config.jwt);
		}

		/**
		 * Decodes the user token and returns the payload
		 *
		 * @param {string} jwt   - A signed JWT token which the payload needs to be fetched from
		 *
		 * @returns {Promise}   - A Promise which when resolves has the payload as its parameter.
		 */
		static decodeToken(jwt) {
			console.log('DECODING');
			return new Promise((resolve, reject) => {
				console.log('HELLO');
				console.log(JWT.decode(jwt));
				// JWT.decode(config.jwt.secret, jwt, (err, decode) => {
				//   console.log(err);
				//   if ( err ) reject(err);
				//   else resolve(decode);
				// })
			})

		}

		/**
		 * Sets the user in the req object by using the authorization header in the call.
		 * Should be called through `app.use` so the user is automatically attached to every request
		 *
		 * @param {object} req      - Express request object
		 * @param {object} res      - Express response object
		 * @param {function} next   - Express missleware callback
		 */
		static setUserByToken(req, res, next) {
			const query = url.parse(req.url, true).query;
			if (typeof req.headers.authorization === 'undefined' || req.headers.authorization === null || req.headers.authorization === 'null' || req.headers.authorization === '') {
				req.user = null;
				next();
			} else {
				AmpedAuthorization.getUserByPayload(req)
					.then((user) => {
						req.user = user.get({plain: true});
						next();
					}).catch((err) => {
					next({
						success: false,
						message: err
					})
				});
			}

		}

		/**
		 * A static call to build the user object by `req.payload` and fetching the data through the database
		 *
		 * @param {object} req          - Express request object
		 */
		static getUserByPayload(req) {

			return new Promise((resolve, reject) => {

				// console.log(config.routing.noAuth.indexOf(req.url) !== -1 || typeof req.payload === 'undefined' || req.payload.id === ''|| parseInt(req.payload.id) === 0);
				// console.log(req.url);
				// console.log(config.routing.noAuth.indexOf(req.url), config.routing.noAuth.indexOf(req.url) !== -1);
				// console.log(typeof req.payload === 'undefined');
				// console.log(req.payload.id === '');
				// console.log(parseInt(req.payload.id) === 0);
				if (config.routing.noAuth.indexOf(req.url) !== -1 && typeof req.payload === 'undefined') {
					resolve(null);
				} else {
					if (typeof req.payload === 'undefined' || req.payload.id === '' || parseInt(req.payload.id) === 0)
						resolve(null);
					else
						req.dbRef.users.getModel().findOne({
							where: {id: parseInt(req.payload.id)},
							include: req.dbRef.users.getQueryIncludes()
						})
							.then(resolve)
							.catch(reject);
				}
			})

		}

		/**
		 * Gets user based on JWT token
		 *
		 * @param {string} jwt  - JWT encoded string
		 * @returns {object}
		 */
		static getUserByJWT(jwt) {
			const
				payload = JWT.decode(jwt),
				users = AmpedConnector.getModelRef('users');

			return users.getModel().findOne({
				where: {id: parseInt(payload.id)},
				include: users.queryIncludes,
				raw: true
			})

		}

		/**
		 * Converts a string with a decimal to an object.
		 *
		 * 'foo.bar' = 'sup' -> { foo : { bar : 'sup' } }
		 *
		 * @param {object} data - An object which should be searched through to conver the data types
		 *
		 * @returns {object}    - A convert object
		 */
		static convertQueryRelations(data) {
			return Object.keys(data).reduce((ret, key) => {
				if (key.indexOf('.') !== -1) {
					const parts = key.split('.');
					if (typeof ret[parts[0]] === 'undefined')
						ret[parts[0]] = {};
					ret[parts[0]][parts[1]] = data[key];
				} else {
					ret[key] = data[key];
				}
				return ret;
			}, {});
		}

		static middleware(req, res, next) {
			AmpedAuthorization.setUserByToken(req, res, next);
		}
	}

	return AmpedAuthorization;

}


// Export AmpedAuthorization as the class to create new instances of
//
// // Export all of the static functions for convenience
// module.exports.getUserByJWT = AmpedAuthorization.getUserByJWT;
// module.exports.decodeToken = AmpedAuthorization.decodeToken;
// module.exports.encodeToken = AmpedAuthorization.encodeToken;
// module.exports.getUserByToken = AmpedAuthorization.getUserByToken;
// module.exports.convertQueryRelations = AmpedAuthorization.convertQueryRelations;
//
// // Export the middleware for each request
// module.exports.middleware = function (params) {
//   const auth = new AmpedAuthorization(params);
//
//   return auth.setUserByToken;
//
// }
