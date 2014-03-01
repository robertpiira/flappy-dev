
// Flappy Engine
// Author:  @robertpiira
// Home:    github.com/robertpiira/flappyDev
// Thanks:  Johan G for the gravity


(function (win, doc, undefined) {
  'use strict';

  win.requestAnimFrame = (function () {
    return  win.requestAnimationFrame  ||
      win.webkitRequestAnimationFrame  ||
      win.mozRequestAnimationFrame
  })();

  win.cancelRequestAnimationFrame = (function () {
    return  win.cancelRequestAnimationFrame  ||
      win.webkitCancelRequestAnimationFrame  ||
      win.mozCancelRequestAnimationFrame
  })();

  var _game;
  var evt = doc.createEvent('Event');
  evt.initEvent('gameIsOn', true, true);

  var createCanvas = function () {
    var canvasEl = doc.createElement('canvas');

    canvasEl.style.position = 'absolute';

    return {
      canvas: canvasEl,
      ctx: canvasEl.getContext('2d')
    };
  };

  var createImage = function (src) {
    var img = new Image();

    img.src = src;

    return img;
  };

  var Asset = function (context, asset, img) {
    this.el = img;
    this.offsetX = (asset.offset && asset.offset.x) ? asset.offset.x : 0;
    this.offsetY = (asset.offset && asset.offset.y) ? asset.offset.y : 0;
    this.scopeGravityY = context.gravityY;
    this.velocityY = 0;
    this.w = img.width;
    this.h = img.height;
    this.x = 0 + this.offsetX;
    this.y = 0 + this.offsetY;
    this.inView = false;

    this.context = context;
    this.contextW = context.width
    this.contextH = context.height;
  };

  Asset.prototype  = {

    reset: function () {
      this.x = 0 + this.offsetX;
      this.y = 0 + this.offsetY;
      this.velocityY = 0;
    },

    isCollision: function (x, y, w, h) {
      return  (this.x + this.w >= x) && (this.x <= x + w) &&
              (this.y + this.h >= y) && (this.y <= y + h);
    },

    isOutOfBounds: function (w, h) {
      return  (this.x <= 0) || (this.w + this.x >= w) ||
              (this.y <= 0) || (this.h + this.y >= h);
    },

    isInView: function () {
      // hardcoded canvas size variables
      return  (this.x < 500) && (this.x + this.w > 0) &&
              (this.y < 500) && (this.y + this.h > 0)
    },

    fall: function () {
      this.velocityY -= this.scopeGravityY;
      this.y += this.velocityY;
    },

    rise: function (value) {
      this.velocityY = -value;
    },

    callback: function (callback) {
      callback.call(this);
    },

    hasPassed: function (coord) {
      return  (this.x + this.w < coord);
    },

    move: function (speed) {

      var _this = this;

      return {
        left:   function () { _this.x = _this.x - speed || - 0.5; },
        right:  function () { _this.x = _this.x + speed || - 0.5; },
        up:     function () { _this.y = _this.y - speed || - 0.5; },
        down:   function () { _this.y = _this.y + speed || - 0.5; }
      };

    }

  };

  win.FlappyEngine = function (container, options) {

    _game = this;

    var settings = options || {};
    var requestId;

    var loop = function () {

      requestId = win.requestAnimFrame(loop);

      if (_game.loadedAssets === _game.assetsLength) {
        _game.render();
      }

    };

    this.container = container;
    this.container.style.position = 'relative';
    this.width = container.getBoundingClientRect().width;
    this.height = container.getBoundingClientRect().height;
    this.background = createCanvas();
    this.background.canvas.width = this.width;
    this.background.canvas.height = this.height;
    this.foreground = createCanvas();
    this.foreground.canvas.width = this.width;
    this.foreground.canvas.height = this.height;
    this.game = createCanvas();
    this.game.canvas.width = this.width;
    this.game.canvas.height = this.height;
    this.paused = false;
    this.idle = true;
    this.on = false;
    this.level = 0;
    this.assets = {};
    this.gravityY = settings.gravityY || -0.19;
    this.loadedAssets = 0;
    this.assetsLength = 0;

    this.container.appendChild(this.background.canvas);
    this.container.appendChild(this.game.canvas);
    this.container.appendChild(this.foreground.canvas);

    this.start = function () {

      if (!requestId) {
        loop();
      }

    };

    this.stop = function () {

      if (requestId) {
         win.cancelRequestAnimationFrame(requestId);
         requestId = undefined;
         this.on = false;
      }

    };

    this.loadAssets = function (a) {

      var assetImg;
      var collection;

      if (a.collectionName && !_game.assets[a.collectionName]) {
        collection = _game.assets[a.collectionName] = [];
      }

      this.assetsLength = this.assetsLength + a.assets.length;

      a.assets.forEach(function (asset) {

        (function (b) {

          createImage(b.src).addEventListener('load', function () {

            assetImg = this;

            if (collection) {

              if (a.amount) {
                for (var i = 0; i < a.amount; i++) {
                  collection.push(new Asset(_game, b, assetImg));
                }
              }

              else {
                collection.push(new Asset(_game, b, assetImg));
              }

            }

            else if (b.name) {
              _game.assets[b.name] = new Asset(_game, b, assetImg);
            }

            _game.loadedAssets = _game.loadedAssets + 1;

            if (_game.loadedAssets === _game.assetsLength) {
              doc.dispatchEvent(evt);
            }

          }, false);

        })(asset);

      });

    };

    this.onLoad = function (callback) {

      doc.addEventListener('gameIsOn', function () {
        callback.call(_game);
      }, false);

    };

  }

  FlappyEngine.prototype = {

    play: function () {
      this.idle = false;
      this.on = true;
      this.paused = false;
    },

    render: function () {

      if (this.paused) { return; }

      this.clearCanvas();
      this.inLoop();

    },

    reset: function () {

      this.paused = false;
      this.on = false;
      this.level = 0;
      this.idle = true;

      for (var key in this.assets) {

        if (this.assets.hasOwnProperty(key)) {

          if (this.assets[key].length) {

            this.assets[key].forEach(function (asset) {
              asset.reset();
            });

          }

          else {
            this.assets[key].reset();
          }

        }

      }

    },

    togglePause: function () {

      this.paused = !this.paused;

    },

    getGameState: function () {

      return {
        paused: this.paused,
        on: this.on,
        level: this.level,
        idle: this.idle
      }

    },

    clicksOnContainer: function (callback) {

      this.container.addEventListener('click', function () {

        if (typeof callback === 'function') {
          callback.call(_game);
        }

      }, false);

    },

    inLoop: function (callback) {

      this.inLoopCallback = this.inLoopCallback || callback;

      if (!callback) {
        this.inLoopCallback.call(this);
      }

    },

    clearCanvas: function() {

      this.background.ctx.clearRect(0, 0, this.width, this.height);
      this.game.ctx.clearRect(0, 0, this.width, this.height);

    }

  };

})(window, document);





