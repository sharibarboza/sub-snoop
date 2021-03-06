'use strict';

/**
 * @ngdoc filter
 * @name SubSnoopApp.filter:truncate
 * @function
 * @description
 * # truncate
 * Filter in the SubSnoopApp.
 */
angular.module('SubSnoopApp')
  .filter('truncate', function () {

    /*
     Truncate text posts to a certain number of words
    */
    return function (input, num, letters) {
      if (!letters) {
        var split = input.split(' ');
        var truncated_input = split.slice(0, num);

        if (split.length > num) {
          truncated_input.push('...');
        }

        return truncated_input.join(' ').toString();
      } else {
        truncated_input = input.slice(0, num);

        if (input.length > num) {
          truncated_input += '...';
        }

        return truncated_input;
      }
    };
  });
