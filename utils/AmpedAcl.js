'use strict';

const
	aclLib = require('acl'),
	acl = new aclLib(new aclLib.memoryBackend()),
	url = require('url');

let config = {}


module.exports = function(c) {

	if ( typeof c !== 'undefined' )
		config = c;

	const AmpedConnector = require('./AmpedConnector')(config);

	class AmpedAcl {

		static can(req, res, next) {
			// console.log(permission, resource);

			next();
		}

		static buildACL() {
			const
				models = AmpedConnector.getModels(),
				supermanAllows = [],
				adminAllows = [],
				managerAllows = [],
				userAllows = [];

			Object.keys(AmpedConnector.getModels()).forEach((modelName) => {

				const model = models[modelName];

				if (model.supermanAclPermissions !== false)
					acl.allow('superman', model.modelName, model.supermanAclPermissions);

				if (model.adminAclPermissions !== false)
					acl.allow('admin', model.modelName, model.adminAclPermissions);

				if (model.managerAclPermissions !== false)
					acl.allow('manager', model.modelName, model.managerAclPermissions);

				if (model.userAclPermissions !== false)
					acl.allow('user', model.modelName, model.userAclPermissions);

			});

			acl.addUserRoles('superman', 'superman');
			acl.addUserRoles('admin', 'admin');
			acl.addUserRoles('manager', 'manager');
			acl.addUserRoles('user', 'user');

		}

		static can(permission, resource, req, res, next) {

			acl.isAllowed(req.user.user_groups[0], resource, permission, function (err, allowed) {
				if (allowed) {
					next();
				} else
					res.feedback({success: false, message: 'You are not authorized'});
			})
		}

	}

	return AmpedAcl;
}

// module.exports = function () {
//
//   console.log(ampedAcl);
//
//   return {
//     getInstance : () => AmpedAcl,
//     can : (permission, resource) => {
//         return AmpedAcl.can.bind(acl, permission, resource);
//     }
//   };
//
// }
