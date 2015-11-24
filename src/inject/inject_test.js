/*global describe, it, beforeEach, afterEach*/
'use strict';

var fs = require('fs'),
  path = require('path'),
  es = require('event-stream'),
  should = require('should');

var gutil = require('gulp-util'),
  inject = require('../../.');

describe('gulp-inject', function () {
  var log;

  beforeEach(function () {
    log = gutil.log;
  });

  afterEach(function () {
    gutil.log = log;
  });

  it('should throw an error when the old api with target as string is used', function () {
    should(function () {
      var stream = inject('fixtures/template.html');
    }).throw();
  });

  it('should throw an error if sources stream is undefined', function () {
    should(function () {
      var stream = inject();
    }).throw();
  });

  it('should throw an error if `templateString` option is specified', function () {
    should(function () {
      src(['template.html'], {read: true})
        .pipe(inject(src(['file.js']), {templateString: '<html></html>'}));
    }).throw();
  });

  it('should throw an error if `sort` option is specified', function () {
    should(function () {
      src(['template.html'], {read: true})
        .pipe(inject(src(['file.js']), {sort: function () {}}));
    }).throw();
  });

  it('should inject stylesheets, scripts, images, jsx and html components into desired file', function (done) {
    var target = src(['template.html'], {read: true});
    var sources = src([
      'lib.js',
      'component.html',
      'styles.css',
      'image.png',
      'lib.jsx'
    ]);

    var stream = target.pipe(inject(sources));

    streamShouldContain(stream, ['defaults.html'], done);
  });

  it('should inject sources into multiple targets', function (done) {

    var target = src(['template.html', 'template2.html'], {read: true});
    var sources = src([
      'lib.js',
      'component.html',
      'styles.css',
      'image.png',
      'lib.jsx'
    ]);

    var stream = target.pipe(inject(sources));

    streamShouldContain(stream, ['defaults.html', 'defaults2.html'], done);
  });

  it('should inject stylesheets, scripts and html components with `ignorePath` removed from file path', function (done) {
    var target = src(['template.html'], {read: true});
    var sources = src([
      'lib.js',
      'component.html',
      'lib2.js',
      'styles.css',
      'lib.jsx'
    ]);

    var stream = target.pipe(inject(sources, {ignorePath: '/fixtures'}));

    streamShouldContain(stream, ['ignorePath.html'], done);
  });

  it('should inject stylesheets, scripts and html components with relative paths to target file if `relative` is truthy', function (done) {
    var target = src(['template.html'], {read: true});
    var sources = src([
      '../../folder/lib.js',
      '../../another/component.html',
      '../a-folder/lib2.js',
      '../../yet-another/styles.css',
      '../components/lib.jsx',
    ]);

    var stream = target.pipe(inject(sources, {relative: true}));

    streamShouldContain(stream, ['relative.html'], done);
  });

  it('should inject stylesheets, scripts and html components with `addPrefix` added to file path', function (done) {
    var target = src(['template.html'], {read: true});
    var sources = src([
      'lib.js',
      'component.html',
      'lib2.js',
      'styles.css',
      'lib.jsx'
    ]);

    var stream = target.pipe(inject(sources, {addPrefix: 'my-test-dir'}));

    streamShouldContain(stream, ['addPrefix.html'], done);
  });

  it('should inject stylesheets, scripts and html components with `addSuffix` added to file path', function (done) {
    var target = src(['template.html'], {read: true});
    var sources = src([
      'lib.js',
      'component.html',
      'lib2.js',
      'styles.css',
      'lib.jsx'
    ]);

    var stream = target.pipe(inject(sources, {addSuffix: '?my-test=suffix'}));

    streamShouldContain(stream, ['addSuffix.html'], done);
  });

  it('should inject stylesheets, scripts and html components with `versioning` is `true`', function (done) {
    var target = src(['template.html'], {read: true});
    var sources = src([
      'versioning.js' // note that git can replace /r/n to /n and /n to /r/n. That will change the hash
    ], {read: true});

    var stream = target.pipe(inject(sources, {versioning: true}));

    streamShouldContain(stream, ['versioningDefault.html'], done);
  });

  it('should inject stylesheets, scripts and html components with custom `versioning` opts', function (done) {
    var target = src(['template.html'], {read: true});
    var sources = src([
      'versioning.js'
    ], {read: true});

    var stream = target.pipe(inject(sources, {versioning: {hash: 'sha1', paramName: 'version'}}));

    streamShouldContain(stream, ['versioningCustom.html'], done);
  });

  it('should inject stylesheets and html components with self closing tags if `selfClosingTag` is truthy', function (done) {
    var target = src(['template.html'], {read: true});
    var sources = src([
      'component.html',
      'styles.css'
    ]);

    var stream = target.pipe(inject(sources, {selfClosingTag: true}));

    streamShouldContain(stream, ['selfClosingTag.html'], done);
  });

  it('should inject stylesheets, scripts and html components without root slash if `addRootSlash` is `false`', function (done) {
    var target = src(['template.html'], {read: true});
    var sources = src([
      'lib.js',
      'component.html',
      'styles.css',
      'lib.jsx'
    ]);

    var stream = target.pipe(inject(sources, {addRootSlash: false}));

    streamShouldContain(stream, ['noRootSlash.html'], done);
  });

  it('should inject stylesheets, scripts and html components without root slash if `addRootSlash` is `false` and `ignorePath` is set', function (done) {
    var target = src(['template.html'], {read: true});
    var sources = src([
      'a/folder/lib.js',
      'a/folder/component.html',
      'a/folder/styles.css',
      'a/folder/lib.jsx'
    ]);

    var stream = target.pipe(inject(sources, {addRootSlash: false, ignorePath: 'fixtures'}));

    streamShouldContain(stream, ['noRootSlashWithIgnorePath.html'], done);
  });

  it('should use starttag and endtag if specified', function (done) {
    var target = src(['templateCustomTags.html'], {read: true});
    var sources = src([
      'lib.js',
      'lib2.js',
      'style.css'
    ]);

    var stream = target.pipe(inject(sources, {
      ignorePath: 'fixtures',
      starttag: '<!DOCTYPE html>',
      endtag: '<h1>'
    }));

    streamShouldContain(stream, ['customTags.html'], done);
  });

  it('should use starttag and endtag with specified name if specified', function (done) {
    var target = src(['templateCustomName.html'], {read: true});
    var sources = src([
      'lib.js',
      'lib2.js'
    ]);

    var stream = target.pipe(inject(sources, {name: 'head'}));

    streamShouldContain(stream, ['customName.html'], done);
  });

  it('should replace {{ext}} in starttag and endtag with current file extension if specified', function (done) {
    var target = src(['templateTagsWithExt.html'], {read: true});
    var sources = src([
      'lib.js',
      'component.html',
      'lib2.js'
    ]);

    var stream = target.pipe(inject(sources, {
      ignorePath: 'fixtures',
      starttag: '<!-- {{ext}}: -->',
      endtag: '<!-- /{{ext}} -->'
    }));

    streamShouldContain(stream, ['customTagsWithExt.html'], done);
  });

  it('should replace existing data within start and end tag', function (done) {
    var target = src(['templateWithExistingData.html'], {read: true});
    var sources = src([
      'lib.js',
      'component.html',
      'lib2.js',
      'styles.css'
    ]);

    var stream = target.pipe(inject(sources, {
      ignorePath: 'fixtures',
    }));

    streamShouldContain(stream, ['existingData.html'], done);
  });

  it('should use custom transform function for each file if specified', function (done) {
    var target = src(['template.json'], {read: true});
    var sources = src([
      'lib.js',
      'component.html',
      'lib2.js',
      'styles.css'
    ]);

    var stream = target.pipe(inject(sources, {
      ignorePath: 'fixtures',
      starttag: '"{{ext}}": [',
      endtag: ']',
      transform: function (srcPath, file, i, length) {
        return '  "' + srcPath + '"' + (i + 1 < length ? ',' : '');
      }
    }));

    streamShouldContain(stream, ['customTransform.json'], done);
  });

  it('should use special default tags when injecting into jsx files', function (done) {
    var target = src(['template.jsx'], {read: true});
    var sources = src([
      'lib.js',
      'component.html',
      'styles.css'
    ]);

    var stream = target.pipe(inject(sources));

    streamShouldContain(stream, ['defaults.jsx'], done);
  });

  it('should use special default tags when injecting into jade files', function (done) {
    var target = src(['template.jade'], {read: true});
    var sources = src([
      'lib.js',
      'component.html',
      'styles.css'
    ]);

    var stream = target.pipe(inject(sources));

    streamShouldContain(stream, ['defaults.jade'], done);
  });

  it('should use special default tags when injecting into slm files', function (done) {
    var target = src(['template.slm'], {read: true});
    var sources = src([
      'lib.js',
      'component.html',
      'styles.css'
    ]);

    var stream = target.pipe(inject(sources));

    streamShouldContain(stream, ['defaults.slm'], done);
  });

  it('should use special default tags when injecting into haml files', function (done) {
    var target = src(['template.haml'], {read: true});
    var sources = src([
      'lib.js',
      'component.html',
      'styles.css'
    ]);

    var stream = target.pipe(inject(sources));

    streamShouldContain(stream, ['defaults.haml'], done);
  });

  it('should be able to chain inject calls with different names without overrides (Issue #39)', function (done) {
    var target = src(['issue39.html'], {read: true});
    var sources1 = src([
      'lib1.js',
      'lib3.js'
    ]);
    var sources2 = src([
      'lib2.js',
      'lib4.js'
    ]);

    var stream = target
      .pipe(inject(sources1, {name: 'head'}))
      .pipe(inject(sources2));

    streamShouldContain(stream, ['issue39.html'], done);
  });


  it('should be able to inject hashed files (Issue #71)', function (done) {
    var target = src(['issue71.html'], {read: true});
    var sources = src([
      'lib.js?abcdef0123456789',
      'styles.css?0123456789abcdef'
    ]);

    var stream = target.pipe(inject(sources));

    streamShouldContain(stream, ['issue71.html'], done);
  });

  it('should be able to inject when tags are missing whitespace (Issue #56)', function (done) {
    var target = src(['issue56.html'], {read: true});
    var sources = src([
      'lib.js'
    ]);

    var stream = target.pipe(inject(sources));

    streamShouldContain(stream, ['issue56.html'], done);
  });

  it('should not crash when transform function returns undefined (Issue #74)', function (done) {
    var target = src(['issue74.html'], {read: true});
    var sources = src([
      'lib.js'
    ]);

    var stream = target.pipe(inject(sources, {transform: function () {}}));

    streamShouldContain(stream, ['issue74.html'], done);
  });

  it('should be able to remove tags if option present', function (done) {
    var target = src(['template.html'], {read: true});
    var sources = src([
      'lib.js',
      'component.html',
      'styles.css',
      'image.png',
      'lib.jsx'
    ]);

    var stream = target.pipe(inject(sources,{removeTags:true}));

    streamShouldContain(stream, ['removeTags.html'], done);
  });

  it('should not produce log output if quiet option is set', function (done) {
    var logOutput = [];
    gutil.log = function () {
      logOutput.push(arguments);
    };

    var target = src(['template.html'], {read: true});
    var sources = src([
      'lib.js',
      'component.html',
      'styles.css',
      'image.png'
    ]);

    var stream = target.pipe(inject(sources, {quiet: true}));

    stream.on('end', function () {
      logOutput.should.have.length(0);
      done();
    });
  });

  it('should produce log output if quiet option is not set', function (done) {
    var logOutput = [];
    gutil.log = function () {
      logOutput.push(arguments);
    };

    var target = src(['template.html'], {read: true});
    var sources = src([
      'lib.js',
      'component.html',
      'styles.css',
      'image.png'
    ]);

    var stream = target.pipe(inject(sources));

    stream.on('end', function () {
      logOutput.should.have.length(1);
      done();
    });
  });

  it('should be able to modify only the filepath (Issue #107)', function (done) {
    var version = '1.0.0';

    var target = src(['issue107.html'], {read: true});
    var sources = src([
      'lib.js'
    ]);

    var stream = target.pipe(inject(sources, {
      transform: function (filepath) {
        arguments[0] = filepath + '?v=' + version;
        return inject.transform.apply(inject.transform, arguments);
      }
    }));

    streamShouldContain(stream, ['issue107.html'], done);
  });
});

function src (files, opt) {
  opt = opt || {};
  var stream = es.readArray(files.map(function (file) {
    return fixture(file, opt.read);
  }));
  return stream;
}

function streamShouldContain (stream, files, done) {
  var received = 0;

  stream.on('error', function(err) {
    should.exist(err);
    done(err);
  });

  var contents = files.map(function (file) {
    return String(expectedFile(file).contents);
  });

  stream.on('data', function (newFile) {
    should.exist(newFile);
    should.exist(newFile.contents);

    if (contents.length === 1) {
      String(newFile.contents).should.equal(contents[0]);
    } else {
      contents.should.containEql(String(newFile.contents));
    }

    if (++received === files.length) {
      done();
    }
  });
}

function expectedFile (file) {
  var filepath = path.resolve(__dirname, 'expected', file);
  return new gutil.File({
    path: filepath,
    cwd: __dirname,
    base: path.resolve(__dirname, 'expected', path.dirname(file)),
    contents: fs.readFileSync(filepath)
  });
}

function fixture (file, read) {
  var filepath = path.resolve(__dirname, 'fixtures', file);
  return new gutil.File({
    path: filepath,
    cwd: __dirname,
    base: path.resolve(__dirname, 'fixtures', path.dirname(file)),
    contents: read ? fs.readFileSync(filepath) : null
  });
}
