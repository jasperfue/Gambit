const EventEmitter = require('events');

function ServerChessClock(time) {
    this.timeMode = time;
    this.currentMode = 'off';
    this.remainingTimeWhite = {minutes: time.minutes, seconds: 0};
    this.remainingTimeBlack = {minutes: time.minutes, seconds: 0};
    this.ChessClockEvents = new EventEmitter();
    this.startingTimeWhite = {seconds: 0};
    this.startingTimeBlack = {seconds: 0};
    switch (time.type) {
        case 'Bullet': this.startingTimeWhite.seconds = this.startingTimeBlack.seconds = 15; break;
        case 'Blitz': this.startingTimeWhite.seconds = this.startingTimeBlack.seconds = 20; break;
        case 'Rapid': this.startingTimeWhite.seconds = this.startingTimeBlack.seconds = 30; break;
        case 'Classical': this.startingTimeWhite.seconds = this.startingTimeBlack.seconds = 45; break;
        default: this.startingTimeWhite.seconds = this.startingTimeBlack.seconds = "unknown"; break;
    }
}

ServerChessClock.prototype.startStartingTimer = function (colour) {
    let startingTime;
    if (colour === 'white') {
        this.currentMode = "sw";
        startingTime = this.startingTimeWhite;
    } else {
        this.currentMode = "sb";
        startingTime = this.startingTimeBlack;
    }
    const decrease = () => {
        if (startingTime.seconds > 1) {
            startingTime.seconds -= 1;
        } else {
            startingTime.seconds -= 1;
            clearInterval(timer);
            this.stopCurrentGame();

        }
    }
    const timer = setInterval(decrease, 1000);
    this.ChessClockEvents.once('toggle', () => {
        clearInterval(timer);
    });
    this.ChessClockEvents.once("stop", () => {
        clearInterval(timer);
    });
}

/**
 * Called if a time is run out
 */
ServerChessClock.prototype.stopCurrentGame = function () {
    if (this.getCurrentMode().includes('s')) {
        this.ChessClockEvents.emit('cancel_game');
    } else if (this.getCurrentMode().includes('w')) {
        this.ChessClockEvents.emit('time_over', 'white');
    } else {
        this.ChessClockEvents.emit('time_over', 'black');
    }
}

ServerChessClock.prototype.getCurrentMode = function () {
    return this.currentMode;
}

ServerChessClock.prototype.getCurrentTimes = function () {
    return {remainingTimeWhite: this.remainingTimeWhite, remainingTimeBlack: this.remainingTimeBlack};
}

ServerChessClock.prototype.getCurrentStartingTimer = function () {
    return {startingTimeWhite: this.startingTimeWhite.seconds, startingTimeBlack: this.startingTimeBlack.seconds};
}

/**
 * Starts the timer for the given player color and manages time increments and game over events.
 *
 * @param {string} color - The color of the player for whom the timer should start ("white" or "black").
 */
ServerChessClock.prototype.startTimer = function (color) {
    let currentPlayerTime;
    if (color === "white") {
        currentPlayerTime = this.remainingTimeWhite;
        this.currentMode = "tw";
    } else {
        currentPlayerTime = this.remainingTimeBlack;
        this.currentMode = "tb";
    }

    const isTimeOver = () => {
        return currentPlayerTime.minutes === 0 && currentPlayerTime.seconds === 0;
    };

    const decreaseTime = () => {
        if (currentPlayerTime.seconds === 0) {
            currentPlayerTime.minutes -= 1;
            currentPlayerTime.seconds = 59;
        } else {
            currentPlayerTime.seconds -= 1;
        }
    };

    const timer = setInterval(() => {
        decreaseTime();
        if (isTimeOver()) {
            clearInterval(timer);
            this.stopCurrentGame();

        }
    }, 1000);

    this.ChessClockEvents.once("stop", () => {
        console.log('STOP CLOCK   ___')
        clearInterval(timer);
    });
    this.ChessClockEvents.once("toggle", (cb) => {
        clearInterval(timer);
        if (color === "white") {
            this.remainingTimeWhite = increment(
                currentPlayerTime,
                this.timeMode.increment
            );
            cb({
                remainingTimeWhite: this.remainingTimeWhite,
                remainingTimeBlack: this.remainingTimeBlack,
                turn: "tb",
            });
            this.startTimer("black");
        } else {
            this.remainingTimeBlack = increment(
                currentPlayerTime,
                this.timeMode.increment
            );
            cb({
                remainingTimeWhite: this.remainingTimeWhite,
                remainingTimeBlack: this.remainingTimeBlack,
                turn: "tw",
            });
            this.startTimer("white");
        }
    });
};


function increment(remainingTime, increment) {
    if (remainingTime.seconds + increment > 59) {
        for (var i = increment; i > 0; i--) {
            if (remainingTime.seconds + 1 < 60) {
                remainingTime.seconds += 1;
            } else {
                remainingTime.minutes += 1;
                remainingTime.seconds = 0;
            }
        }
        return remainingTime;
    } else {
        remainingTime.seconds += increment;
        return remainingTime;
    }
}


module.exports = [ServerChessClock];