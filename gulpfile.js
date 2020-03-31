/// <binding />
"use strict";

// Uglify still fails to process the variables in the top-level self invoked function
// Currently using the 'Bundler & Minifier' VS Extension by Mads Kristensen which gives a better result

var gulp = require("gulp"),
    concat = require("gulp-concat"),
    uglify = require("gulp-uglify");

var sources = [
    "./core/resonate.initialize.js",
    "./core/resonate.extensions.js",
    "./core/resonate.expressions.js",
    "./core/resonate.modules.js",
    "./core/resonate.rendering.js",
    "./core/resonate.js",
    "./core/components/*.js",
    "./core/attributes/*.js",
    "./core/services/*.js",
    "./core/expressions/*.js",
    "./core/resonate.finalize.js"
];

gulp.task('minify-js', function (resolve) {
    gulp.src(sources)
        .pipe(concat('resonate.min.js'))
        .pipe(uglify({ mangle: true, toplevel: true })) 
        .pipe(gulp.dest('./wwwroot'));
    resolve();
});

gulp.task('watch', function (resolve) {
    gulp.watch('./core/**/*.js', gulp.series(['minify-js']));
    resolve();
});

gulp.task('default', gulp.series([
    'minify-js',
    'watch']
));