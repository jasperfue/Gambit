const EventEmitter = require('events');

function ServerChessClock(time) {
    this.timeMode = time;
    this.currentMode = 'off';
    this.remainingTimeWhite = {minutes: time.minutes, seconds: 0};
    this.remainingTimeBlack = {minutes: time.minutes, seconds: 0};
    this.ChessClockAPI = new EventEmitter();
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

    ServerChessClock.prototype.startStartingTimer = function(colour) {
    let startingTime;
    if(colour === 'white') {
        this.currentMode = "sw";
        startingTime = this.startingTimeWhite;
    } else {
        this.currentMode = "sb";
        startingTime = this.startingTimeBlack;
    }
    const decrease = () => {
        if(startingTime.seconds > 0) {
            startingTime.seconds -= 1;
        } else {
            this.ChessClockAPI.emit('Cancel Game');
            clearInterval(timer);
            return;
        }
        console.log(startingTime);
    }
    const timer = setInterval(decrease, 1000);
    this.ChessClockAPI.once('toggle', () => {
        clearInterval(timer);
    });
    }

    ServerChessClock.prototype.getCurrentMode = function() {
        return this.currentMode;
    }

    ServerChessClock.prototype.getCurrentTimes = function() {
        return {remainingTimeWhite: this.remainingTimeWhite, remainingTimeBlack: this.remainingTimeBlack};
    }

    ServerChessClock.prototype.getCurrentStartingTimer = function() {
        return {startingTimeWhite: this.startingTimeWhite.seconds, startingTimeBlack: this.startingTimeBlack.seconds};
    }

    ServerChessClock.prototype.startTimer = function(colour) {
    let remainingTimeCopy;
    if(colour === 'white') {
        remainingTimeCopy = this.remainingTimeWhite;
        this.currentMode = 'tw';
    } else {
        remainingTimeCopy = this.remainingTimeBlack;
        this.currentMode = 'tb';
    }
        const decrease = () => {
            if(remainingTimeCopy.seconds === 0) {
                if(remainingTimeCopy.minutes === 0) {
                    //TODO: SPIEL VERLOREN
                } else {
                    remainingTimeCopy.minutes -= 1;
                    remainingTimeCopy.seconds = 59;
                }
            } else {
                remainingTimeCopy.seconds -= 1;
            }
            console.log(remainingTimeCopy);
        }
        const timer = setInterval(decrease, 1000);
        this.ChessClockAPI.once('toggle', (cb) => {
            clearInterval(timer);
            console.log(colour);
            if(colour === 'white') {
                this.remainingTimeWhite = increment(remainingTimeCopy, this.timeMode.increment);
                cb({remainingTimeWhite: this.remainingTimeWhite, remainingTimeBlack: this.remainingTimeBlack, turn: 'tb'});
                this.startTimer('black');
            } else {
                this.remainingTimeBlack = increment(remainingTimeCopy, this.timeMode.increment);
                cb({remainingTimeWhite: this.remainingTimeWhite, remainingTimeBlack: this.remainingTimeBlack, turn: 'tw'});
                this.startTimer('white');
            }
        })
    }

    function increment(remainingTime, increment) {
        if(remainingTime.seconds + increment > 59) {
            for (var i = increment; i > 0; i--) {
                if(remainingTime.seconds + 1 < 60) {
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