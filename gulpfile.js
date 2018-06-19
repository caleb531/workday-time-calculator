// Core Gulp
let gulp = require('gulp');
let sourcemaps = require('gulp-sourcemaps');
// Sass-to-CSS
let sass = require('gulp-sass');

// JavaScript
let rollup = require('rollup');
let rollupConfig = require('./rollup.config.js');

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
  return rollup.rollup(rollupConfig).then(bundle => {
    return bundle.write(rollupConfig.output);
  });
});
gulp.task('rollup:watch', () => {
	return gulp.watch('app/scripts/**/*.js', ['rollup']);
});

gulp.task('assets', [
  'assets:core',
  'assets:quill'
]);
gulp.task('assets:core', () => {
  return gulp.src('app/assets/**/*')
    .pipe(gulp.dest('public'));
});
gulp.task('assets:quill', () => {
  return gulp.src('node_modules/quill/dist/quill.snow.css')
    .pipe(gulp.dest('public/styles'));
});
gulp.task('assets:watch', () => {
	return gulp.watch('app/assets/**/*', ['assets']);
});

gulp.task('build', [
  'assets',
  'sass',
  'rollup'
]);
gulp.task('watch', [
  'assets:watch',
  'sass:watch',
  'rollup:watch'
]);
