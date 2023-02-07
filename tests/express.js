'use strict';

var path = require('path');
var express = require('express');
var expect = require('expect.js');
var request = require('supertest');
var nunjucks = require('../src/index').default;

var VIEWS = path.join(__dirname, '../samples/express/views');

describe('express', function() {
  var app;
  var env;

  beforeEach(function() {
    app = express();
    env = new nunjucks.Environment(new nunjucks.FileSystemLoader(VIEWS));
    env.express(app);
  });

  it('should have reference to nunjucks env', async() => {
    expect(app.settings.nunjucksEnv).to.be(env);
  });

  it('should render a view with extension', async() => {
    app.get('/', async function(req, res) {
      await res.render('about.html');
    });
    await request(app)
      .get('/')
      .expect(/This is just the about page/)
  });

  it('should render a view without extension', async() => {
    app.get('/', async function(req, res) {
      await res.render('about');
    });
    app.set('view engine', 'html');
    await request(app)
      .get('/')
      .expect(/This is just the about page/)
      .end(done);
  });
});

