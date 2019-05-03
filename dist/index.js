"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

require("@babel/polyfill");

var _request2 = _interopRequireDefault(require("request"));

var _socket = _interopRequireDefault(require("socket.io-client"));

var _sailsIo = _interopRequireDefault(require("sails.io.js"));

var _url = require("url");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var SailsClient =
/*#__PURE__*/
function () {
  function SailsClient(args) {
    _classCallCheck(this, SailsClient);

    this.url = new _url.URL(args.url || 'http://localhost:1337/api/');

    if (this.url.protocol === null) {
      throw new Error('Invalid url');
    }

    if (args.auth) {
      this.auth = {
        username: args.auth.username,
        password: args.auth.password,
        endpoint: args.auth.endpoint || 'auth/token',
        usernameField: args.auth.usernameField || 'email',
        passwordField: args.auth.passwordField || 'password'
      };
    }

    this.reconnect = true;
    this.listeners = [];
  }

  _createClass(SailsClient, [{
    key: "init",
    value: function () {
      var _init = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee() {
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return this.getCookie();

              case 2:
                _context.next = 4;
                return this.socketInit();

              case 4:
                _context.next = 6;
                return this.connect();

              case 6:
                if (!this.auth) {
                  _context.next = 9;
                  break;
                }

                _context.next = 9;
                return this.authenticate();

              case 9:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function init() {
        return _init.apply(this, arguments);
      }

      return init;
    }()
  }, {
    key: "on",
    value: function on(event, method) {
      this.listeners.push({
        event: event,
        method: method
      });

      if (this.isConnected() === true) {
        this.socket.on(event, method);
      }
    }
  }, {
    key: "getCookie",
    value: function () {
      var _getCookie = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee2() {
        var response;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return this.request({
                  uri: this.url.origin + '/__getcookie',
                  method: 'GET'
                });

              case 2:
                response = _context2.sent;
                this.cookies = response.headers['set-cookie'];

              case 4:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function getCookie() {
        return _getCookie.apply(this, arguments);
      }

      return getCookie;
    }()
  }, {
    key: "authenticate",
    value: function () {
      var _authenticate = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee3(auth) {
        var _this$post;

        var response;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _context3.next = 2;
                return this.post(auth.endpoint, (_this$post = {}, _defineProperty(_this$post, auth.usernameField, auth.username), _defineProperty(_this$post, auth.passwordField, auth.password), _this$post));

              case 2:
                response = _context3.sent;
                auth.response = response;
                return _context3.abrupt("return", auth);

              case 5:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function authenticate(_x) {
        return _authenticate.apply(this, arguments);
      }

      return authenticate;
    }()
  }, {
    key: "get",
    value: function () {
      var _get = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee4(path, params) {
        var response;
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                _context4.next = 2;
                return this.request({
                  uri: this.url.href + path,
                  method: 'GET',
                  body: params,
                  json: true
                });

              case 2:
                response = _context4.sent;
                return _context4.abrupt("return", response.body);

              case 4:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function get(_x2, _x3) {
        return _get.apply(this, arguments);
      }

      return get;
    }()
  }, {
    key: "post",
    value: function () {
      var _post = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee5(path, params) {
        var response;
        return regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                _context5.next = 2;
                return this.request({
                  uri: this.url.href + path,
                  method: 'POST',
                  body: params,
                  json: true
                });

              case 2:
                response = _context5.sent;
                return _context5.abrupt("return", response.body);

              case 4:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function post(_x4, _x5) {
        return _post.apply(this, arguments);
      }

      return post;
    }()
  }, {
    key: "put",
    value: function () {
      var _put = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee6(path, params) {
        var response;
        return regeneratorRuntime.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                _context6.next = 2;
                return this.request({
                  uri: this.url.href + path,
                  method: 'PUT',
                  body: params,
                  json: true
                });

              case 2:
                response = _context6.sent;
                return _context6.abrupt("return", response.body);

              case 4:
              case "end":
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      function put(_x6, _x7) {
        return _put.apply(this, arguments);
      }

      return put;
    }()
  }, {
    key: "patch",
    value: function () {
      var _patch = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee7(path, params) {
        var response;
        return regeneratorRuntime.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                _context7.next = 2;
                return this.request({
                  uri: this.url.href + path,
                  method: 'PATCH',
                  body: params,
                  json: true
                });

              case 2:
                response = _context7.sent;
                return _context7.abrupt("return", response.body);

              case 4:
              case "end":
                return _context7.stop();
            }
          }
        }, _callee7, this);
      }));

      function patch(_x8, _x9) {
        return _patch.apply(this, arguments);
      }

      return patch;
    }()
  }, {
    key: "delete",
    value: function () {
      var _delete2 = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee8(path, params) {
        var response;
        return regeneratorRuntime.wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                _context8.next = 2;
                return this.request({
                  uri: this.url.href + path,
                  method: 'DELETE',
                  body: params,
                  json: true
                });

              case 2:
                response = _context8.sent;
                return _context8.abrupt("return", response.body);

              case 4:
              case "end":
                return _context8.stop();
            }
          }
        }, _callee8, this);
      }));

      function _delete(_x10, _x11) {
        return _delete2.apply(this, arguments);
      }

      return _delete;
    }()
  }, {
    key: "request",
    value: function () {
      var _request = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee9(params) {
        var response;
        return regeneratorRuntime.wrap(function _callee9$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                if (!(this.isConnected() === true)) {
                  _context9.next = 6;
                  break;
                }

                _context9.next = 3;
                return this.socketRequest(params);

              case 3:
                response = _context9.sent;
                _context9.next = 9;
                break;

              case 6:
                _context9.next = 8;
                return this.xhrRequest(params);

              case 8:
                response = _context9.sent;

              case 9:
                if (!(response.statusCode !== 200)) {
                  _context9.next = 11;
                  break;
                }

                throw new Error("[".concat(response.statusCode, "] ").concat(response.body));

              case 11:
                return _context9.abrupt("return", response);

              case 12:
              case "end":
                return _context9.stop();
            }
          }
        }, _callee9, this);
      }));

      function request(_x12) {
        return _request.apply(this, arguments);
      }

      return request;
    }()
  }, {
    key: "socketInit",
    value: function () {
      var _socketInit = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee10() {
        return regeneratorRuntime.wrap(function _callee10$(_context10) {
          while (1) {
            switch (_context10.prev = _context10.next) {
              case 0:
                this.io = new _sailsIo["default"](_socket["default"]);
                this.io.sails.initialConnectionHeaders = {
                  'cookie': this.cookies //'Authorization': this.auth && this.auth.token

                };
                this.io.sails.url = this.url.origin;
                this.io.sails.autoConnect = false;
                this.io.sails.reconnection = this.reconnect;

              case 5:
              case "end":
                return _context10.stop();
            }
          }
        }, _callee10, this);
      }));

      function socketInit() {
        return _socketInit.apply(this, arguments);
      }

      return socketInit;
    }()
  }, {
    key: "isConnected",
    value: function isConnected() {
      if (typeof this.socket === 'undefined') {
        return false;
      } else {
        return this.socket.isConnected();
      }
    }
  }, {
    key: "connect",
    value: function () {
      var _connect = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee11() {
        var _this = this;

        return regeneratorRuntime.wrap(function _callee11$(_context11) {
          while (1) {
            switch (_context11.prev = _context11.next) {
              case 0:
                if (!(this.isConnected() === false)) {
                  _context11.next = 4;
                  break;
                }

                return _context11.abrupt("return", new Promise(function (resolve, reject) {
                  _this.socket = _this.io.sails.connect();
                  var _iteratorNormalCompletion = true;
                  var _didIteratorError = false;
                  var _iteratorError = undefined;

                  try {
                    for (var _iterator = _this.listeners[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                      var listener = _step.value;

                      _this.socket.on(listener.event, listener.method);
                    }
                  } catch (err) {
                    _didIteratorError = true;
                    _iteratorError = err;
                  } finally {
                    try {
                      if (!_iteratorNormalCompletion && _iterator["return"] != null) {
                        _iterator["return"]();
                      }
                    } finally {
                      if (_didIteratorError) {
                        throw _iteratorError;
                      }
                    }
                  }

                  _this.socket.on('connect', function (data) {
                    resolve(true);
                  });
                }));

              case 4:
                console.warn('Already connected');

              case 5:
              case "end":
                return _context11.stop();
            }
          }
        }, _callee11, this);
      }));

      function connect() {
        return _connect.apply(this, arguments);
      }

      return connect;
    }()
  }, {
    key: "disconnect",
    value: function () {
      var _disconnect = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee13() {
        var _this2 = this;

        return regeneratorRuntime.wrap(function _callee13$(_context13) {
          while (1) {
            switch (_context13.prev = _context13.next) {
              case 0:
                if (!(this.isConnected() === true)) {
                  _context13.next = 4;
                  break;
                }

                return _context13.abrupt("return", new Promise(function (resolve, reject) {
                  _this2.socket.on('disconnect',
                  /*#__PURE__*/
                  function () {
                    var _ref = _asyncToGenerator(
                    /*#__PURE__*/
                    regeneratorRuntime.mark(function _callee12(data) {
                      return regeneratorRuntime.wrap(function _callee12$(_context12) {
                        while (1) {
                          switch (_context12.prev = _context12.next) {
                            case 0:
                              resolve(true);

                            case 1:
                            case "end":
                              return _context12.stop();
                          }
                        }
                      }, _callee12);
                    }));

                    return function (_x13) {
                      return _ref.apply(this, arguments);
                    };
                  }());

                  _this2.socket.disconnect();
                }));

              case 4:
                console.warn('already disconnected');

              case 5:
              case "end":
                return _context13.stop();
            }
          }
        }, _callee13, this);
      }));

      function disconnect() {
        return _disconnect.apply(this, arguments);
      }

      return disconnect;
    }()
  }, {
    key: "socketRequest",
    value: function socketRequest(params) {
      var _this3 = this;

      return new Promise(function (resolve, reject) {
        if (typeof params.headers === 'undefined') {
          params.headers = {};
        }

        try {
          _this3.socket.request({
            method: params.method || 'GET',
            url: params.uri,
            data: params.body,
            headers: params.headers
          }, function (body, jwr) {
            return resolve(jwr);
          });
        } catch (err) {
          return reject(err);
        }
      });
    }
  }, {
    key: "xhrRequest",
    value: function xhrRequest(params) {
      return new Promise(function (resolve, reject) {
        (0, _request2["default"])(params, function (err, response, body) {
          if (err) return reject(err);else {
            return resolve(response);
          }
        });
      });
    }
  }]);

  return SailsClient;
}();

var _default = SailsClient;
exports["default"] = _default;
