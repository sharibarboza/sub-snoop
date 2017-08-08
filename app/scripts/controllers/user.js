'use strict';

/**
 * @ngdoc function
 * @name tractApp.controller:UserCtrl
 * @description
 * # UserCtrl
 * Controller of the tractApp
 */
 angular.module('tractApp')
 .controller('UserCtrl', ['$scope', '$routeParams', 'userFactory', function ($scope, $routeParams, userFactory) {
  $scope.main = false;

  // Get the user's username and account creation date
  userFactory.setUser($routeParams.username);
  var userPromise = userFactory.getUser();
  userPromise
  .then(function(response) {
    $scope.user = response.data.data;
    $scope.username = $scope.user.name;
    $scope.created = moment($scope.user.created_utc*1000).local().format('MMMM Do YYYY, h:mm a');
    $scope.notfound = false;
  }, function() {
    $scope.user = false;
    $scope.notfound = true;
  });

}]);