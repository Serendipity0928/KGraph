let gulp = require('gulp'),
  bs = require('browser-sync'),
  sass = require('gulp-sass'),
  cssnano = require('gulp-cssnano'),
  rename = require('gulp-rename'),
  babel = require('gulp-babel'),
  uglify = require('gulp-uglify'),
  cache = require('gulp-cache'),
  imagemin = require('gulp-imagemin'),
  watch = require('gulp-watch');


let path = {
  'html': './templates/',
  'css': './src/css/',
  'scss': './src/scss/',
  'js': './src/js/',
  'images': './src/images/',
  'utils': './src/utils/',
  'css_dist': './dist/css/',
  'scss_dist': './dist/scss/',
  'js_dist': './dist/js/',
  'images_dist': './dist/images/',
  'utils_dist': './dist/utils/'

};

//定义HTML任务
gulp.task('html', function () {
  gulp.src(path.html + '*.html')
      .pipe(bs.stream());              //重新加载浏览器
});

//定义CSS任务
gulp.task('css', function () {
  gulp.src(path.css + '*.css')
      .pipe(cssnano())
      .pipe(rename({'suffix': '.min'}))
      .pipe(gulp.dest(path.css_dist))
      .pipe(bs.stream());
});

//定义SCSS任务
gulp.task('scss', function () {
  gulp.src(path.scss + '*.scss')
      .pipe(sass().on('error', sass.logError))
      .pipe(cssnano())
      .pipe(rename({'suffix': '.min'}))
      .pipe(gulp.dest(path.scss_dist))
      .pipe(bs.stream());
});

//定义JS任务
gulp.task("js", function () {
  gulp.src(path.js + '*.js')          // ES6 源码存放的路径
      .pipe(babel())
      .pipe(uglify())
      .pipe(rename({'suffix': '.min'}))
      .pipe(gulp.dest(path.js_dist))  //转换成 ES5 存放的路径
      .pipe(bs.stream());
});

//定义处理图片任务
gulp.task('images', function () {
  gulp.src(path.images + '*.*')
    .pipe(cache(imagemin()))
    .pipe(gulp.dest(path.images_dist))
    .pipe(bs.stream())
});

//定义处理工具包文件的任务
gulp.task("utils_css", function () {
  gulp.src(path.utils + 'css/' + '*.*')
      .pipe(gulp.dest(path.utils_dist + 'css/'))
      .pipe(bs.stream());
});
gulp.task("utils_js", function () {
  gulp.src(path.utils + 'js/' + '*.*')
      .pipe(gulp.dest(path.utils_dist + 'js/'))
      .pipe(bs.stream());
});

//定义监听文件修改的任务
gulp.task('watch', function () {
  watch(path.html + '*.html', gulp.series('html'));
  watch(path.css + '*.css', gulp.series('css'));
  watch(path.scss + '*.scss', gulp.series('scss'));
  watch(path.js + '*.js', gulp.series('js'));
  watch(path.images + '*.*', gulp.series('images'));
  watch(path.utils + 'css/' + '*.*', gulp.series('utils_css'));
  watch(path.utils + 'js/' + '*.*', gulp.series('utils_js'));
});

//创建服务器，浏览器立马可以看到browser-sync
gulp.task('bs', function () {
  bs.init({
    'server': {
      'baseDir': ['templates' ,'./']
    }
  })
});

//创建一个默认服务
gulp.task('default', gulp.parallel('bs', 'watch', 'html', 'css', 'scss', 'js', 'images', 'utils_css', 'utils_js'));