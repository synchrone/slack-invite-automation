Slack Invite Automation
------------

[![Build Status](https://travis-ci.com/synchrone/slack-invite-automation.svg?branch=master)](https://travis-ci.com/outsideris/slack-invite-automation)

A tiny web application to invite a user into your Slack team.

Inspired by
[How I hacked Slack into a community platform with Typeform](https://levels.io/slack-typeform-auto-invite-sign-ups/)
and Socket.io's Slack page.

This project supports Heroku, Azure, Cloud Foundry, Amazon Web Services (AWS), and [ic.dev](https://ic.dev).

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)
[![Deploy to Azure](https://azuredeploy.net/deploybutton.png)](https://azuredeploy.net/)

## Settings

You can set variables for your own purpose in `config.js` or environment variables.

### `config.js`

Fill out `config.js` as your infomation.

* `community`: your community or team name to display on join page.
* `slackUrl` : your slack team url (ex.: socketio.slack.com)
* `slacktoken` : Your access token for Slack. (see [Issue token](#issue-token))
* `inviteToken`: An optional security measure - if it is set, then that token will be required to get invited.
* `recaptchaSiteKey`: An optional security measure - if it is set, and `recaptchaSecretKey` is set, then a captcha will be required to get invited.
* `recaptchaSecretKey`: An optional security measure - if it is set, and `recaptchaSiteKey` is set, then a captcha will be required to get invited.
* `locale`: Application language (currently `cs`, `de`, `en`, `es`, `fr`, `it`,  `ja`, `ko`, `nl`, `pl`, `pt`, `pt-BR`, `tr`, `zh-CN` and `zh-TW` available).
* `subpath`: Sub-path in URL. For example, if `/example` is set, it's served in `/example`, not `/`. Default is `/`.

### Environment Variables
You can set environment variables directly or in `.env` file.
If you want to use a `.env` file, create a file in the root called `.env` with the following key/value pairs.
(`.env` files are added to the `.gitignore`.)

- `COMMUNITY_NAME` : Your community or team name to display on join page.
- `SLACK_URL` : Your Slack team url (ex.: socketio.slack.com)
- `SLACK_TOKEN` : Your access token for Slack. (see [Issue token](#issue-token))
- `INVITE_TOKEN`: An optional security measure - if it is set, then that token will be required to get invited.
- `RECAPTCHA_SITE`: An optional security measure - used to enable reCAPTCHA.
- `RECAPTCHA_SECRET`: An optional security measure - used to enable reCAPTCHA.
- `LOCALE`: Application language (currently `cs`, `de`, `en`, `es`, `fr`, `it`, `ja`, `ko`, `nl`, `pl`, `pt`, `pt-BR`, `tr`, `zh-CN` and `zh-TW` available).
- `SUBPATH`: Sub-path in URL. For example, if `/example` is set, it's served in `/example`, not `/`. Default is `/`.

**Sample**

```
COMMUNITY_NAME=socketio
SLACK_URL=socketio.slack.com
SLACK_TOKEN=ffsdf-5411524512154-16875416847864648976-45641654654654654-444334f43b34566f
INVITE_TOKEN=abcdefg
LOCALE=en
```

You can test your token via curl:

  ```shell
   curl -X POST 'https://YOUR-SLACK-TEAM.slack.com/api/users.admin.invite' \
   --data 'email=EMAIL&token=TOKEN&set_active=true' \
   --compressed
  ```

### Heroku / Azure

Add the application settings that are defined in the environment variables above.

### Amazon Web Services (AWS)

If you have an AWS account and have already installed and configured the AWS CLI tool, you can easily deploy this application to API Gateway and Lambda via CloudFormation in a few minutes.

Instead of editing `config.js`, take these steps:

1. Copy `aws/config.example.sh` to `aws/config.sh`
2. Edit the values in `aws/config.sh`, which correspond to the variables described above, plus these:
    * `StackName`: the name of the CloudFormation stack to create
    * `S3BucketArtifacts`: the name of an existing S3 bucket you have write access to, for storing deployment artifacts
    * `S3PrefixArtifacts`: the prefix to use within that S3 bucket for all deployment artifacts written
3. Run `aws/deploy.sh` to create the CloudFormation stack and deploy your application, outputting the URL
4. (Optional) For a friendlier URL, log into the AWS web console and establish a custom domain pointing to the API Gateway stage deployed in step 3.

### [ic.dev](https://ic.dev)

If you haven't already installed the IC CLI, please refer to the [documentation](https://ic.dev/docs/en/installation).

Deploy the `lsuss.slack_inviter` brick directly from the IC Public Index:
```shell
$ ic aws up lsuss.slack_inviter slack_inviter --params community_name='Your Community Name',slack_url=yourcommunity.slack.com,slack_token=xoxp-xxx-xxx-xxx-xxx
```

Retreive the id and url of the API:
```shell
$ ic aws value slack_inviter
```

## Run
[Node.js](http://nodejs.org/) is required.

```shell
$ git clone https://github.com/outsideris/slack-invite-automation.git
$ cd slack-invite-automation
$ npm install
$ npm start
```

You can access <http://localhost:3000> on your web browser.

![](screenshots/join-page.jpg)

## Run with Docker

It's easy to run this service if you have installed Docker on your system.
Pull [the Docker image from Docker Hub](https://hub.docker.com/r/outsideris/slack-invite-automation/).

```shell
$ docker pull outsideris/slack-invite-automation
$ docker run -it --rm -e COMMUNITY_NAME="YOUR-TEAM-NAME" -e SLACK_URL="YOUR-TEAM.slack.com" -e SLACK_TOKEN="YOUR-ACCESS-TOKEN" -p 3000:3000 outsideris/slack-invite-automation
```

Or, You can build a Docker image yourself.

```shell
$ git clone https://github.com/outsideris/slack-invite-automation.git
$ cd slack-invite-automation
$ docker build -t outsideris/slack-invite-automation .
$ docker run -it --rm -e COMMUNITY_NAME="YOUR-TEAM-NAME" -e SLACK_URL="YOUR-TEAM.slack.com" -e SLACK_TOKEN="YOUR-ACCESS-TOKEN" -p 3000:3000 outsideris/slack-invite-automation
```

## Issue token
**You should generate the token in admin user, or owner.**

### OAuth tokens
1. Visit <https://api.slack.com/apps?new_classic_app=1> and Create New Classic App.

    ![](screenshots/oauth1.gif)

1. Click "Permissions".

    ![](screenshots/oauth2.gif)

1. In "OAuth & Permissions" page, select `admin` scope under "Permission Scopes" menu and save changes.

    ![](screenshots/oauth3.gif)

1. Get your client_id and client_secret, and configure them in .env or environment variables

1. Launch the app and visit <https://localhost:3000/oauth> in your browser
    * Authorize app via your workspace
    * after returning to localhost, copy the token into configuration
    * You can test auto invites with curl by providing the `OAuth Access Token`.
    ```sh
    curl -X POST 'https://myteam.slack.com/api/users.admin.invite' \
   --data 'email=test@email.com&token=OAuthAccessToken&set_active=true' \
   --compressed
   ```
    ![](screenshots/basic_info-client_id.png)

## Badge

![](screenshots/badge.png)

You can use the badge to show status of user in your slack.

* With default colors:
    ```
    <img src="https://your.domain/badge.svg">
    ```

* With custom colors:

    * `?colorA=abcdef` Set background of the left part (hex color only)
    * `?colorB=fedcba` Set background of the right part (hex color only)

    ```
    <img src="https://your.domain/badge.svg?colorA=155799&colorB=159957">
    ```

## reCAPTCHA
Register a new site in [Google reCAPTHCA](https://www.google.com/recaptcha/)
as reCAPTCHA v3 type.

![](screenshots/recaptcha.gif)

Set "Site key" as `recaptchaSiteKey` or `RECAPTCHA_SITE`,
and "Secret key" as `recaptchaSecretKey` or `RECAPTCHA_SECRET`.

## twilio

Dev mode: `TWILIO_DEBUG=true` to avoid talking to twilio for local debugging

Prod config:
* [create api keys](https://www.twilio.com/console/project/api-keys), configure `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN`
* [create verify service](https://www.twilio.com/console/verify/services), configure as `TWILIO_VERIFY_SERVICE_ID`
* create rate limits:
    * `twilio api:verify:v2:services:rate-limits:create --service-sid $TWILIO_VERIFY_SERVICE_ID --unique-name ratelimit` 
    * `twilio api:verify:v2:services:rate-limits:buckets:create --service-sid $TWILIO_VERIFY_SERVICE_ID --rate-limit-sid RKcf669f219bde259fee01c587403587b6 --max <SMS_SENT> --interval <SECONDS>`
* [create sync servcie](https://www.twilio.com/console/sync/services), configure `TWILIO_SYNC_SERVICE_ID`
* create phone and ban maps for `TWILIO_SYNC_MAP_ID` and `TWILIO_SYNC_BAN_MAP_ID` respectively:
    `twilio api:sync:v1:services:maps:create --service-id $TWILIO_SYNC_SERVICE_ID`


## Associate fork with heroku
If you use the "Deploy to Heroku" button and want to modify your App you should
fork this project. After forking and making changes you should associate your
repo with the deployed instance by running:

`$ heroku git:remote -a thawing-inlet-61413` replacing your heroku app's name
and running

`$ git push heroku master` to upload the changes. For full details see
[Heroku: deploying with git](https://devcenter.heroku.com/articles/git#for-an-existing-heroku-app)
