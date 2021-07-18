let gulp = require('gulp');
let sourcemaps = require('gulp-sourcemaps');
let sass = require('gulp-sass')(require('sass'));
let rollup = require('rollup');
let rollupConfig = require('./rollup.config.js');
let workboxBuild = require('workbox-build');

gulp.task('assets:core', () => {
  return gulp.src('app/assets/**/*')
    .pipe(gulp.dest('public'));
});
gulp.task('assets:css', () => {
  return gulp.src('node_modules/quill/dist/quill.snow.css')
    .pipe(gulp.dest('public/styles'));
});
gulp.task('assets:js', () => {
  return gulp.src([
      'node_modules/mithril/mithril.min.js',
      'node_modules/moment/min/moment.min.js',
      'node_modules/quill/dist/quill.min.js',
      'node_modules/lodash/lodash.min.js',
      'node_modules/clipboard/dist/clipboard.min.js',
      'node_modules/sw-update-manager/sw-update-manager.js'
    ])
    .pipe(gulp.dest('public/scripts'));
});
gulp.task('assets', gulp.parallel(
  'assets:core',
  'assets:css',
  'assets:js'
));
gulp.task('assets:watch', () => {
	return gulp.watch('app/assets/**/*', gulp.series('assets:core', 'sw'));
});

gulp.task('sass', () => {
	return gulp.src('app/styles/index.scss')
		.pipe(sourcemaps.init())
		.pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest('public/styles'));
});
gulp.task('sass:watch', () => {
	return gulp.watch('app/styles/**/*.scss', gulp.series('sass', 'sw'));
});

gulp.task('rollup', () => {
  return rollup.rollup(rollupConfig).then((bundle) => {
    return bundle.write(rollupConfig.output);
  });
});
gulp.task('rollup:watch', () => {
	return gulp.watch('app/scripts/**/*.js', gulp.series('rollup', 'sw'));
});

gulp.task('sw', () => {
  return workboxBuild.injectManifest({
    globDirectory: 'public',
    globPatterns: [
      '**\/*.{js,css,png}',
      'icons/*.svg'
    ],
    // Precaching index.html using templatedUrls fixes a "Response served by
    // service worker has redirections" error on iOS 12; see
    // <https://github.com/v8/v8.dev/issues/4> and
    // <https://github.com/v8/v8.dev/pull/7>
    templatedUrls: {
      '.': ['index.html']
    },
    swSrc: 'app/scripts/service-worker.js',
    swDest: 'public/service-worker.js'
  }).then(({warnings}) => {
    warnings.forEach(console.warn);
  });
});

gulp.task('build', gulp.series(
  gulp.parallel(
    'assets',
    'sass',
    'rollup'
  ),
  'sw'
));
gulp.task('build:watch', gulp.series(
  'build',
  gulp.parallel(
    'assets:watch',
    'sass:watch',
    'rollup:watch'
  )
));
