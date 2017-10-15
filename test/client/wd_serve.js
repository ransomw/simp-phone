const fs = require('fs')
const path = require('path')
const http = require('http')
const url = require('url')
const execFile = require('child_process').execFile;
const browserify = require('browserify')

const R = require('ramda')
const webdriverio = require('webdriverio')

const CD_PATH = require('chromedriver').path
const WD_PORT = process.env.WD_PORT || 7999
const WD_DELAY = 500 // MS
const LOG_DIR = path.join(__dirname, '..', '..', 'log')

const {
  delay: delay,
} = require('./util')

const build_js_file = function (path_src, path_out) {
  const bfy = browserify({
    entries: [path_src],
    cache: {},
    packageCache: {},
    debug: false, // source maps
    standalone: 'Test',
  })
  return new Promise(function (resolve, reject) {
    var stream_bundle = bfy.bundle()
    stream_bundle.pipe(fs.createWriteStream(path_out))
    stream_bundle.on('end', function () {
      resolve()
    })
  })
}

const read_file = function (file_path) {
  return new Promise(function (resolve, reject) {
    fs.readFile(file_path, 'utf8', function (err, data) {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}

const start_server = function () {
  const server = http.createServer((req, res) => {
    const url_pathname = url.parse(req.url).pathname
    if (url_pathname === '/') {
      Promise.resolve().then(function () {
        return read_file(path.join(
          __dirname, 'wwwdriver', 'index.html'))
      }).then(function (html_str) {
        res.end(html_str)
      })
    } else if (url_pathname === '/test_exports.js') {
      Promise.resolve().then(function () {
        return read_file(path.join(
          __dirname, 'wwwdriver', 'test_exports.js'))
      }).then(function (js_str) {
        res.end(js_str)
      })
    } else {
      res.statusCode = 404
      res.end()
    }
  })
  const close_server = function () {
    return new Promise(function (resolve, reject) {
      server.on('close', () => resolve({}))
      server.close()
    })
  }
  return Promise.resolve().then(function () {
    return new Promise(function (resolve, reject) {
      server.listen(() => resolve())
    })
  }).then(function () {
    return [server.address().port, close_server]
  })
}

const build_n_serve = function (module_filepath) {
  return Promise.resolve().then(function () {
    return build_js_file(
      module_filepath,
      path.join(__dirname, 'wwwdriver', 'test_exports.js'))
  }).then(function () {
    return start_server()
  })
}

/**
 * load a CommonJS module into a webdriver test
 * in order to test parts of the JS api (e.g. WebRTC)
 * not available in node
 */
const make_wd_test = function (module_filepath, test_spec) {
  return function (t) {
    const close_signal = 'SIGKILL'
    const wd_client = webdriverio.remote({
      host: 'localhost',
      port: WD_PORT,
      logLevel: 'verbose',
      logOutput: LOG_DIR,
      desiredCapabilities: {
        browserName: 'chrome',
        chromeOptions: {
          args: [
            '--use-fake-ui-for-media-stream',
          ],
        },
      }
    })
    const wd_proc = execFile(
      CD_PATH, ['--url-base=/wd/hub',
                '--port=' + WD_PORT.toString()]);
    t.ok(wd_proc.pid, "browser process started")
    var stop_server
    const cleanup_test = function () {
      return Promise.resolve().then(function () {
        return wd_client.end()
      }).then(function () {
        const exit_promise = new Promise(function (resolve, reject) {
          wd_proc.on('exit', function (code, signal) {
            resolve(signal)
          })
        })
        wd_proc.kill(close_signal)
        return exit_promise
      }).then(function (signal) {
        t.equal(signal, close_signal,
                "webdriver process exit on expected signal")
        return stop_server()
      })
    }
    return Promise.resolve().then(delay(WD_DELAY)).then(function () {
        return wd_client.init()
    }).then(function (res) {
      return build_n_serve(module_filepath)
    }).then(R.curry(R.apply)(function (port, res_stop_server) {
      stop_server = res_stop_server
      return wd_client.url('http://localhost:'+port)
    })).then(function () {
      return test_spec(t, wd_client)
    }).then(function () {
      return wd_client.log('browser')
    }).then(R.compose(function (browser_logs) {
      fs.appendFileSync(
        path.join(LOG_DIR, 'test_console.log'),
        R.map(R.prop('message'), browser_logs).join('\n'))
    }, R.prop('value'))).then(function () {
      return cleanup_test()
    }, function (err) {
      t.fail("unhandled error during webdriver test")
      console.error(err)
      return cleanup_test()
    })
  }
}

var exports = {}

exports.make_wd_test = make_wd_test

module.exports = exports
