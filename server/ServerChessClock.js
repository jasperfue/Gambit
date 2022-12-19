const EventEmitter = require('events');

function ServerChessClock(time) {
    this.timeMode = time;
    this.remainingTimeWhite = {minutes: time.minutes, seconds: 0};
    this.remainingTimeBlack = {minutes: time.minutes, seconds: 0};
    this.ChessClockAPI = new EventEmitter();
    console.log('einMal')
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
                this.startTimer('black');
            } else {
                this.remainingTimeBlack = increment(remainingTimeCopy, this.timeMode.increment);
                this.startTimer('white');
            }
            this.ChessClockAPI.emit('toggleTime', this.remainingTimeWhite, this.remainingTimeBlack);
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