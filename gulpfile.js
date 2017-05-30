var gulp = require('gulp');
var data = require('gulp-data');
var less = require('gulp-less');
var browserSync = require('browser-sync').create();
var header = require('gulp-header');
var cleanCSS = require('gulp-clean-css');
var rename = require("gulp-rename");
var uglify = require('gulp-uglify');
var markdown = require('gulp-markdown');
var mustache = require("gulp-mustache");
var pkg = require('./package.json');

var verbose = false;
var fs = require('fs');
var path = require('path');

// Load the YAML parser module
var jsyaml = require( 'js-yaml' );

readYaml = function(fileName) {
    var content = null;

    try {
        content = jsyaml.load(fs.readFileSync(path.resolve(fileName),'utf-8'));
    } catch (err) {
        console.log(err);
        process.exit(1);
    }
    return content;
}

gulp.task('markdown', function() {
    return gulp.src("src/md/*.md")
        .pipe(markdown())
        .pipe(gulp.dest("src/partials"))
        .pipe(browserSync.reload({
            stream: true
        }))
});

gulp.task('mustache', ['markdown'], function() {
    return gulp.src("src/templates/*.html")
        .pipe(data(function() { return readYaml('./src/parameters.yml') }))
        .pipe(mustache())
//        .pipe(mustache('src/parameters.json'))
        .pipe(gulp.dest("dist/"))
        .pipe(browserSync.reload({
            stream: true
        }))
});

// Set the banner content
var banner = ['/*!\n',
    ' * <%= pkg.title %> v<%= pkg.version %> (<%= pkg.homepage %>)\n',
    ' * Copyright 2017 <%= pkg.author %>\n',
    ' * Licensed under <%= pkg.license.type %> (<%= pkg.license.url %>)\n',
    ' */\n',
    ''
].join('');

// Compile LESS files from /less into /css
gulp.task('less', function() {
    return gulp.src('src/less/modern-business.less')
        .pipe(less())
        .pipe(header(banner, { pkg: pkg }))
        .pipe(gulp.dest('dist/css'))
        .pipe(browserSync.reload({
            stream: true
        }))
});

// Minify compiled CSS
gulp.task('minify-css', ['less'], function() {
    return gulp.src('dist/css/modern-business.css')
        .pipe(cleanCSS({ compatibility: 'ie8' }))
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('dist/css'))
        .pipe(browserSync.reload({
            stream: true
        }))
});

// Minify JS
gulp.task('minify-js', function() {
    return gulp.src('src/js/modern-business.js')
        .pipe(uglify())
        .pipe(header(banner, { pkg: pkg }))
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('dist/js'))
        .pipe(browserSync.reload({
            stream: true
        }))
});

// Copy vendor libraries from /node_modules into /vendor
gulp.task('copy', function() {
    gulp.src('src/font-awesome/**').pipe(gulp.dest('dist/font-awesome'))
    gulp.src('src/fonts/**').pipe(gulp.dest('dist/fonts'))
    gulp.src('src/js/**').pipe(gulp.dest('dist/js'))
    gulp.src('src/css/**').pipe(gulp.dest('dist/css'))
    gulp.src('src/img/**').pipe(gulp.dest('dist/img'))
})

// Run everything
gulp.task('default', ['markdown', 'mustache', 'less', 'minify-css', 'minify-js', 'copy']);

// Configure the browserSync task
gulp.task('browserSync', function() {
    browserSync.init({
        server: {
            baseDir: 'dist/'
        },
    })
})

// Dev task with browserSync
gulp.task('watch', ['browserSync', 'markdown', 'mustache', 'less', 'minify-css', 'minify-js', 'copy'], function() {
    gulp.watch('less/*.less', ['less']);
    gulp.watch('dist/css/*.css', ['minify-css']);
    gulp.watch('dist/js/*.js', ['minify-js']);
    gulp.watch('src/md/**', ['markdown']);
    gulp.watch(['src/templates/**',
                'src/partials/**',
                'src/parameters.yml'], ['mustache']);
    // Reloads the browser whenever HTML or JS files change
    gulp.watch('dist/*.html', browserSync.reload);
    gulp.watch('dist/js/**/*.js', browserSync.reload);
});
