import 'core-js/stable';
import 'regenerator-runtime/runtime';
import gulp from 'gulp';
import gulpLoadPlugins from 'gulp-load-plugins';
import del from 'del';
import { stream as wiredep } from 'wiredep';

const $ = gulpLoadPlugins();

gulp.task(
  'extras',
  gulp.series(() =>
    gulp
      .src(
        [
          'app/*.*',
          'app/_locales/**',
          '!app/scripts.babel',
          '!app/*.json',
          '!app/*.html',
        ],
        {
          base: 'app',
          dot: true,
        }
      )
      .pipe(gulp.dest('dist'))
  )
);

function lint(files, options) {
  return gulp.src(files).pipe($.eslint(options)).pipe($.eslint.format());
}

gulp.task(
  'lint',
  gulp.series(() =>
    lint('app/scripts.babel/**/*.js', {
      env: {
        es6: true,
      },
    })
  )
);

gulp.task(
  'images',
  gulp.series(() =>
    gulp
      .src('app/images/**/*')
      .pipe(
        $.if(
          $.if.isFile,
          $.cache(
            $.imagemin({
              progressive: true,
              interlaced: true,
              // don't remove IDs from SVGs, they are often used
              // as hooks for embedding and styling
              svgoPlugins: [{ cleanupIDs: false }],
            })
          ).on('error', function (err) {
            console.log(err);
            this.end();
          })
        )
      )
      .pipe(gulp.dest('dist/images'))
  )
);

gulp.task(
  'html',
  gulp.series(() =>
    gulp
      .src('app/*.html')
      .pipe($.useref({ searchPath: ['.tmp', 'app', '.'] }))
      .pipe($.sourcemaps.init())
      .pipe($.if('*.js', $.uglify()))
      .pipe($.if('*.css', $.cleanCss({ compatibility: '*' })))
      .pipe($.sourcemaps.write())
      .pipe(
        $.if(
          '*.html',
          $.htmlmin({
            collapseWhitespace: true,
            minifyCSS: true,
            minifyJS: true,
            removeComments: true,
          })
        )
      )
      .pipe(gulp.dest('dist'))
  )
);

gulp.task(
  'chromeManifest',
  gulp.series(
    () =>
      gulp
        .src('app/manifest.json')
        .pipe(
          $.jsonEditor((j) => {
            j.background.scripts = j.background.scripts.filter(
              (e) => !['scripts/chromereload.js'].includes(e)
            );
            return j;
          })
        )
        .pipe(gulp.dest('dist')),
    () =>
      gulp
        .src([
          'app/**/*.js',
          'app/**/*.css',
          '!app/scripts/chromereload.js',
          '!app/scripts.babel/**/*',
          '!app/bower_components/**/*',
        ])
        .pipe($.if('*.css', $.cleanCss({ compatibility: '*' })))
        .pipe($.if('*.js', $.sourcemaps.init()))
        .pipe($.if('*.js', $.uglify()))
        .pipe($.if('*.js', $.sourcemaps.write('.')))
        .pipe(gulp.dest('dist'))
  )
);

gulp.task(
  'babel',
  gulp.series(() =>
    gulp
      .src('app/scripts.babel/**/*.js')
      .pipe($.plumber())
      .pipe(
        $.babel({
          presets: ['@babel/env'],
        })
      )
      .pipe(gulp.dest('app/scripts'))
  )
);

gulp.task(
  'clean',
  gulp.series(() => del.bind(null, ['.tmp', 'dist']))
);

gulp.task(
  'watch',
  gulp.series('lint', 'babel', () => {
    $.livereload.listen();

    gulp
      .watch([
        'app/*.html',
        'app/scripts/**/*.js',
        'app/images/**/*',
        'app/styles/**/*',
        'app/_locales/**/*.json',
      ])
      .on('change', $.livereload.reload);

    gulp.watch('app/scripts.babel/**/*.js', gulp.series('lint', 'babel'));
    gulp.watch('bower.json', gulp.series('wiredep'));
  })
);

gulp.task(
  'size',
  gulp.series(() =>
    gulp.src('dist/**/*').pipe($.size({ title: 'build', gzip: true }))
  )
);

gulp.task(
  'wiredep',
  gulp.series(() =>
    gulp
      .src('app/*.html')
      .pipe(
        wiredep({
          ignorePath: /^(\.\.\/)*\.\./,
        })
      )
      .pipe(gulp.dest('app'))
  )
);

gulp.task(
  'package',
  gulp.series(() => {
    let manifest = require('./dist/manifest.json');
    return gulp
      .src('dist/**')
      .pipe($.zip('Open App-' + manifest.version + '.zip'))
      .pipe(gulp.dest('package'));
  })
);

gulp.task(
  'build',
  gulp.series(
    'lint',
    'babel',
    'chromeManifest',
    gulp.parallel('html', 'images', 'extras'),
    'size'
  )
);

gulp.task('default', gulp.series('clean', 'build'));
