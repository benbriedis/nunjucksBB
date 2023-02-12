(function() {
  'use strict';

  var expect;
  var util;
  var Environment;
  var Loader;
  var templatesPath;
  var path;

    expect = require('expect.js');
    util = require('./util');
    Environment = require('../src/environment').default;
    Loader = require('../src/node-loaders').FileSystemLoader;
    templatesPath = 'tests/templates';
    path = require('path');

  describe('api', () => {
    it('should always force compilation of parent template', async () => {
      var env = new Environment(new Loader(templatesPath));

      var child = await env.getTemplate('base-inherit.njk');
      expect(await child.render()).to.be('Foo*Bar*BazFizzle\n');
    });

    it('should handle correctly relative paths', async () => {
      var env;
      var child1;
      var child2;
      if (typeof path === 'undefined') {
        this.skip();
        return;
      }
      env = new Environment(new Loader(templatesPath));
      child1 = await env.getTemplate('relative/test1.njk');
      child2 = await env.getTemplate('relative/test2.njk');

      expect(await child1.render()).to.be('FooTest1BazFizzle\n');
      expect(await child2.render()).to.be('FooTest2BazFizzle\n');
    });

    it('should handle correctly cache for relative paths', async () => {
      var env;
      var test;
      if (typeof path === 'undefined') {
        this.skip();
        return;
      }
      env = new Environment(new Loader(templatesPath));
      test = await env.getTemplate('relative/test-cache.njk');

      expect(util.normEOL(await test.render())).to.be('Test1\nTest2');
    });

    it('should handle correctly relative paths in renderString', async () => {
      var env;
      if (typeof path === 'undefined') {
        this.skip();
        return;
      }
      env = new Environment(new Loader(templatesPath));
      expect(await env.renderString('{% extends "./relative/test1.njk" %}{% block block1 %}Test3{% endblock %}', {}, {
        path: path.resolve(templatesPath, 'string.njk')
      })).to.be('FooTest3BazFizzle\n');
    });

    it('should emit "load" event on Environment instance', async () => {
      var env = new Environment(new Loader(templatesPath));
      env.on('load', function(name, source) {
        expect(name).to.equal('item.njk');
        //done();  //TODO think about further 
      });
      await env.render('item.njk', {});
    });
  });
}());
