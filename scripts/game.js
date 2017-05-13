var car;		            // samochod
var cursors;	            // zmienna z kursorami klawy
var map;                    // mapa
var mapLayers = {};         // warstwy mapy
var checkpoints = [];       // lista kolejnych checkpointow
var currentCheckpoint = 0;  // aktualny checkpoint
var laps = 2;               // okrążenia do przejechania
var labels = {};            // teksty do wyświetlania
var currentLap = 1;         // aktualne okrążenie
var timer;                  // pętla licznika czasu
var raceTime = 0;           // czas wyscigu
var background;             // tło z flagą
var introImage;             // obrazek na intro
var currentSpeed = 0;       // predkosc samochodu
var maxSpeed = 300;         // maksymalna predkosc
var minSpeed = -150;

var GameState = {
	preload: function() {
		// W tej metodzie ładujemy wszystkie potrzebne assety
		game.load.image('car', 'assets/images/cars/car7_red.png');
		game.load.image('tiles', 'assets/images/tiles.png');
        game.load.tilemap('map', 'assets/maps/map1.json', null, Phaser.Tilemap.TILED_JSON);
        game.load.image('intro', 'assets/images/intro.png');
        game.load.image('background', 'assets/images/bg.png');
	},

    parseCheckpoints: function (properties) {
	    for(var tile in properties) {
	        var position = properties[tile].split(',');
	        checkpoints.push({
                x: parseInt(position[0]),
                y: parseInt(position[1])
	        });
        }
    },

    createMap: function () {
        map = game.add.tilemap('map'); // tilemapa do gry
        map.addTilesetImage('tiles'); // grafika z kafelkami do tilemapy
        // warstwy w obiekcie
        mapLayers.grass = map.createLayer('Trawa');
        mapLayers.road = map.createLayer('Droga');
        mapLayers.collisions = map.createLayer('Kolizje');
        mapLayers.road.resizeWorld(); // swiat gry ma rozmiary takie jak warstwa
        map.setCollisionBetween(0, 25, true, mapLayers.collisions);
        this.parseCheckpoints(mapLayers.road.layer.properties);
    },

    createLabels: function () {
        //Licznik pkt kontrolnych
        labels.checkpoints = game.add.text(20, 20, "Checkpoints: " + currentCheckpoint + "/" + checkpoints.length,
            {font: '24px Comic Sans MS', fill: '#ffffff'});
        labels.checkpoints.fixedToCamera = true;
        //Licznik czasu
        labels.timer = game.add.text(game.width / 2, 20, "Time: 00:00:00", {font: '24px Comic Sans MS', fill: '#ffffff'});
        labels.timer.fixedToCamera = true;
        labels.timer.setTextBounds(-90, 0, 180, 100);
        labels.laps = game.add.text(game.width - 20, 20, "Laps: " + currentLap + "/" + laps, {font: '24px Comic Sans MS', fill: '#ffffff'});
        labels.laps.fixedToCamera = true;
        labels.laps.anchor.x = 1;
    },

    timerFormat: function () {
        raceTime++;
        var date = new Date(null);
        date.setSeconds(raceTime); // sekundy dla obiektu Date
        labels.timer.setText("Time: " + date.toISOString().substr(11, 8)) // wycinamy czas
    },

    createIntro: function () {
	    game.paused = true;
        background = game.add.sprite(0, 0, 'background');
        background.fixedToCamera = true;
        introImage = game.add.sprite(0, 0, 'intro');
        introImage.fixedToCamera = true;
        labels.intro = game.add.text(game.width / 2, 670, 'Press UP to START!', {font: '24px Comic Sans MS', fill: '#ffffff'});
        labels.intro.anchor.setTo(0.5);
        cursors.up.onDown.add(this.start, this);
    },

    start: function() {
	    console.log("aaa");
        game.paused = false; // włączamy grę
        introImage.kill();
        labels.intro.kill();
        background.visible = false;
        // Tworzymy teksty
        this.createLabels();
        //pętla czasu
        timer = game.time.events.loop(10, this.timerFormat);
        cursors.up.onDown.remove(this.start, this);
    },

    create: function() {
		// Metoda create uruchamia się zaraz po uruchomieniu stanu,
		// możemy w niej zdefiniować zmienne, które będziemy w trakcie gry wykorzystywać
        // Aktywuj Arcade (silnik)
        game.physics.startSystem(Phaser.Physics.ARCADE);
        // Stworz mape
        this.createMap();
        // Stworz samochod
		this.createCar();
        cursors = game.input.keyboard.createCursorKeys();
        //Ekran startowy
        this.createIntro();
	},

	createCar: function() {
		car = game.add.sprite(135, 945, 'car');  // x, y i identyfikator dodany w load image
        car.anchor.setTo(0.4, 0.5); // ustawiamy środek obrotu
        car.angle = -90;
        game.physics.enable(car);
        game.camera.follow(car); // kamera podążą za samochodem
        car.body.collideWorldBounds = true;  // kolizje z ekranem
        car.body.setSize(10, 10, 10, 5); // rozmiar obszaru kolizji
        car.body.maxAngular = 200; // maksymalny kąt obrotu kierownicą
	},

    controlCar: function () {
		// if(cursors.right.isDown) {
		// 	car.x += 10;
		// } else if (cursors.left.isDown) {
		// 	car.x -= 10;
		// } else if (cursors.up.isDown) {
		// 	car.y -= 10;
		// } else if(cursors.down.isDown) {
		// 	car.y += 10;
		// }
        // ^ lipa, ale jakos działa
        car.body.velocity.x = 0; // zerujemy prędkości bo inaczej v = inf
        car.body.velocity.y = 0;

        //Skręcanie samochodem (predkosc obrotu kierownicy)
        var whereToTurn;
        if (cursors.up.isDown) {
            whereToTurn = 1;
            if(currentSpeed < 0) {
                currentSpeed += 10;
            } else {
                currentSpeed += 5;
            }
        } else if (cursors.down.isDown){
            whereToTurn = -1;
            if(currentSpeed > 0){
                currentSpeed -= 10;
            } else if(currentSpeed <= 0) {
                currentSpeed -= 2;
            }
        } else{
            if(currentSpeed > 0)
                currentSpeed -= 5;
            else if(currentSpeed < 0) {
                currentSpeed = currentSpeed + 5 > 0 ? 0 : currentSpeed + 5;
            }
        }
        if(currentSpeed !== 0) {
            if (cursors.left.isDown) {
                car.body.angularAcceleration = whereToTurn * -900;
            } else if (cursors.right.isDown) {
                car.body.angularAcceleration = whereToTurn * 900;
            } else {
                car.body.angularAcceleration = 0;
                car.body.angularVelocity = 0;
            }
        }


        //Max predkosc
        if(currentSpeed > maxSpeed) {
            currentSpeed = maxSpeed;
        } else if(currentSpeed <= minSpeed) {
            currentSpeed = minSpeed;
        }

        //Wprawiamy samochod w ruch
        car.body.velocity.copyFrom(game.physics.arcade.accelerationFromRotation(car.rotation, currentSpeed, car.body.acceleration));
        // car.body.angularVelocity = 0; // kąt prędkości
        // var whereToTurn;
        // // Prędkość w odpowiednim kierunku
        // if(cursors.up.isDown) {
        //     car.body.velocity.copyFrom(game.physics.arcade.velocityFromAngle(car.angle, 300)); // tak jak obrócony, tak jedzie
        //     whereToTurn = 1;
        // } else if(cursors.down.isDown){
        //     car.body.velocity.copyFrom(game.physics.arcade.velocityFromAngle(car.angle, -150));
        //     whereToTurn = -1;
        // }
        // if(car.body.velocity.x !== 0 || car.body.velocity.y !== 0) {
        //     if (cursors.left.isDown) {
        //         car.body.angularVelocity = -200*whereToTurn;
        //     } else if (cursors.right.isDown) {
        //         car.body.angularVelocity = 200*whereToTurn;
        //     }
        // }
        // ^ działa, ale nie najlepiej
    },

    nextCheckpoint: function () {
        currentCheckpoint++; // wybieramy kolejny checkpoint
        if(currentCheckpoint === checkpoints.length) {
            currentCheckpoint = 0;
            this.nextLap()
        }

        labels.checkpoints.setText("Checkpoints: " + currentCheckpoint + "/" + checkpoints.length);
    },

    finish: function () {
        labels.finish = game.add.text(game.width / 2, 300, "FINISH",
                                        {font: '72px Comic Sans MS', fill: '#ffffff'});
        labels.finish.anchor.x = 0.5;
        labels.finish.fixedToCamera = true;
        labels.finish.setShadow(0, 0, 'rgba(0, 0, 0, 0.5', 15);
        labels.score = game.add.text(game.width / 2, 400, labels.timer.text, {font: '72px Comic Sans MS', fill: '#ffffff'});
        labels.score.fixedToCamera = true;
        labels.score.anchor.x = 0.5;
        labels.score.setShadow(0, 0, 'rgba(0, 0, 0, 0.5', 15);
        labels.checkpoints.visible = false;
        labels.laps.visible = false;
        labels.timer.visible = false;
        game.time.events.remove(timer);
        game.paused = true; // pętla się zatrzymuje
        background.visible = true;
    },

    nextLap: function () {
        currentLap++; // zwiekszenie aktualnego okrazenia
        if(currentLap > laps) {
            this.finish();
        } else{
            labels.laps.setText("Laps: " + currentLap + "/" + laps);
        }
    },

    checkIfTileIsCheckpoint: function (x, y) {
	    // x i y na mapie (0-15)(0-15)
        // sprawdzamy czy aktualny tile to aktualny checkpoint
        if(x === checkpoints[currentCheckpoint].x && y === checkpoints[currentCheckpoint].y) {
            this.nextCheckpoint();
        }
    },

    update: function() {
		// Główna pętla gry
		// Metoda uruchamiana jest z bardzo dużą częstotliwością (~60 fps)
		this.controlCar();
        // kolizje między samochodem a obiektami z warstwy kolizje
        game.physics.arcade.collide(car, mapLayers.collisions);
        // Sprawdz czy auto jest na asfalcie czy trawie
        var currentTile = map.getTile(mapLayers.road.getTileX(car.body.x), mapLayers.road.getTileY(car.body.y), 'Droga');
        // jeśli na trawie
        if(currentTile === null) {
            // zmniejsz predkosc trzykrotnie
            if(currentSpeed !== 0) {
                game.camera.shake(0.001, 100); // jak jedzie po trawie to trzęsie kamerą
            }
            // gdy auto jedzie za szybko to spowalniamy
            if(currentSpeed > 100) {
                currentSpeed -= 20;
            } else if (currentSpeed < -100) {
                currentSpeed += 20;
            }
        }
        this.checkIfTileIsCheckpoint(mapLayers.road.getTileX(car.body.x), mapLayers.road.getTileY(car.body.y))
	},

	render: function() {
		// Metoda uruchamiana po metodzie update
		// game.debug.spriteInfo(car, 32, 32);
		// game.debug.text('Velocity: ' + car.body.velocity, 32, 128);
		// game.debug.body(car);
        // game.debug.text('angularVelocity: ' + car.body.angularVelocity, 32, 148);
        // game.debug.text('angularAcceleration: ' + car.body.angularAcceleration, 32, 168);
        // game.debug.text('Acceleration: ' + car.body.acceleration, 32, 188);
        // game.debug.text('Velocity: ' + car.body.velocity, 32, 208);
        // game.debug.text('currentSpeed: ' + currentSpeed, 32, 228);
	}
};
