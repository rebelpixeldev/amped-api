'use strict';
// @TODO make this an external npm module
const
	url = require('url');

const defaultParams = {
	token: false
}

/**
 * AmpedFeedback class provides structure to all responses
 */
module.exports = function(config) {

	class AmpedFeedback {

		constructor(params) {
			this._params = Object.assign({}, defaultParams, params);
		}

		/**
		 * Called when a response is needed
		 *
		 * As a default a response is sent as true:
		 *    `{ "success" : true, "message" : "", "response" : [] }
		 *
		 * @param {object} req  - Express request object
		 * @param {object} res  - Express response object
		 * @param {any} data    -
		 *      The data that is parsed and returned.
		 *      If data is an object - The method will look for the `success`, `message` and `meta` keys to set them as the return keys
		 *        Everything else that is in the data object is returned under the `response` key
		 *      If data is a string - The value is passed as a string and the response is sent
		 *
		 * @returns {null}
		 */
		onFeedback(req, res, data) {
			const
				resp = {success: true, message: '', response: []};
			// params = req.amped.params;

			if (data === false || data === null) {
				resp.success = false;
			} else if (data === true) {
				resp.success = true;
				resp.response = [];
			} else {
				if (typeof data !== 'undefined' && typeof data.success !== 'undefined') {
					resp.success = data.success;
					delete data.success;
				}

				if (typeof data !== 'undefined' && typeof data.message !== 'undefined') {
					resp.message = data.message;
					delete data.message;
				}

				if (typeof data !== 'undefined' && typeof data.meta !== 'undefined') {
					resp.meta = data.meta;
					delete data.meta;
				}

				resp.response = typeof data !== 'undefined' && data !== null && typeof data.response !== 'undefined' ? data.response : (data || []);
			}

			if (typeof res !== 'undefined' && res !== null)
				res.json(resp);
			return resp;

		}

		onFeedbackError(req, res, message = '', response = {}) {
			return this.onFeedback(req, res, {
				success: false,
				message,
				response
			});
		}

		onFeedbackSuccess(req, res, message = '', response = {}) {
			return this.onFeedback(req, res, {
				message,
				response
			});
		}

		getFeedbackError(message = '', response = {}) {
			return this.onFeedback(null, null, {
				success: false,
				message,
				response
			});
		}

		getFeedbackSuccess(message = '', response = {}) {
			return this.onFeedback(null, null, {
				success: true,
				message,
				response
			});
		}

	}
	return AmpedFeedback;
}

// Export a middleware function to attach the feedback functionality to the request object
// module.exports = function (params) {
//
//
//   const feedback = new AmpedFeedback(params);
//
//   return (req, res, next) => {
//
//   }
//
// };
