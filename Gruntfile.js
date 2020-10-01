module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        // uglify: {
        //     options: {
        //         banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
        //     },
        //     build: {
        //         src: 'src/<%= pkg.name %>.js',
        //         dest: 'build/<%= pkg.name %>.min.js'
        //     }
        // },
        requirejs: {
            compile: {
                options: {
                    baseUrl: 'src',
                    // mainConfigFile: 'tools/build.js',
                    name: '../node_modules/almond/almond',
                    include: ['OpusWorldWind', 'WorldWind/WorldWind'],
                    // include: ['oww_and_www_bundle'],
                    paths: {
                        'WorldWind': '../WebWorldWind-submodule/src'
                    },
                    optimize: 'none', // uglifyjs only understands <=es5; TODO: uglify
                    out: 'build/dist/opusworldwind.min.js',
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-requirejs')
    grunt.registerTask('default', ['requirejs']);
};
