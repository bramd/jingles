'use strict';

angular.module('fifoApp')
  .controller('RoleCtrl', function ($scope, $routeParams, $location, wiggle, vmService, status, breadcrumbs) {

    var uuid = $routeParams.uuid;
    $scope.p2 = false;
    $scope.p3 = false;

    var cache=(function(){
        var c = {};
        return function(entity, e, callback) {
            if (!c[entity])
                c[entity] = {};
            if (c[entity][e]) {
                callback(c[entity][e]);
            } else if(wiggle[entity]) {
                wiggle[entity].get({id: e}, function(elem) {
                    c[entity][e] = elem;
                    callback(elem);
                })
            } else {
                callback({uuid: e, name: e})
            }
        }
    })();

    var update_permission = function(p) {
        var res = {
            text: p.join("->"),
            obj: p
        };
        var we_need_a_stupid_copy_thank_you_js = p.slice()
        if (p[1] && p[1] != "..." && p[1] != "_") {
            switch (p[0]) {
            case "users":
            case "roles":
            case "packages":
            case "dtraces":
            case "ipranges":
                cache(p[0], p[1], function (e) {
                    we_need_a_stupid_copy_thank_you_js[1] = e.name;
                    res.text = we_need_a_stupid_copy_thank_you_js.join("->");
                })
                break;
            case "datasets":
                cache(p[0], p[1], function (e) {
                    if (e.name && e.version) {
                        we_need_a_stupid_copy_thank_you_js[1] = e.name + " (" + e.version + ")";
                        res.text = we_need_a_stupid_copy_thank_you_js.join("->");
                    }
                });
                break;
            case "vms":
                cache(p[0], p[1], function (e) {
                    if (e.config && e.config.alias) {
                        we_need_a_stupid_copy_thank_you_js[1] = e.config.alias + "(" + p[1] + ")";
                        res.text = we_need_a_stupid_copy_thank_you_js.join("->");
                    }
                })
                break;
            }
        }
        return res;
    };

    wiggle.roles.get({id: uuid}, function(res) {
        $scope.role = res;
        $scope.permissions = res.permissions.map(update_permission);
        breadcrumbs.setLast(res.name)
    }, function nk(data) {
        status.error('Could not load Role: ' + data.statusText)
        console.error(data)
    });

    $scope.delete_permission = function(permission) {
        var p = {controller: "permissions",
                 id: $scope.role.uuid};
        p.controller_id = permission[0];
        if (permission[1])
            p.controller_id1 = permission[1];
        if (permission[2])
            p.controller_id2 = permission[2];
        if (permission[3])
            p.controller_id3 = permission[3];
        wiggle.roles.revoke(p, function success(){
            $scope.permissions = $scope.permissions.filter(function (pobj) {
                return pobj.obj != permission;
            })
        });
    };

    $scope.grant = function() {
        $scope.permission.id = $scope.role.uuid;
        $scope.permission.controller = "permissions";
        if ($scope.show_text) {
            $scope.permission["controller_id3"] = $scope.perm_text
        }

        wiggle.roles.grant($scope.permission, function () {
            var p = [$scope.permission.controller_id];
            if ($scope.permission.controller_id1)
                p.push($scope.permission.controller_id1);
            if ($scope.permission.controller_id2)
                p.push($scope.permission.controller_id2);
            if ($scope.permission.controller_id3)
                p.push($scope.permission.controller_id3);
            $scope.permissions.push(update_permission(p));
        }, function(d) {
            console.log("Grant failed:", d);
        });
    };

    $scope.perm_change = $scope.perm_change = mk_permission_fn(wiggle, $scope);


    $scope.delete = function() {
        var name = $scope.role.name;
        var uuid = $scope.role.uuid;
        $scope.modal = {
            btnClass: 'btn-danger',
            confirm: 'Delete',
            title: 'Confirm VM Deletion',
            body: '<p><font color="red">Warning!</font> you are about to delete the Role <b id="delete-uuid">' + name + " (" + uuid + ") </b> Are you 100% sure you really want to do this?</p><p>Clicking on Delete here will mean this Role is gone forever!</p>", 
            ok: function() {
            	wiggle.roles.delete({id: uuid},
                                 function success(data, h) {
                                     status.success(name + ' deleted');
                                     $location.path('/configuration/users_roles')
                                 },
                                 function error(data) {
                                     console.error('Delete Role error:', data);
                                     status.error('There was an error deleting your role. See the javascript console.');
                                 });
            }
        }
    };

  });
