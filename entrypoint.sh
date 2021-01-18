#!/usr/bin/env bash

npm install

node node_modules/.bin/nodemon -e js,twig,css,json --inspect=0.0.0.0:9229 ./bin/www
