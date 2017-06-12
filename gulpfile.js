var gulp = require('gulp');

var concat = require('gulp-concat');
var stripDebug = require('gulp-strip-debug');
var uglify = require('gulp-uglify');
var changed = require('gulp-changed');
var imagemin = require('gulp-imagemin');
var autoprefix = require('gulp-autoprefixer');
var minifyCSS = require('gulp-minify-css');
var merge = require('gulp-merge');
var pump = require('pump');
  // var gzip = require('gulp-gzip');


// image
gulp.task('imagemin', function() {
  var imgSrc = './src/img/**/*',
      imgDst = './assets/img';

  gulp.src(imgSrc)
    .pipe(changed(imgDst))
    .pipe(imagemin())
    .pipe(gulp.dest(imgDst));
});

gulp.task('imagedocsmin', function() {
  var imgSrc = './src/img/docs/**/*',
      imgDst = './assets/img/docs';

  gulp.src(imgSrc)
    .pipe(changed(imgDst))
    .pipe(imagemin())
    .pipe(gulp.dest(imgDst));
});


// js
gulp.task('scripts', function(cb){
  pump([
      gulp.src([
         './src/libs/jsurl/jsurl.js',
         './src/libs/numerico/numerico.js',
          './src/libs/flot/jquery.flot.js',
          './src/libs/nouislider/jquery.nouislider.all.js',
          // './src/libs/noUiSlider.9.2.0/nouislider.js',
          './src/libs/angleslider/angleslider.js',
          './src/libs/cookieconsent/cookieconsent.js',
          './src/libs/molreader/molreader.js',
          './src/js/qg.js', // qg
          './src/js/versions.js', // qg
          './src/js/helpers.js',
          './src/js/color.js',
          './src/js/generators.js',
          './src/js/collection.js',
          './src/js/setup.js',
          './src/js/dialog.js',
          './src/js/graph.js',
          './src/js/code.js',
          './src/js/docs.js',
          './src/widgets/widget.js', // widgets
          './src/widgets/model/model.js',
          './src/widgets/addwidgets/addwidgets.js',
          './src/widgets/spectrum/spectrum.js',
          './src/widgets/orbitals/orbitals.js',
          './src/widgets/transmission/transmission.js',
          './src/widgets/notes/notes.js',
          './src/widgets/density/density.js',
          './src/widgets/bondorder/bondorder.js',
          './src/widgets/polarizability/polarizability.js',
          './src/widgets/scatteringstate/scatteringstate.js',
          './src/widgets/localcurrents/localcurrents.js',
      ]),
      concat('script.min.js'),
      stripDebug(),
      uglify(),
      gulp.dest('./assets/js/')
    ],
    cb
  );
});


gulp.task('libsjs', function(cb){
  pump([
      gulp.src([
          './src/libs/konva/konva.min.js'
      ]),
      // concat('scripts.min.js'),
      stripDebug(),
      // uglify(),
      gulp.dest('./assets/static/')
    ],
    cb
  );
});


gulp.task('libscss', function(){
    gulp.src([
          './src/libs/katex/katex.min.css'
      ])
     .pipe(autoprefix('last 2 versions'))
     .pipe(gulp.dest('./assets/static/'));
});


// css
gulp.task('styles', function(){
  gulp.src([
           './src/libs/angleslider/angleslider.css', 
           './src/libs/cookieconsent/cookieconsent-dark.css', 
           './src/libs/nouislider/jquery.nouislider.min.css',
           './src/libs/nouislider/jquery.nouislider.pips.min.css',
           './src/css/*.css',
           './src/widgets/model/model.css',
           './src/widgets/addwidgets/addwidgets.css',
           './src/widgets/spectrum/spectrum.css',
           './src/widgets/notes/notes.css',
           './src/widgets/density/density.css',
           './src/widgets/bondorder/bondorder.css',
           './src/widgets/orbitals/orbitals.css',
           './src/widgets/polarizability/polarizability.css',
           './src/widgets/scatteringstate/scatteringstate.css',
           './src/widgets/transmission/transmission.css'
           ])
    .pipe(concat('styles.min.css'))
    .pipe(autoprefix('last 2 versions'))
    .pipe(minifyCSS())
    .pipe(gulp.dest('./assets/css/'));
});


// watch
gulp.task('watch', function(){
   gulp.watch(['./src/js/**/*.js','./src/libs/**/*.js', './src/widgets/*.js', './src/widgets/**/*.js'], ['scripts']);
   gulp.watch(['./src/css/**/*.css','./src/libs/**/*.css', './src/widgets/*.css', './src/widgets/**/*.css'], ['styles']);
});


// default gulp task
gulp.task('default', ['imagemin', 'imagedocsmin', 'scripts', 'styles', 'libsjs', 'libscss', 'watch']);

