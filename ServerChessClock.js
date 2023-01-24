const EventEmitter = require('events');

function ServerChessClock(time) {
    this.timeMode = time;
    this.remainingTimeWhite = {minutes: time.minutes, seconds: 0};
    this.remainingTimeBlack = {minutes: time.minutes, seconds: 0};
    this.ChessClockAPI = new EventEmitter();
    switch (time.type) {
        case 'Bullet': this.startingTimeWhite = this.startingTimeBlack = 15; break;
        case 'Blitz': this.startingTimeWhite = this.startingTimeBlack = 20; break;
        case 'Rapid': this.startingTimeWhite = this.startingTimeBlack = 30; break;
        case 'Classical': this.startingTimeWhite = this.startingTimeBlack = 45; break;
        default: this.startingTimeWhite = this.startingTimeBlack = "unknown"; break;
    }
}

    ServerChessClock.prototype.startStartingTimer = function(colour) {
    var startingTime = colour === 'white' ? this.startingTimeWhite : this.startingTimeBlack;
    const decrease = () => {
        if(startingTime > 0) {
            startingTime -= 1;
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


    ServerChessClock.prototype.startTimer = function(colour) {
        var remainingTimeCopy = colour === 'white' ? this.remainingTimeWhite : this.remainingTimeBlack
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
        this.ChessClockAPI.once('toggle', () => {
            clearInterval(timer);
            if(colour === 'white') {
                this.remainingTimeWhite = increment(remainingTimeCopy, this.timeMode.increment);
                this.ChessClockAPI.emit('toggleTime', this.remainingTimeWhite, this.remainingTimeBlack, 'black');
                this.startTimer('black');
            } else {
                this.remainingTimeBlack = increment(remainingTimeCopy, this.timeMode.increment);
                this.ChessClockAPI.emit('toggleTime', this.remainingTimeWhite, this.remainingTimeBlack, 'white');
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