var game;

// Tworzymy nową instancję gry o wymiarach 1000x800 w elemencie #game
game = new Phaser.Game(1000, 800, Phaser.AUTO, 'game');

game.state.add('GameState', GameState); // dodajemy stan gry
game.state.start('GameState'); // uruchamiamy stan gry
