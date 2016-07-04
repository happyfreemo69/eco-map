function getRandomIntInclusive(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function revertRelouLink(){
    window.location.href="http://eco-map.org";
}

var app = angular.module('BlankApp', ['ngMaterial', 'ngMessages', 'ngMap', 'ngCookies', 'angularConsent']);
app.config(function($locationProvider) {
    $locationProvider.html5Mode({
        enabled: true,
        requireBase: false
    });
})

var ecocitoyenCtrl = app.controller('ecocitoyenCtrl', function($mdMedia, $scope, $http, NgMap, $q, $timeout, $mdSidenav, $log, $window, $mdDialog, $filter, $location, $rootScope) {
    this.openMenu = function($mdOpenMenu, ev) {
        originatorEv = ev;
        $mdOpenMenu(ev);
    };

    this.redial = function() {
        $mdDialog.show(
            $mdDialog.alert()
            .targetEvent(originatorEv)
            .clickOutsideToClose(true)
            .parent('body')
            .title('Suddenly, a redial')
            .textContent('You just called a friend; who told you the most amazing story. Have a cookie!')
            .ok('That was easy')
        );
        originatorEv = null;
    };
    var heatmapDensite, vm = this;
    $scope.swap = [];
    $scope.showDebug = false;
    $scope.checkboxCate = true;
    $scope.disabledCheckbox = [];
    $scope.filtreArray = [];
    $scope.densite = [];
    $scope.dates = [];
    $scope.activeButton = [];
    $scope.timeoutLoad = false;
    $scope.heatmap = false;
    $scope.marqueurs = true;
    $scope.heatmapMarqueurs = [];
    $scope.toggleLeft = buildDelayedToggler('left');
    $scope.toggleRight = buildToggler('right');
    $scope.cateStyle = [];
    $scope.urlFb = window.location.href;
    $scope.loading = [];
    $scope.loading[0] = false, $scope.loading[1] = false;
    $scope.loading[3] = false;
    $scope.heatmapDensiteVisible = false;
    $scope.heatmapPoiVisible = false;
    $scope.poiVisible = true;
   
    $scope.og = {
        url: $window.location,
        author: 'CityLity',
        title: 'Carte interactive ecocitoyen',
        description: 'Utile et intéressant, je recommande ce projet en faveur de l’écologie !',
        image: ''
    };
    $scope.twitter = {
        site: $window.location,
        title: 'Carte interactive ecocitoyen',
        description: "Intéressant : une %23carte en faveur de l’%23ecologie et de l’%23environnement ! Trouvez tous les points %23écocitoyens sur www.eco-map.org",
        creator: '',
        image: ''
    };
    $scope.cateH3 = ['trouver une poubelle de verre proche de chez soi', 'trouver une voiture électrique dans son quartier', 'trouver une borne de vélo à proximité', 'toutes les déchèteries de France', 'où déposer son compost en France', 'trouver un relais vêtements proche de chez moi', 'toutes les aires de co-voiturage de France', 'Trouver un tri-sélectif à proximité', 'Trouver l’ensemble des poubelles pour recycler les cartons', 'Trouver l’ensemble des Pedibus des France pour le ramassage scolaire', 'Toutes les bornes de recharges pour votre voiture électrique'];
    $scope.mapSelector = "poi";
    $scope.dateSlider = undefined;
    $scope.resized = false;
    $scope.showPoiSmall = true;
    $scope.showPoiClassic = false;
    $scope.filterType = "small";
    $scope.currentSize = "small";
     $scope.textTweet = $scope.twitter.description;
    $scope.force = false;
    $scope.resizedSmall = false;
    $scope.resizedClassic = false;
    var xVal = null;
    var hasRegistered = false;
    if (window.location.hash == "#debug") {
        $scope.showDebug = true;
    }

    $scope.isOpenRight = function() {
        return $mdSidenav('right').isOpen();
    };
    /**
     * Supplies a function that will continue to operate until the
     * time is up.
     */
    function debounce(func, wait, context) {
        var timer;
        return function debounced() {
            var context = $scope,
                args = Array.prototype.slice.call(arguments);
            $timeout.cancel(timer);
            timer = $timeout(function() {
                timer = undefined;
                func.apply(context, args);
            }, wait || 10);
        };
    }
    /**
     * Build handler to open/close a SideNav; when animation finishes
     * report completion in console
     */
    function buildDelayedToggler(navID) {
        return debounce(function() {
            $mdSidenav(navID)
                .toggle()
                .then(function() {
                    $log.debug("toggle " + navID + " is done");
                });
        }, 200);
    }

    function buildToggler(navID) {
        return function() {
            $mdSidenav(navID)
                .toggle()
                .then(function() {
                    $log.debug("toggle " + navID + " is done");
                });
        }
    }

    $scope.openRightMenu = function() {
        buildDelayedToggler('right');
        buildToggler('right');
        $mdSidenav('right').toggle();
    }
    var loadMarkers = function($http, $scope, $rootScope) {

        $scope.loading[0] = true;
        var deferred = $q.defer();
        var timerMarqueurs = $timeout(function() {
            $scope.timeoutLoad = true;
            deferred.reject('Erreur lors du chargement du JSON');
        }, 30000);
        $http.get('data.json').then(function(res) {
            $scope.cates = [];

            res.data.cateOrdre.map(function(x, y) {
                $scope.cates[x.ordre] = x.cate;
            });
            $scope.iconCate = [];
            $scope.cates.map(function(x, y) {
                $scope.activeButton[y] = "md-activated";
                $scope.filtreArray.push(x);
                $scope.disabledCheckbox[y] = false;
                $scope.cateStyle[y] = "";
                $scope.iconCate[x] = x.trim().toLowerCase().replace(" ", "").replace("é", "e").replace("è", "e").replace('-', '').replace('\.', '');
            });

            $scope.points = [];
            $scope.pointsSmall = [];
            $scope.pointsClassic = [];
            $scope.markers = [];
            $scope.heatmapMarqueurs = [];
            angular.forEach(res.data.points, function(item, id) {
                var point = {
                    title: item.cate,
                    id: id,
                    type: "small",
                    visible: true,
                    cate: item.cate,
                    date: item.date,
                    geoloc: item.geoloc,
                    icon: 'wp-content/themes/ecocitoyen/images/marqueurs/' + $scope.iconCate[item.cate] + '.png'
                };
                //$scope.points.push(point);
                $scope.markers[id] = new google.maps.Marker(point);
                var marker = $scope.markers[id];//$scope == vm(this)
                var latlng = new google.maps.LatLng(item.geoloc.lat, item.geoloc.lng);
                marker.setPosition(latlng);
            });


            $scope.markers.forEach(function(x, y) {
                if (x.type == "small"){
                    $scope.heatmapMarqueurs.push({
                        cate: x.cate,
                        date: x.date,
                        location: new google.maps.LatLng(parseFloat(x.geoloc.lat), parseFloat(x.geoloc.lng)),
						bis:  new google.maps.LatLng(parseFloat(x.geoloc.lat), parseFloat(x.geoloc.lng)),
						weight: 1
                    });
                }
            });

            $scope.dates = res.data.date;


            $scope.startDate = $scope.dates[0];
            $scope.endDate = $scope.dates[$scope.dates.length - 1];
            deferred.resolve($scope.dates.length - 1);
            $scope.loading[0] = false;


            xVal = $scope.dates.length - 1;


            $timeout.cancel(timerMarqueurs);
        });


        return deferred.promise;
    };

    $scope.change = function() {
        if ($scope.mapSelector == "poiHeatmap") {
            // On affiche la heatmap POI
            vm.hideMarkers();
            $scope.enableHeatmapPoi();

        } else if ($scope.mapSelector == "poi") {
            // On affiche la  carte POi de base
            $scope.disabledHeatmapPoi();
            vm.showMarkers();
        }

    }

    var x;



    $q.all([x = loadMarkers($http, $scope, $rootScope)]).then(function() {

        var heatmapDensite;
        var saveMap = null;
        var heatmapPoi, heatmapSuperf;

        $scope.center = "45.757455, 4.841985";
        $scope.radius = 16;

        NgMap.initMap();
        NgMap.getMap().then(function(map) {

            vm.map = map;
            vm.map.markers = $scope.markers;


            /* Set heatmap densite avec map */
            //heatmapDensite = vm.map.heatmapLayers.foo;

            /* Set heatmap Poi avec map */
            heatmapPoi = vm.map.heatmapLayers.poi;

            //heatmapSuperf = vm.map.heatmapLayers.superf;


            $scope.changeRadius = function(x) {
                heatmapDensite.set('radius', x);
            }
            $scope.infoRadiusZoom = function() {
                console.log("zoom " + map.getZoom(10) + " / radius " + heatmapDensite.get('radius'));
            }

            $scope.optimizeRadius = function() {
                var r = null;
                switch (map.getZoom()) {
                    case 5:
                        r = 2;
                    case 7:
                        r = 5;
                        break;
                    case 9:
                        r = 9;
                        break;
                    case 10:
                        r = 15;
                        break;
                    case 11:
                        r = 25;
                        break;
                    case 12:
                        r = 54;
                        break;
                    case 13:
                        r = 70;
                        break;

                    default:
                        r = 4;

                }
                $scope.changeRadius(r);
                $scope.infoRadiusZoom();
            }

            vm.placeChanged = function() {
                vm.place = this.getPlace();

                m = NgMap.getMap();

                var bounds = new google.maps.LatLngBounds();
                bounds.extend(vm.place.geometry.location);
                $scope.map.fitBounds(bounds);
                $scope.map.setZoom(14);
            }
            vm.showMarkers = function() {
              $scope.points.map(function(item){
                item.visible = true
              });


                $scope.poiVisible = true;

            };
            vm.hideMarkers = function() {
                $scope.points.map(function(item){
                  item.visible = false;
                });
                $scope.poiVisible = false;

            };
            $scope.info = function() {
				console.log(vm.map);
            }
            /**
             * This function is called to refresh the markers.
             * It assumes $scope.map.markers contain the marker to show
             * 
             * @return {[type]} [description]
             */
            $scope.loopResize = function() {
                console.log('lloop resize');
                var limit = 14;
                var currentZoom = vm.map.getZoom();

                if (currentZoom > limit && Object.keys(vm.map.markers).length > 0 && (!$scope.resizedClassic || $scope.force)) {
                    // On affiche sans underscore, [gros format et avec icone]
                    $scope.filterType = 'classic';
					vm.map.markers.forEach(function(item){
					    if (item.icon.indexOf("_") >= 0) {
							item.setIcon($scope.underscore(item.icon, "without"));
						}
					});
                    $scope.resizedClassic = true;
					if ($scope.force ){
						$scope.force = false;
					}
                    $scope.resizedSmall = false;
                    $scope.currentSize = "classic";
					if(!$scope.$$phase) {
                		$scope.$apply();
                    }
                } else if (currentZoom <= limit && Object.keys(vm.map.markers).length > 0 && (!$scope.resizedSmall || $scope.force)) {
                    // On affiche le petit format
					vm.map.markers.forEach(function(item,i){
						if (item.icon.indexOf("_") < 0) {
                            item.setIcon($scope.underscore(item.icon, "with"));
						}
			         });
					// Afin de ne pas répeter cette opération à chaque zoom/dézoom on indique qu'on est réduit (small) et on teste ça
					// On passe resizedClassic à false
					// On passe le force à false s'il etait true
                    $scope.resizedSmall = true;
                    $scope.resizedClassic = false;
					if ($scope.force ){
						$scope.force = false;
					}
                    $scope.currentSize = "small";
                    $scope.filterType = 'small';
					if(!$scope.$$phase) {
                        $scope.$apply();
                    }
                }
                vm.map.markers.forEach(function(x){
                    //disabling shit
                    if(!x.visible){
                        x.setMap(null);
                    }else{
                        x.setMap(vm.map);
                    }
                })
            }
            google.maps.event.addListenerOnce(vm.map, 'idle', function() {
                //$scope.reduceIconSize();

                $scope.force = false;
                $scope.sauvMarqueur = null;
                $scope.sauvMarqueur = vm.map.markers;


            });
            /* Listener sur le changement de zoom et optimisation du radius pour la heatmap de densite de population */
            google.maps.event.addListener(vm.map, 'zoom_changed', function() {

                $scope.loopResize();

            });
            $scope.underscore = function(path, without) {

                if (without == "without") {
                    return path.replace('_', '');
                } else {
                    return path.replace('.png', '_.png');
                }

            }
            var lastUpdate = Date.now();
            $scope.$watch('dateSlider', function(newValue){
                if(Date.now() - lastUpdate > 100){//100ms
                    $scope.endDate = moment(($scope.dates[newValue]), "YY/MM/DD");
                    $scope.preRendering();
                    $scope.loopResize();
                    lastUpdate = Date.now();
                }
            });


            $scope.disableMap = function() {
                saveMap = heatmapDensite.get('map');
                heatmapDensite.set('map', null);
            }

            $scope.ableMap = function() {
                heatmapDensite.set('map', saveMap);
            }

            $scope.enableHeatmapPoi = function() {

                heatmapPoi.set('map', saveMap);
                $scope.heatmapPointsEco = true;

            }
            $scope.refreshPoiHeatmap = function() {
                heatmapPoi.set('data', null);
                heatmapPoi.set('data', $scope.heatmapMarqueurs);
            }
            $scope.disabledHeatmapPoi = function() {
                    saveMap = heatmapPoi.get('map');
                    heatmapPoi.set('map', null);
                    $scope.heatmapPointsEco = false;
                }
                /* On desactive les heatmaps par defaut */
                //$scope.disableMap();
          $scope.disabledHeatmapPoi();



            $scope.setOpacity = function(){

                heatmapDensite.set('opacity', $scope.opacity / 100);
            }

            $scope.setRadius = function() {

                heatmapDensite.set('radius', $scope.radius);
            }

            $scope.isTop = function() {

                if (!$scope.isBottom()) {
                    return true;
                } else {
                    return false;
                }

            }
            $scope.relouLink = function(){
                window.location.href="http://eco-map.org/leprojet.html";
            }
            $scope.revertRelouLink = function(){
                window.location.href="http://eco-map.org";
            }
            $scope.isBottom = function() {

                if (location.path == "#/leprojet.html") {
                    return true;
                } else {
                    return false;
                }

            }
            $scope.infoHeatmap = function() {
                angular.forEach($scope.densite, function(value, key) {
                    if (value.weight > 1) {
                        console.log("diff");
                    }
                });

            }

            $scope.controlHeatmapPoi = function() {

                if ($scope.heatmapPoiVisible) {


                    // On desactive

                    $scope.disabledHeatmapPoi();
                    vm.showMarkers();
                    $scope.poiVisible = true;
                    $scope.heatmapPoiVisible = false;
                } else {

                    // On desactive POI classique

                    vm.hideMarkers();
                    $scope.enableHeatmapPoi();
                    $scope.poiVisible = false;
                    $scope.heatmapPoiVisible = true;

                }

            }
            $scope.shareFb = function() {
                $window.open('//www.facebook.com/sharer/sharer.php?u=' + $location.host() + '', '_blank', 'toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,width=300,height=200');
            }
            $scope.shareTwitter = function() {
                $window.open('//twitter.com/share?text=' + $scope.textTweet + '&url=/', '_blank', 'toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,width=300,height=200');
            }

            $scope.shareUrl = function() {
                $mdDialog.show({
                    controller: DialogController,
                    templateUrl: 'wp-content/themes/ecocitoyen/shareUrl.tmpl.html',

                    clickOutsideToClose: true
                });
            }


            $scope.openCGU = function() {
                $mdDialog.show({
                    controller: DialogController,
                    templateUrl: '?page_id=9',

                    clickOutsideToClose: true
                });
            }
            $scope.openML = function() {
                $mdDialog.show({
                    controller: DialogController,
                    templateUrl: '?page_id=11',

                    clickOutsideToClose: true
                });



            }
            $scope.getLinkProjet = function() {

                if ($scope.isBottom()) {
                    return "#laCarte";

                } else {
                    return "http://eco-map.org/leprojet.html";

                }

            }
            $scope.openLeProjet = function() {
                $mdDialog.show({
                    controller: DialogController,
                    templateUrl: '?page_id=17',

                    clickOutsideToClose: true
                });

            }
            $scope.controlHeatmapDensite = function() {
                // Si

                if ($scope.heatmapDensiteVisible) {
                    // On desactive
                    $scope.disableMap();
                    $scope.heatmapDensiteVisible = false;
                } else {
                    // On active
                    $scope.ableMap();
                    $scope.heatmapDensiteVisible = true;

                }
            }

            $scope.controlPoi = function() {

                if ($scope.poiVisible) {

                    $scope.enableHeatmapPoi();

                    vm.hideMarkers();
                    $scope.poiVisible = false;
                    $scope.heatmapPoiVisible = true;


                } else {
                    // On active les POI

                    vm.showMarkers();


                    $scope.disabledHeatmapPoi();
                    $scope.poiVisible = true;

                    $scope.heatmapPoiVisible = false;
                    google.maps.event.trigger(vm.map, 'zoom_changed');
                }
            }
            $scope.radiusMoins = function() {

                heatmapDensite.set('radius', parseInt(heatmap.get('radius')) - 1);
                $scope.infoRadiusZoom();
            };
            $scope.radiusPlus = function() {
                heatmapDensite.set('radius', parseInt(heatmap.get('radius')) + 1);
                $scope.infoRadiusZoom();
            };

            $scope.categFilter = function(arr){
                return function(item){
                    return arr.indexOf(item.title)!=-1;
                }
            }
            $scope.preRendering = function(){
                var dateOk = $scope.dateRangeFilter('date', $scope.startDate, $scope.endDate);
                var categOk = $scope.categFilter($scope.filtreArray);
                vm.map.markers.forEach(function(x,i){
                    var ok = dateOk(x, i) && categOk(x);
                    x.visible = !!ok;
                });
            }
            /* Filtre sur la date des marqueurs POI */
            $scope.dateRangeFilter = function(property, startDate, endDate) {
                return function(item, i) {
                    if (item[property] === null || $scope.mapSelector != "poi") return false;
                    var itemDate = moment(item[property], "YY/MM/DD");
                    var s = moment(startDate, "YY/MM/DD");
                    var e = moment(endDate, "YY/MM/DD");
                    if (itemDate >= s && itemDate <= e){
                        return true;
                    }
                    return false;
                }
            }
            $scope.preRendering();
            $scope.loopResize();

        });


        vm.changeRadius = function() {
            heatmapDensite.set('radius', heatmatDensite.get('radius') ? null : 20);
        }
        vm.changeOpacity = function() {
            heatmapDensite.set('opacity', heatmapDensite.get('opacity') ? null : 0.2);
        }

    });

    $scope.filterCustom = ['Relais', 'Poubelle Verre'];
    $scope.filterExpr = {
        cate: "Relais"
    };
    $scope.selectAll = function() {
        $scope.resized = false;
        if ($scope.checkboxCate && $scope.filtreArray.length == 12) {
            $scope.filtreArray = [];
            $scope.cates.map(function(x, y) {
                $scope.activeButton[y] = "";
                $scope.cateStyle[y] = 'unchecked';
                $scope.disabledCheckbox[y] = true;

            });

            $scope.resized = true;
            $scope.force = false;
        } else {
            $scope.filtreArray = [];
            $scope.cates.map(function(x, y) {
                $scope.activeButton[y] = "md-activated";
                $scope.filtreArray.push(x);
                $scope.disabledCheckbox[y] = false;
                $scope.cateStyle[y] = '';

            });



            $scope.force = true;
        }

        $scope.preRendering();
        $scope.loopResize();//reload our markers
    }

    /* fonction appellée au clic sur une des catégories, permet de gerer le filtre */
    $scope.add = function(val, index) {

        $scope.force = true;

        var indexVal = $scope.filtreArray.indexOf(val);
        if (indexVal < 0) {
            $scope.filtreArray.push(val);
            $scope.activeButton[index] = "md-activated";
            $scope.disabledCheckbox[index] = false;
            $scope.cateStyle[index] = '';
        } else {

            $scope.filtreArray.splice(indexVal, 1);
            $scope.activeButton[index] = "";
            $scope.disabledCheckbox[index] = true;
            $scope.checkboxCate = false;
            $scope.cateStyle[index] = 'unchecked';
        }
        $scope.preRendering();
        $scope.loopResize();//reload our markers
    }


    $scope.init = function() {
        //$scope.force = false;
        if ($scope.dateSlider == null) {

            $scope.dateSlider = xVal;
        }

    }





});

function DialogController($scope, $mdDialog, $window) {
    $scope.currentUrl = $window.location;
    $scope.closeDialog = function() {
        $mdDialog.hide();
    }
}
