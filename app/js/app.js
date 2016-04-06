'use strict';

var app = angular.module('app', []);

app.config(['$compileProvider', function($compileProvider) {
    // needed for exporting our data
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|data):/);
}]);

function insertAtCursor(elt, myValue, withSpace) {
    if (!elt.selectionStart && elt.selectionStart != '0') return;

    var startPos = elt.selectionStart;
    var endPos = elt.selectionEnd;
    var before = elt.value.substring(0, startPos);
    var after = elt.value.substring(endPos, elt.value.length)
    if (withSpace) {
      if (before.match(/\S$/)) myValue = " " + myValue;
      if (after.match(/^\S/)) myValue = myValue + " ";
    }

    elt.value = before + myValue + after;
    elt.selectionStart = startPos + myValue.length;
    elt.selectionEnd = startPos + myValue.length;
    elt.focus();
}

app.directive('addtext', function factory() {
  return {
    restrict: 'A',
    scope: {
      addtext: '='
    },
    link: function (scope, element, attrs) {
      scope.addtext.withSpace = function(txt) {
          insertAtCursor(element[0], txt, true);
          element.triggerHandler('input');
      }
    }
  };
});

app.directive('textFileSelect', ['$window', function ($window) {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function (scope, el, attr, ctrl) {
            el.on('change', function (e) {
                var fileReader = new $window.FileReader();

                fileReader.onload = function () {
                    ctrl.$setViewValue(fileReader.result);
                };                
                fileReader.readAsText(e.target.files[0]);
            });
        }
    };
}]);
