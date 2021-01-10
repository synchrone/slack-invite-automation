const {checkVerification, registerPhone } = require('../lib/verification');
const { render } = require('../lib/render');
const { invite } = require('../lib/slack');

module.exports = async function (req, res) {
    let isFailedSms = false;
    let isFailedEmail = false;
    let isFailedName = false;
    let messageSms = 'The SMS verification failed. Please check the code';
    let messageEmail = 'The Email is required';
    let messageName = 'The Full name is required';

    const email = req.body.email;
    const name = req.body.name;
    const phone = req.body.phone;
    const smsToken = req.body.smsToken;

    if (!email) {
        isFailedEmail = true;
    }
    if (!name) {
        isFailedName = true;
    }
    if (!smsToken || !/^[0-9]{6}$/.test(smsToken)) {
        isFailedSms = true;
    }
    if (!/[\p{L}-]+ [\p{L}-]+/u.test(name)) {
        isFailedName = true;
        messageName = 'Please enter your full name'
    }
    if (!/^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i.test(email)) {
        isFailedEmail = true;
        messageEmail = 'Please enter a valid Email'
    }

    if (!isFailedSms && !isFailedName && !isFailedEmail) {
        if (await checkVerification(phone, smsToken)) {
            const body = await invite(email, name)
            if (body.ok) {
                await registerPhone(phone)
                return res.redirect('/?success=1')
            } else {
                isFailedEmail = true;
                let error = body.error;
                if (error === 'already_invited' || error === 'already_in_team') {
                    messageEmail = 'You were already invited. ' + config.slackUrl
                } else if (error === 'invalid_email') {
                    messageEmail = 'The email you entered is an invalid email.'
                } else {
                    messageEmail = 'Something has gone wrong. Please contact a system administrator.'
                }
            }
        }
    }

    return render(res, 'index', {
        name: name,
        email: email,
        phone: phone,
        isFailedSms: isFailedSms,
        isFailedEmail: isFailedEmail,
        isFailedName: isFailedName,
        messageSms: messageSms,
        messageEmail: messageEmail,
        messageName: messageName,
    });
};