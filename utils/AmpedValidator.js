
module.exports = function(config) {

	const
		util    = require('./AmpedUtil')(config);

	class AmpedValidator {

		static validateParams(validators, req, res, next) {

			const params = util.getParams(req);

			const notValid = validators.filter(validator => {
				if (typeof validator === 'string') {
					return AmpedValidator.validate(validator, params);
				} else {
					return AmpedValidator.validate(validator.param, params);
				}

			})

			if (notValid.length > 0) {
				const field = typeof notValid[0] === 'string' ? notValid[0] : notValid[0].param;
				res.feedback({success: false, message: `${field} is not valid`, response: field});
			} else {
				next(null);
			}

		}

		static validate(key, params) {
			return typeof params[key] === 'undefined' ||
				params[key] === null ||
				params[key] === '';
		}
	}

	return AmpedValidator;
}
