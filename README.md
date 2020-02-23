# Train Wreck

## Description
Game based in the classical Snake concept, in which the user operates a train an has to pick up passengers to earn up points and advance in the game.

It is developed using JavaScript, jQuery and jQuery UI.

This game was developed as a project for the Web Interface Development module.

## Mechanics
The user moves the train with either the arrow keys or the WASD keys in the keyboard, and has to prevent the train from colliding with the board walls or with itself.

### Passengers
Passengers appear at random positions in the board, and the user has to pick them up. Each passenger grants one point to the user, and increases the train lenght by one.

Each time a passenger is picked up, another one appears in the board.

### Stations
Sometimes, when a passenger is picked up, a station may appear somewhere in the board. The probability for a station to appear is linked to the number of passengers picked up. As the number increases, stations will be more likely to appear.

When the train passes by a station, the user is granted ten points, but the length of the train is not increased. However, passing by a station grants a speed boost to the train, making more difficult to operate the train.

The user may decide not to pass by the station right away. However, after a while, the station will dissapear if not passed by.
