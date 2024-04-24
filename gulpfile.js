const gulp = require("gulp");
const ts = require("gulp-typescript");
const terser = require("gulp-terser");

// Load TypeScript configuration
const tsProject = ts.createProject("tsconfig.json");

const methodNames = [
  "bindMethods",
  "toggleEventListeners",
  "handleSlotChange",
  "initProperties",
  "setIndex",
  "down",
  "move",
  "updateSliderPosition",
  "up",
  "keydown",
  "adjustPosition",
  "setScrollPosition",
  "setShown",
  "createResizeObserver",
  "getItemOffsets",
  "getContentChildren",
  "isCurrentSlider",
  "render",
  "isDragging",
  "passedThreshold",
  "movementStartX",
  "finalScrollPosition",
  "maxWidth",
  "sliderWidth",
  "reachedEnd",
  "currentScrollPosition",
  "threshold",
  "currentIndex",
  "shown",
  "maxWidth",
].join("|");

function typescript() {
  return tsProject.src().pipe(tsProject()).pipe(gulp.dest("dist"));
}

function minify() {
  return gulp
    .src("dist/**/*.js")
    .pipe(
      terser({
        ecma: 2020, // Use ECMAScript 2020
        module: true, // Enable when minifying an ES6 module
        toplevel: true, // Enable top level mangling and unused variable dropping
        compress: {
          drop_console: true, // Remove console logs for production
          drop_debugger: true, // Remove debugger statements
        },
        mangle: {
          properties: {
            // Only mangle properties that are safe
            regex: new RegExp(methodNames),
          },
        },
        format: {
          comments: false, // Remove comments
          beautify: false, // Set to false to minify output
        },
        keep_classnames: false, // Do not keep class names
        keep_fnames: false, // Do not keep function names
        safari10: true, // Enable workarounds for Safari 10 bugs
      })
    )
    .pipe(gulp.dest("dist"));
}

exports.default = gulp.series(typescript, minify);
