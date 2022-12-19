
export class Timer {
    constructor(time, socket) {
        this.minutes = time.minutes;
        this.secounds = 0;
        this.increment = time.increment;
        this.socket = socket;
    }

    start() {
        const timer = setInterval(run, 1000);

        function run() {
            if(this.secounds === 0) {
                if(this.minutes === 0) {
                    //TODO: GAME LOST
                } else {
                    this.minutes -= 1;
                    this.secounds = 59;
                }
            } else {
                this.secounds -= 1;
            }
        }
    }

    getTime() {
        return {minutes: this.minutes, seconds: this.secounds};
    }
}