(function() {
  'use strict';

  var expect,
    Environment,
    WebLoader,
    FileSystemLoader,
    NodeResolveLoader,
    templatesPath;

  if (typeof require !== 'undefined') {
    expect = require('expect.js');
    Environment = require('../src/environment').default;
    WebLoader = require('../src/web-loaders').WebLoader;
    FileSystemLoader = require('../src/node-loaders').FileSystemLoader;
    NodeResolveLoader = require('../src/node-loaders').NodeResolveLoader;
    templatesPath = 'tests/templates';
  } else {
    expect = window.expect;
    Environment = nunjucks.Environment;
    WebLoader = nunjucks.WebLoader;
    FileSystemLoader = nunjucks.FileSystemLoader;
    NodeResolveLoader = nunjucks.NodeResolveLoader;
    templatesPath = '../templates';
  }

  describe('loader', function() {
    it('should allow a simple loader to be created', async() => {
      // From Docs: http://mozilla.github.io/nunjucks/api.html#writing-a-loader
      // We should be able to create a loader that only exposes getSource
      var env, parent;

      function MyLoader() {
        // configuration
      }

      MyLoader.prototype.getSource = function() {
        return {
          src: 'Hello World',
          path: '/tmp/somewhere'
        };
      };

      env = new Environment(new MyLoader(templatesPath));
      parent = await env.getTemplate('fake.njk');
      expect(await parent.render()).to.be('Hello World');
    });

    it('should catch loader error', async() => {
      // From Docs: http://mozilla.github.io/nunjucks/api.html#writing-a-loader
      // We should be able to create a loader that only exposes getSource
      var env;

      function MyLoader() {
        // configuration
        this.async = true;
      }

      MyLoader.prototype.getSource = async function() {
          throw new Error('test');
      };

      env = new Environment(new MyLoader(templatesPath));
	  try {
      	parent = await env.getTemplate('fake.njk');
		//FIXME add 'not here' test
	  }
	  catch(err) {
        expect(err).to.be.a(Error);
	  }
    });

    describe('WebLoader', function() {
      it('should have default opts for WebLoader', async() => {
        var webLoader = new WebLoader(templatesPath);
        expect(webLoader).to.be.a(WebLoader);
        expect(webLoader.useCache).to.be(false);
        expect(webLoader.async).to.be(false);
      });

      it('should emit a "load" event', async() => {
        var loader = new WebLoader(templatesPath);

        if (typeof window === 'undefined') {
          this.skip();
        }

        loader.on('load', function(name, source) {
          expect(name).to.equal('simple-base.njk');
        });

        loader.getSource('simple-base.njk');
      });
    });

    if (typeof FileSystemLoader !== 'undefined') {
      describe('FileSystemLoader', function() {
        it('should have default opts', async() => {
          var loader = new FileSystemLoader(templatesPath);
          expect(loader).to.be.a(FileSystemLoader);
          expect(loader.noCache).to.be(false);
        });

        it('should emit a "load" event', async() => {
          var loader = new FileSystemLoader(templatesPath);
          loader.on('load', function(name, source) {
            expect(name).to.equal('simple-base.njk');
          });

          loader.getSource('simple-base.njk');
        });
      });
    }

    if (typeof NodeResolveLoader !== 'undefined') {
      describe('NodeResolveLoader', function() {
        it('should have default opts', async() => {
          var loader = new NodeResolveLoader();
          expect(loader).to.be.a(NodeResolveLoader);
          expect(loader.noCache).to.be(false);
        });

        it('should emit a "load" event', async() => {
          var loader = new NodeResolveLoader();
          loader.on('load', function(name, source) {
            expect(name).to.equal('dummy-pkg/simple-template.html');
          });

          loader.getSource('dummy-pkg/simple-template.html');
        });

        it('should render templates', async() => {
          var env = new Environment(new NodeResolveLoader());
          var tmpl = await env.getTemplate('dummy-pkg/simple-template.html');
          expect(await tmpl.render({foo: 'foo'})).to.be('foo');
        });

        it('should not allow directory traversal', async() => {
          var loader = new NodeResolveLoader();
          var dummyPkgPath = require.resolve('dummy-pkg/simple-template.html');   //XXX await needed?
          expect(await loader.getSource(dummyPkgPath)).to.be(null);
        });

        it('should return null if no match', async() => {
          var loader = new NodeResolveLoader();
          var tmplName = 'dummy-pkg/does-not-exist.html';
          expect(await loader.getSource(tmplName)).to.be(null);
        });
      });
    }
  });
}());
