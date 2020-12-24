import fs               from 'fs';
import path             from 'path';

// Environment file handling
import dotenv           from 'dotenv-safe';

// Rollup plugins
import compiler         from '@ampproject/rollup-plugin-closure-compiler';
import copy             from 'rollup-plugin-copy';
import json             from '@rollup/plugin-json';
import postcss          from 'rollup-plugin-postcss';
import { string }       from 'rollup-plugin-string';
import { terser }       from 'rollup-plugin-terser';

// PostCSS imports
import autoprefixer     from 'autoprefixer';
import postcssPresetEnv from 'postcss-preset-env';


// Utility functions
function assert(value, message){
   if (value){
      throw Error(`DEPLOY_PATH does not exist: ${DEPLOY_PATH}`);
   }
}

function is_enabled(key){
   let enabled = (
      process.env[key] != null &&
      process.env[key].toLowerCase() === 'true'
   );
   console.log(`Is ${key} enabled... ${enabled ? 'yes' : 'no'}`)
   return enabled;
}


export default () =>
{
   // Load the .env file specified in the command line target into process.env
   // using `dotenv-safe`
   dotenv.config({
      example: `${__dirname}/env/env.example`,
      path   : `${__dirname}/env/${process.env.TARGET}.env`
   });

   // Settings
   const PROJECT_PATH = __dirname;
   const DEPLOY_PATH  = process.env.DEPLOY_PATH;
   const TARGET       = process.env.TARGET;

   const SHOULD_DEPLOY_SOURCEMAPS = is_enabled('SHOULD_DEPLOY_SOURCEMAPS');
   const SHOULD_MINIFY            = is_enabled('SHOULD_MINIFY')
   const SHOULD_OPTIMIZE          = is_enabled('SHOULD_OPTIMIZE')

   // State
   let inputPlugins = [
      postcss({
         inject    : false,
         extract   : `styles.css`,
         extensions: ['.scss', '.sass', '.css'],
         use       : ['sass'],
         plugins   : [autoprefixer, postcssPresetEnv],
         sourceMap : SHOULD_DEPLOY_SOURCEMAPS,
      }),
      string({
         include: ["**/*.css", "**/*.html"]
      }),
      json(),
      copy({
         targets: [
            { src: `module/module.json`, dest: DEPLOY_PATH },
            { src: `module/lang`, dest: DEPLOY_PATH },
            { src: `module/templates`, dest: DEPLOY_PATH },
         ]
      }), 

      // SHOULD_OPTIMIZE && compiler({
      //    language_in: 'ECMASCRIPT_2020'
      // })
   ].filter((v) => v);

   let outputPlugins = [
      SHOULD_MINIFY && terser({
         ecma  : 2020,
         module: true,
         compress: {
            booleans_as_integers: true,
            passes: 3
         },
         mangle: {
            toplevel: true
         },
      }),
   ].filter((v) => v);

   // Sanity check to make sure parent directory of DEPLOY_PATH exists.
   if (!fs.existsSync(path.dirname(DEPLOY_PATH)))
   {
      throw Error(`DEPLOY_PATH does not exist: ${DEPLOY_PATH}`);
   }

   // Shortcuts
   console.log(`Bundling target: ${TARGET}`);

   return [{
      input: `${PROJECT_PATH}/module/autorotate.js`,
      output: {
         file                  : `${DEPLOY_PATH}/autorotate.js`,
         format                : 'es',
         plugins               : outputPlugins,
         sourcemap             : SHOULD_DEPLOY_SOURCEMAPS,
         sourcemapPathTransform: (sourcePath) => {
            return path.relative(DEPLOY_PATH, sourcePath)
         }
      },
      plugins: inputPlugins
   }];
};
