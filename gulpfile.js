let gulp = require('gulp');
let sourcemaps = require('gulp-sourcemaps');
let sass = require('gulp-sass');
let rollup = require('rollup');
let rollupConfig = require('./rollup.config.js');

gulp.task('assets', [
  'assets:core',
  'assets:css',
  'assets:js'
]);
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
      'node_modules/lodash/lodash.min.js'
    ])
    .pipe(gulp.dest('public/scripts'));
});
gulp.task('assets:watch', () => {
	return gulp.watch('app/assets/**/*', ['assets']);
});

gulp.task('sass', () => {
	return gulp.src('app/styles/index.scss')
		.pipe(sourcemaps.init())
		.pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest('public/styles'));
});
gulp.task('sass:watch', () => {
	return gulp.watch('app/styles/**/*.scss', ['sass']);
});

gulp.task('rollup', () => {
  return rollup.rollup(rollupConfig).then((bundle) => {
    return bundle.write(rollupConfig.output);
  });
});
gulp.task('rollup:watch', () => {
	return gulp.watch('app/scripts/**/*.js', ['rollup']);
});

gulp.task('build', [
  'assets',
  'sass',
  'rollup'
]);
gulp.task('build:watch', [
  'build',
  'assets:watch',
  'sass:watch',
  'rollup:watch'
]);
