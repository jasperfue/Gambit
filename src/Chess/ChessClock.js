
export class ChessClock {
    constructor(time, setRemainingTimeWhite, setRemainingTimeBlack) {
        this.remainingTimeWhite = {minutes: time.minutes, seconds: 0};
        this.remainingTimeBlack = {minutes: time.minutes, seconds: 0};
        this.increment = time.increment;
        this.currentClock = 0;
        this.setRemainingTimeWhite = (remainingTimeWhite) => setRemainingTimeWhite(remainingTimeWhite);
        this.setRemainingTimeBlack = (remainingTimeBlack) => setRemainingTimeBlack(remainingTimeBlack);
    }

    static decrease = (remainingTime) => {
        if(remainingTime.seconds === 0) {
            if(remainingTime.minutes === 0) {
                //TODO: GAME LOST
            } else {
                remainingTime.minutes -= 1;
                remainingTime.seconds = 59;
            }
        } else {
            remainingTime.seconds -= 1;
        }
        console.log(remainingTime);
        return remainingTime;
    }

    start(colour) {
        const timer = setInterval(() => {
            if(colour == 'white') {
                this.remainingTimeWhite = ChessClock.decrease(this.remainingTimeWhite);
                this.setRemainingTimeWhite(this.remainingTimeWhite);
            } else {
                this.remainingTimeBlack = ChessClock.decrease(this.remainingTimeBlack);
                this.setRemainingTimeBlack(this.remainingTimeBlack); 
            }
        }, 1000);
        this.currentClock = timer;
    }

    stopClock() {
        clearInterval(this.currentClock)
    }

    static addIncrement(remainingTime, increment) {
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
}