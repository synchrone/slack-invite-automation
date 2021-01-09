const config = require('../config');

const {checkVerification, registerPhone } = require('../lib/verification');
const { render } = require('../lib/render');
const { invite } = require('../lib/invite');

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
    if (!/^([a-zA-Z]+) ([a-zA-Z]+)$/.test(name)) {
        isFailedName = true;
        messageName = 'Please enter the correct full name in the format: "First Last"'
    }
    if (!/^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i.test(email)) {
        isFailedEmail = true;
        messageEmail = 'Please enter the correct Email'
    }

    if (!isFailedSms && !isFailedName && !isFailedEmail) {
        if (await checkVerification(phone, smsToken)) {
            return invite(name, email, phone, res, async ok => {
                if (!ok && !config.twilioDebug) {
                    return;
                }

                await registerPhone(phone);
            });
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