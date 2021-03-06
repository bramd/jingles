'use strict';

angular.module('fifoApp')
  .controller('TopologyCtrl', function ($scope, wiggle, status) {
    
    	$scope.servers = wiggle.hypervisors.queryFull()

    	$scope.save = function(paths) {
            var data = paths.map(function(path) {
                return {
                    name: path.name,
                    cost: path.cost
                }
            })

			wiggle.hypervisors.put({id: $scope.selected.uuid, controller: 'config'}, {path: data}, 
    			function success(res) {
		    		status.success('Paths saved')
    			},
    			function error(err) {
    				status.error('Could not save path. ' + err.statusText)
    				console.error(err)
    			})
    	}

    	$scope.$watch('selected', function(val) {
    		if (!val) return;
       		$scope.selected = val
    		$scope.paths = val.path
    	})

  });