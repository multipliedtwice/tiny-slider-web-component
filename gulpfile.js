const gulp = require("gulp");
const ts = require("gulp-typescript");
const terser = require("gulp-terser");
const replace = require("gulp-replace");

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
  "contentElement",
  "sliderElement",
].join("|");

function typescript() {
  return tsProject.src().pipe(tsProject()).pipe(gulp.dest("dist"));
}

function minify() {
  return gulp
    .src("dist/**/*.js")
    .pipe(
      replace(
        /(<style>[^<]+<\/style>[\s\S]*?<div class="slider">[\s\S]*?<\/div>[\s\S]*?<\/div>)/g,
        match => match.replace(/\s{2,}/g, ' ').replace(/\n/g, '')
      )
    )
    .pipe(
      terser({
        ecma: 2020,
        module: true,
        toplevel: true,
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
        mangle: {
          properties: {
            regex: new RegExp(methodNames),
          },
        },
        format: {
          comments: false,
          beautify: false,
        },
        keep_classnames: false,
        keep_fnames: false,
        safari10: true,
      })
    )
    .pipe(gulp.dest("../rememo/client/static/js"));
  // .pipe(gulp.dest("dist"));
}

function watchFiles() {
  gulp.watch("src/**/*.ts", typescript);
  gulp.watch("dist/**/*.js", minify);
}

function watchFiles() {
  gulp.watch("src/**/*.ts", gulp.series(typescript, minify));
}

exports.default = gulp.series(typescript, minify);
exports.watch = gulp.series(exports.default, watchFiles);