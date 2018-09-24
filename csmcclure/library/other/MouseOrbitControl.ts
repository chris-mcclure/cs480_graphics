
class MouseClickState {
    state: boolean = false;
    x: number = 0;
    y: number = 0;
    dx: number = 0;
    dy: number = 0;
    downx: number = 0;
    downy: number = 0;
    dragx: number = 0;
    dragy: number = 0;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    move(x: number, y: number) {
        this.dx = x - this.x;
        this.dy = y - this.y;
        this.x = x;
        this.y = y;
        if (this.state) {
            this.dragx = x - this.downx;
            this.dragy = y - this.downy;
        }
    }

    down(x: number, y: number) {
        this.downx = x;
        this.downy = y;
        this.state = true;
    }

    up(x: number, y: number) {
        this.state = false;
    }
}

class MouseOrbitControl {

    private _transform: Matrix4 = Matrix4.makeIdentity();
    private _eulerAngles: Vector3 = Vector3.make(0, 0, 0);
    private _dt: number = 0.0;
    public speed: number = 1.0;
    private _mouseIsOver: boolean = false;
    private _buttons: Map<number, MouseClickState> = new Map<number, MouseClickState>();

    constructor() {
    }

    reset() {
        this._transform.LoadIdentity();
        this._eulerAngles.reset(0, 0, 0);
    }

    update(deltaTimeInSeconds: number) {
        this._dt = Math.min(0.16667, deltaTimeInSeconds);
    }

    attachToElement(element: HTMLElement) {
        let self = this;
        element.addEventListener("mousedown", (e) => {
            self.onmousedown(e);
        });
        element.addEventListener("mouseup", (e) => {
            self.onmouseup(e);
        });
        element.addEventListener("mouseout", (e) => {
            self.onmouseout(e);
        });
        element.addEventListener("mouseover", (e) => {
            self.onmouseover(e);
        });
        element.addEventListener("mousemove", (e) => {
            self.onmousemove(e);
        });
        element.addEventListener("mousewheel", (e) => {
            self.onmousewheel(e);
        });
    }

    get transform(): Matrix4 {
        return this._transform;
    }

    get euler(): Vector3 {
        return this._eulerAngles;
    }

    onmouseover(e: MouseEvent) {
        this._mouseIsOver = true;
        if (this._mouseIsOver) {
            e.stopImmediatePropagation();
            e.preventDefault();
        }
    }

    onmouseout(e: MouseEvent) {
        this._mouseIsOver = false;
        for (let button of this._buttons.values()) {
            button.up(e.x, e.y);
        }
    }

    onmousedown(e: MouseEvent) {
        if (this._mouseIsOver) {
            e.stopImmediatePropagation();
            e.preventDefault();
        }

        if (!this._buttons.has(e.button)) {
            this._buttons.set(e.button, new MouseClickState(e.x, e.y));
        }

        let mcs = this._buttons.get(e.button);
        if (mcs) {
            mcs.down(e.x, e.y);
        }
    }

    onmouseup(e: MouseEvent) {
        if (this._mouseIsOver) {
            e.stopImmediatePropagation();
            e.preventDefault();
        }
        if (!this._buttons.has(e.button)) {
            this._buttons.set(e.button, new MouseClickState(e.x, e.y));
        }
        let mcs = this._buttons.get(e.button);
        if (mcs) {
            mcs.up(e.x, e.y);
        }
    }

    onmousemove(e: MouseEvent) {
        if (this._mouseIsOver) {
            e.stopImmediatePropagation();
            e.preventDefault();
        }

        for (let button of this._buttons.values()) {
            button.move(e.x, e.y);
        }

        let mcs0 = this._buttons.get(0);
        if (mcs0 && mcs0.state) {
            this._transform.Rotate(10.0 * this.speed * this._dt * mcs0.dx, 0.0, 1.0, 0.0);
            this._transform.Rotate(90.0 * this.speed * this._dt * mcs0.dy, 1.0, 0.0, 0.0);
            //this._transform.Translate(0.0, 0.0, -this.speed * this._dt * mcs0.dy);
            this._eulerAngles.x += this._dt * mcs0.dx;
            this._eulerAngles.y += this._dt * mcs0.dy;
        }
        let msc1 = this._buttons.get(1);
        if (msc1 && msc1.state) {
            this._transform.Translate(0.0, 0.0, -this.speed * this._dt * msc1.dy);
        }
        let mcs2 = this._buttons.get(2);
        if (mcs2 && mcs2.state) {
            this._transform.Translate(this.speed * this._dt * mcs2.dx, -this.speed * this._dt * mcs2.dy, 0.0);
        }
    }

    onmousewheel(e: MouseWheelEvent) {
        this._transform.Translate(0.0, 0.0, this.speed * this._dt * e.wheelDelta);
        if (this._mouseIsOver) {
            e.stopImmediatePropagation();
            e.preventDefault();
        }
    }
}