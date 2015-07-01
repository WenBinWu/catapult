// Copyright 2015 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @fileoverview Boostrap for loading javascript/html files using d8_runner.
 */
(function(global) {

  /**
   * Polyfills console's methods.
   */
  global.console = {
    log: function() {
      var args = Array.prototype.slice.call(arguments);
      print(args.join(' '));
    },

    info: function() {
      var args = Array.prototype.slice.call(arguments);
      print('Info:', args.join(' '));
    },

    error: function() {
      var args = Array.prototype.slice.call(arguments);
      print('Error:', args.join(' '));
    },

    warn: function() {
      var args = Array.prototype.slice.call(arguments);
      print('Warning:', args.join(' '));
    }
  };


  /**
   * Defines the <%search-path%> for looking up relative path loading.
   * d8_runner.py will replace this with the actual search path.
   */
  os.chdir('<%search-path%>');


  /**
   * Strips the starting '/' in file_path if |file_path| is meant to be a
   * relative path.
   *
   * @param {string} file_path path to some file, can be relative or absolute
   * path.
   * @return {string} the file_path with starting '/' removed if |file_path|
   * does not exist or the original |file_path| otherwise.
   */
  function _stripStartingSlashIfNeeded(file_path) {
    if (file_path.substring(0, 1) !== '/') {
      return file_path;
    }
    try {
      // Try a dummy read to check whether file_path exists.
      // TODO(nednguyen): find a more efficient way to check whether some file
      // path exists in d8.
      read(file_path);
      return file_path;
    } catch (err) {
      return file_path.substring(1);
    }
  }

  function _hrefToAbsolutePath(href) {
    return _stripStartingSlashIfNeeded(href);
  }

  var loadedModulesByFilePath = {};

  /**
   * Load a HTML file, which absolute path or path relative to <%search-path%>.
   * Unlike the native load() method of d8, variables declared in |file_path|
   * will not be hoisted to the caller environment. For example:
   *
   * a.html:
   * <script>
   *   var x = 1;
   * </script>
   *
   * test.js:
   * loadHTML("a.html");
   * print(x);  // <- ReferenceError is thrown because x is not defined.
   *
   * @param {string} file_path path to the HTML file to be loaded.
   */
  global.loadHTML = function(href) {
    // TODO(nednguyen): Use a javascript html parser instead of relying on
    // python file for parsing HTML.
    // (https://github.com/google/trace-viewer/issues/1030)
    var absPath = _hrefToAbsolutePath(href);

    if (loadedModulesByFilePath[absPath])
      return;
    loadedModulesByFilePath[absPath] = true;


    try {
      var stripped_js = os.system('python', ['<%html2jseval-path%>', absPath]);
    } catch (err) {
      throw new Error('Error in loading ' + href + ': ' + err);
    }

    // Add "//@ sourceURL=|file_path|" to the end of generated js to preserve
    // the line numbers
    stripped_js = stripped_js + '\n//@ sourceURL=' + href;
    eval(stripped_js);
  }

  // Override d8's load() so that it strips out the starting '/' if needed.
  var actual_load = global.load;
  global.load = function(file_path) {
    try {
      actual_load(_stripStartingSlashIfNeeded(file_path));
    } catch (err) {
      throw new Error('Error in loading ' + file_path + ': ' + err);
    }
  };

})(this);