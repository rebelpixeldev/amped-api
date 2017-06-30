const
  fs          = require('fs'),
  Handlebars  = require('handlebars'),
  juice       = require('juice'),
  mandrill    =  require('mandrill-api'),
  path        = require('path');




module.exports = function(config) {
	// @TODO figure out a good was to get rid of readFileSync in this file;

	const
		mandrill_client = new mandrill.Mandrill(config.email.mandrillKey),
		css = fs.readFileSync(path.join(__dirname, `./templates/assets/css/email.css`)).toString('utf8'),
		util = require('./AmpedUtil')(config);

	class AmpedEmailer {

		constructor(template, layout = 'default') {
			this.templateName = template;
			this.template = fs.readFileSync(path.join(__dirname, `./templates/emails/${template}.html`)).toString('utf8');
			this.layout = fs.readFileSync(path.join(__dirname, `./templates/layouts/${layout}.html`)).toString('utf8');

		}

		send(req, data, subject = `${config.site.name} Email`) {
			console.log('SENDING EMAIL');
			const params = util.getParams(req);

			return new Promise((resolve, reject) => {
				this.compileTemplate(data)
					.then((message) => {

						const info = {
							message,
							subject,
							to: [{
								email: params.email,
								name: params.name,
								type: 'to'
							}]
						};

						const opts = this.getMandrillOptions(info);
						mandrill_client.messages.send({message: opts}, function (result) {
							console.log('MANDRILL', result);
							// @TODO this is only listening to the first email, if multiple are sent we need to loop through and make sure all the email were sent

							if (result[0].reject_reason === null) {
								resolve();
							} else {
								reject(result[0].reject_reason)
							}

						}, function (e) {
							reject(`${e.name} - ${e.message}`);
						});
					}).catch((err) => {
					console.log(err);
				})
			})

		}

		compileTemplate(data) {
			return new Promise((resolve, reject) => {
				data.email_content = Handlebars.compile(this.template)(data);
				data.style = css;

				const compiled = juice(Handlebars.compile(this.layout)(data), css);
				resolve(compiled);
			})
		}

		getMandrillOptions(data) {
			return {
				html: data.message,
				text: 'Example text content',
				subject: data.subject,
				from_email: config.email.noReply,
				from_name: config.email.noReplyName,
				to: data.to,
				'headers': {
					'Reply-To': config.email.noReply
				},
				important: false,
				track_opens: null,
				track_clicks: null,
				auto_text: null,
				auto_html: null,
				inline_css: null,
				url_strip_qs: null,
				preserve_recipients: null,
				view_content_link: null,
				// bcc_address: 'message.bcc_address@example.com',
				tracking_domain: null,
				signing_domain: null,
				return_path_domain: null,
				merge: true,
				merge_language: 'mailchimp',
				tags: [
					this.templateName
				],
				// subaccount: 'customer-123',
				// google_analytics_domains: [
				//   example.com'
				// ],
				// google_analytics_campaign': 'message.from_email@example.com',
				metadata: {
					website: 'www.example.com'
				}
			}
		}
	}

	return AmpedEmailer;
}