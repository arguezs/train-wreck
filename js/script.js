const UP = 'up', DOWN = 'down', RIGHT = 'right', LEFT = 'left', DEFAULT = {size: 1, speed: 5, train: 4, passenger: 10}

let train, passenger, station, next, highScore, bestScore = 0, gameStarted, timer

/**
 * Crea la configuración inicial de la página.
 *
 * Aplica los estilos del acordeón de jQuery UI, los colores al tablero, los estilos de la pantalla de fin de juego,
 * y crea los listeners para los distintos botones de la aplicación.
 */
$(document).ready( () => {
    $('#game-info').accordion({
        active: false,
        collapsible: true,
        heightStyle: "content"
    })

    setUpBoard()
    hideWreckScreen()

    $('#start-btn').click(() => {
        $('#start-screen').hide()
        setUpControl()
        setDefaultData()
    })

    $('#restart-btn').click(() => {
        hideWreckScreen()
        setDefaultData()
        setUpControl()
    })

    $('#home-btn').click(() => {
        $('#start-screen').show()
        hideWreckScreen()
    })

} )

/**
 * Establece los datos por defecto del juego, reinicia los marcadores y repinta el tablero.
 */
function setDefaultData() {
    train = { x: DEFAULT.train, y: DEFAULT.train, size: DEFAULT.size, trail: [], speed: DEFAULT.speed }
    passenger = { x: DEFAULT.passenger, y: DEFAULT.passenger, count: 0 }
    station = { x: undefined, y: undefined, count: 0, timers: {} }
    next = { dir: DOWN, x: 0, y: 0 }
    highScore = gameStarted = false
    timer = {count: 0}

    updateScore()
    updateTime()

    moveTrain()

    $(`[data-x="${passenger.x}"][data-y="${passenger.y}"]>i`).addClass('fas fa-male')

}

/**
 * Establece los listeners para las teclas con las que se maneja el juego.
 */
function setUpControl(){
    $(document).keydown( (e) => {
        switch (e.which) {
            case 27:
                if (gameStarted)
                    togglePause()
                break
            case 37:
            case 65:
                if (!gameStarted || next.dir != RIGHT){
                    next = { dir: LEFT, x: -1, y: 0 }
                    startGame()
                }
                break
            case 38:
            case 87:
                if (!gameStarted || next.dir != DOWN){
                    next = { dir: UP, x: 0, y: -1 }
                    startGame()
                }
                break
            case 39:
            case 68:
                if (!gameStarted || next.dir != LEFT){
                    next = { dir: RIGHT, x: 1, y: 0 }
                    startGame()
                }
                break
            case 40:
            case 83:
                if (!gameStarted || next.dir != UP){
                    next = { dir: DOWN, x: 0, y: 1 }
                    startGame()
                }
                break
        }
    })
}

/**
 * Aplica los estilos a las celdas para crear el efecto ajedrez, e identifica cada una de las celdas con sus coordenadas
 * dentro de la cuadrícula.
 */
function setUpBoard() {
    let i = 0
    $('.cell').each(function () {
        if ((Math.floor(i/16)%2 == 0 && i%2 == 0) ||
            (Math.floor(i/16)%2 != 0 && i%2 != 0))
            $(this).addClass('green')
        else
            $(this).addClass('light-green')

        $(this).attr({
            "data-x": i%16,
            "data-y": Math.floor(i/16)
        })

        i++
    })

    $('#pause-screen').hide()
}

/**
 * Si el juego no está ya iniciado, lo inicia.
 *
 * Crea los intervalos que rigen el movimiento del tren y el contador de tiempo. Activa el sonido del tren.
 */
function startGame() {
    if (!gameStarted) {
        timer.interval = setInterval(updateTime, 1000)

        train.interval = setInterval(moveTrain, 1000/train.speed)

        replay('train-sound')

        gameStarted = true
    }
}

/**
 * Mueve el tren en función de la dirección establecida por el usuario.
 *
 * Comprueba si el tren recoge un pasajero, pasa por una estación, y actúa en consecuencia.
 *
 * Comprueba si se ha cumplido alguna de las condiciones de que hacen que se pierda la partida. Si no es así, pinta de
 * nuevo el tren.
 */
function moveTrain(){
    train.x += next.x
    train.y += next.y

    if (train.x == passenger.x && train.y == passenger.y)
        pickUpPassenger()


    if ( train.trail.unshift( {
        x: train.x,
        y: train.y,
        dir: next.dir
    }) > train.size)
        train.trail.pop()

    if (train.x == station.x && train.y == station.y)
        passByStation()

    if ( train.x < 0 || train.y < 0 || train.x > 15 || train.y > 15 ||
        train.trail.filter(wagon => wagon.x == train.x && wagon.y == train.y).length != 1)
        endGame()
    else
        paintTrain()
}

/**
 * Toma el array en el que se guardan los vagones del tren y los pinta sobre la cuadrícula.
 */
function paintTrain() {

    $('.train').removeClass('train head up down left right')

    for (let wagon of train.trail) {
        let cell = `[data-x="${wagon.x}"][data-y="${wagon.y}"]`

        if (train.trail.indexOf(wagon) == 0)
            $(cell).addClass('head')

        $(cell).addClass(`train ${wagon.dir}`)
    }

}

/**
 * Actualiza la puntuación y el número de pasajeros recogidos y estaciones visitadas en el marcador.
 *
 * Comprueba si se ha superado el récord existente, y, en caso afirmativo, lo actualiza tanto en el marcador como
 * internamente.
 */
function updateScore(){
    let score = passenger.count + 10*station.count

    $('#cur-score').text(score)
    $('#passenger-score').text(passenger.count)
    $('#station-score').text(station.count)

    if (score > bestScore){
        highScore = true
        bestScore = score
        $('#bst-score').text(bestScore)
    }
}

/**
 * Actualiza el tiempo de juego tanto en el marcador como internamente.
 */
function updateTime(){
    timer.count += 1000
    $('#timer').text(new Date(timer.count).toLocaleTimeString(undefined, {
        minute: '2-digit',
        second: '2-digit'
    }))
}

/**
 * Destruye el pasajero existente, crea uno nuevo y lo coloca sobre la cuadrícula.
 */
function setNewPassenger(){
    destroyPassenger()

    setItem(passenger)

    $(`[data-x="${passenger.x}"][data-y="${passenger.y}"]>i`).addClass('fas fa-male')
}

/**
 * Destruye el pasajero existente.
 *
 * Anula sus coordenadas y lo borra de la cuadrícula.
 */
function destroyPassenger(){
    $('.cell>.fa-male').removeClass('fas fa-male')
    passenger.x = passenger.y = undefined
}

/**
 * Recoge un pasajero que el tren haya encontrado.
 *
 * Aumenta el tamaño del tren en uno, actualiza el recuento de pasajeros recogidos, y hace sonar la bocina.
 *
 * Actualiza la puntuación, crea un nuevo pasajero y, si se cumplen los requerimientos, crea una nueva estación.
 *
 * Las condiciones para crear una estación son que un número generado al azar entre 0 y 10 sea menor que
 * (0.15 + 0.08*x), donde x es el número de pasajeros recogidos hasta el momento, y que no haya ninguna estación en el
 * tablero.
 */
function pickUpPassenger() {
    passenger.count++
    train.size++

    replay('train-horn')

    updateScore()
    setNewPassenger()

    if (Math.random()*10 < (0.15 + 0.08*passenger.count) && !station.x && !station.y)
        setNewStation()
}

/**
 * Crea una nueva estación y la coloca sobre la cuadrícula.
 *
 * Establece un contador de entre 5 y 10 segundos hasta que la estación empiece el proceso de desvanecimiento de la
 * nueva estación.
 */
function setNewStation() {
    setItem(station)

    $(`[data-x="${station.x}"][data-y="${station.y}"]>i`).addClass('fas fa-school')

    station.timers.vanish = setTimeout(vanishStation, (Math.random()*5 + 5) * 1000 )
}

/**
 * Hace que la estación parpadee durante 3 segundos antes de hacer que se desvanezca y destruirla si el tren no pasa
 * por ella antes.
 */
function vanishStation() {
    let stationCell = '.cell>.fa-school'

    station.timers.animation = setInterval( () => {
        $(stationCell)
            .animate({
                opacity: 0.5,
                fontSize: '6vh'
            }, 300)
            .animate({
                opacity: 1,
                fontSize: '3vh'
            }, 300)
    }, 600)

    station.timers.destroy = setTimeout(() => {
        $(stationCell).animate({
            opacity: 0,
            fontSize: 0
        }, 600, 'swing', destroyStation())
    }, 3000)
}

/**
 * Destruye la estación existente.
 *
 * Anula sus coordenadas, la borra de la cuadrícula y elimina los intervalos y contadores que pudiese tener.
 */
function destroyStation() {
    station.x = station.y = undefined

    clearInterval(station.timers.vanish)
    clearInterval(station.timers.animation)
    clearInterval(station.timers.destroy)

    $('.cell>.fa-school').removeClass('fas fa-school')
}

/**
 * El tren pasa por una estación.
 *
 * Aumenta el contador de estaciones, hace sonar la bocina y destruye la estación actual.
 */
function passByStation() {
    station.count++

    updateScore()
    destroyStation()

    replay('train-horn')

    clearInterval(train.interval)
    train.interval = setInterval(moveTrain, 1000/++train.speed)
}

/**
 * Finaliza el juego.
 *
 * Desactiva los controles del juego, detiene el sonido del tren y hace sonar los audios de choque, elimina los
 * intervalos de movimiento del tren y del contador de tiempo, destruye la estación y el pasajero existentes y muestra
 * la pantalla de fin de juego.
 */
function endGame() {
    gameStarted = false

    $(document).off('keydown')

    document.getElementById('train-sound').pause()

    replay('power-failure')
    replay('sad-trombone')

    clearInterval(train.interval)
    clearInterval(timer.interval)

    destroyStation()
    destroyPassenger()

    showWreckScreen()
}

/**
 * Reinicia el sonido de un audio y lo reproduce.
 *
 * @param audio - la id de la etiqueta audio.
 */
function replay(audio) {
    document.getElementById(audio).currentTime = 0
    document.getElementById(audio).play()
}

/**
 * Muestra la pantalla de fin de partida.
 *
 * Anima el texto de 'Train Wreck!' y, si se ha batido un nuevo récord, el de 'Nuevo récord'.
 *
 * Muestra la puntuación obtenida.
 */
function showWreckScreen() {
    $('#wreck-screen').show()

    $('#tw-logo').textyle({ duration: 300 })

    if (highScore)
        $('#high-score').textyle({ duration: 300, delay: 100})

    $('#final-score').text(passenger.count + 10*station.count)
}

/**
 * Esconde la pantalla de fin de partida.
 *
 * Reestablece los estilos por defecto de los títulos que se animan.
 */
function hideWreckScreen() {
    $('#wreck-screen').hide()

    $('.tile').css({ opacity: 0 })
    $('.tile>span').css({
        position: 'relative',
        top: '10px',
        left: '10px',
        opacity: 0
    })
}

/**
 * Activa o desactiva la pausa durante el juego.
 *
 * Si activa la pausa, limpia los intervalos de movimiento del tren y del contador de tiempo, y pausa el sonido del tren.
 *
 * Si reanuda el juego, vuelve a establecer los intervalos y hace sonar el tren de nuevo.
 */
function togglePause() {
    $('#pause-screen').toggle()

    if (timer.interval){
        clearInterval(timer.interval)
        clearInterval(train.interval)

        document.getElementById('train-sound').pause()

        train.interval = timer.interval = undefined
    } else {
        timer.interval = setInterval(updateTime, 1000)
        train.interval = setInterval(moveTrain, 1000/train.speed)
        document.getElementById('train-sound').play()
    }
}

/**
 * Establece las coordenadas de un nuevo objeto de juego (pasajero o estación).
 *
 * Comprueba que el nuevo objeto no se coloque encima de otro objeto ya existente o en la cola del tren.
 *
 * @param item - objeto a colocar.
 */
function setItem(item){
    do{
        item.x = Math.floor(Math.random() * 16)
        item.y = Math.floor(Math.random() * 16)
    } while (train.trail.find( e => e.x == item.x && e.y == item.y) ||
    (passenger.x == station.x && passenger.y == station.y))
}

/**
 * Crea un log en la consola con los valores de los objetos de juego: tren, pasajero y estación.
 */
function logStatus(){
    let trainStatus = {}
    Object.assign(trainStatus, train)
    delete trainStatus.trail

    console.clear()

    console.table(trainStatus)
    console.table(train.trail)
    console.table(passenger)
    console.table(station)
}
