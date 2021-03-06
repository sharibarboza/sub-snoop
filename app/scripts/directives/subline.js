'use strict';

/**
 * @ngdoc directive
 * @name SubSnoopApp.directive:subLine
 * @description
 * # subLine
 */
angular.module('SubSnoopApp')
  .directive('subLine', ['$compile', '$window', '$document', 'subFactory', 'months', 'moment', 'subChart', function ($compile, $window, $document, subFactory, months, moment, subChart) {
    var $win = angular.element($window);

    /*
     Stick the tab bar to the top after scrolling down
    */
    return {
      replace: true,
      scope: true,
      restrict: 'E',
      link: function(scope, element, attrs) {
        scope.labels = months.getLabels();
        scope.chartReady = false;
        var subname = scope.subreddit;
        var username = scope.username;
        var subs = subFactory.getEntries(subname, null);

        scope.getChart = function() {
          subChart.getSubChart(username, subname, subs);
          scope.series = ['Comment Points', 'Post Points'];
          scope.colors = ['#37AE9B', '#DCDCDC'];

          var data = subChart.getData(scope.subreddit);
          scope.totalUps = data.totalUps;
          scope.monthAverage = data.average;

          scope.data = [
            data.commentData,
            data.submissionData
          ];
          scope.datasetOverride = [{ yAxisID: 'y-axis-1' }, { yAxisID: 'y-axis-2' }];
          scope.options = {
            scales: {
              yAxes: [
                {
                  id: 'y-axis-1',
                  type: 'linear',
                  display: true,
                  position: 'left',
                  ticks: {
                    fontColor: "#FFFFFF"
                  }
                },
                {
                  id: 'y-axis-2',
                  type: 'linear',
                  display: true,
                  position: 'right',
                  ticks: {
                    fontColor: "#FFFFFF"
                  }
                },
              ],
              xAxes: [
                {
                  ticks: {
                    fontColor: "#FFFFFF"
                  }
                }
              ]
            },
            legend: {
                display: true,
                labels:{
                    fontSize: 14,
                    fontColor: 'white',
                }
            },
          };

          scope.chartReady = true;
        };

        $document.ready(function() {
          var chart = angular.element('#linechart-' + subname);
          var prevElem = element.parent()[0].previousElementSibling;
          var idName = '#' + prevElem.id + ' .graph';
          var winHeight = $win.innerHeight();

          var listener = scope.$watch(function() { return angular.element(idName).height() > 0 }, function() {
            var e = angular.element(idName);
            if (!scope.chartReady && e.length > 0 && e[0].clientHeight > 0) {
              var boxTop = chart[0].offsetTop - winHeight + 100;

              $win.on('scroll', function (e) {
                var scrollY = $win.scrollTop();

                if (!scope.chartReady && (scrollY >= boxTop)) {
                  scope.getChart();
                  scope.$apply();
                  return;
                }
              });
            }
          });

        });

      }
    };
  }]);
