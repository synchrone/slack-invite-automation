const config = require('../config');
const { render } = require('../lib/render');
const request = require('request');

module.exports = {
    invite: function(name, email, phone, res, cb) {
        request.post({
            url: 'https://' + config.slackUrl + '/api/users.admin.invite',
            form: {
                email: email,
                real_name: name,
                token: config.slacktoken,
                set_active: true
            }
        }, function (err, httpResponse, body) {
            // body looks like:
            //   {"ok":true}
            //       or
            //   {"ok":false,"error":"already_invited"}
            if (err) {
                return res.send('Error:' + err);
            }
            body = JSON.parse(body);
            if (body.ok) {
                res.redirect('/?success=1');
                // render(res, 'index', {
                //     message: 'Success! Check &ldquo;' + email + '&rdquo; for an invite from Slack.'
                // });
            } else {
                let error = body.error;
                if (error === 'already_invited' || error === 'already_in_team') {
                    error = 'Success! You were already invited. ' + config.slackUrl;
                } else if (error === 'invalid_email') {
                    error = 'The email you entered is an invalid email.';
                } else if (error === 'invalid_auth') {
                    error = 'Something has gone wrong. Please contact a system administrator.';
                }

                render(res, 'index', {
                    name: name,
                    email: email,
                    phone: phone,
                    isFailedEmail: true,
                    messageEmail: error
                });
            }

            cb(body.ok);
        });
    },
};
