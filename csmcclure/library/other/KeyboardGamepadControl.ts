const BUTTONA = 0;
const BUTTONB = 1;
const BUTTONX = 2;
const BUTTONY = 3;
const BUTTONLSHOULDER1 = 4;
const BUTTONRSHOULDER1 = 5;
const BUTTONLSHOULDER2 = 6;
const BUTTONRSHOULDER2 = 7;
const BUTTONSELECT = 8;
const BUTTONSTART = 9;
const BUTTONUP = 12;
const BUTTONDOWN = 13;
const BUTTONLEFT = 14;
const BUTTONRIGHT = 15;

class SimpleGamepad {
    private _stick1: Vector2 = new Vector2();
    private _stick2: Vector2 = new Vector2();
    // _buttons is the four buttons on 
    private _buttons: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    private _connected: boolean = false;

    set stick1x(x: number) { this._stick1.x = GTE.clamp(x, -1.0, 1.0); }
    set stick1y(x: number) { this._stick1.y = GTE.clamp(x, -1.0, 1.0); }
    set stick2x(x: number) { this._stick2.x = GTE.clamp(x, -1.0, 1.0); }
    set stick2y(x: number) { this._stick2.y = GTE.clamp(x, -1.0, 1.0); }

    get stick1(): Vector2 { return this._stick1; }
    get stick2(): Vector2 { return this._stick2; }
    get stick1dir(): Vector2 { return this._stick1.norm(); }
    get stick2dir(): Vector2 { return this._stick2.norm(); }
    get button1(): boolean { return this._buttons[0] > 0.25; }
    get button2(): boolean { return this._buttons[1] > 0.25; }
    get button3(): boolean { return this._buttons[2] > 0.25; }
    get button4(): boolean { return this._buttons[3] > 0.25; }
    get lshoulder1(): boolean { return this._buttons[4] > 0.25; }
    get rshoulder1(): boolean { return this._buttons[5] > 0.25; }
    get lshoulder2(): boolean { return this._buttons[6] > 0.25; }
    get rshoulder2(): boolean { return this._buttons[7] > 0.25; }
    get back(): boolean { return this._buttons[8] > 0.25; }
    get forward(): boolean { return this._buttons[9] > 0.25; }
    get select(): boolean { return this._buttons[8] > 0.25; }
    get start(): boolean { return this._buttons[9] > 0.25; }
    get up(): boolean { return this._buttons[12] > 0.25; }
    get down(): boolean { return this._buttons[13] > 0.25; }
    get left(): boolean { return this._buttons[14] > 0.25; }
    get right(): boolean { return this._buttons[15] > 0.25; }

    // W/S        move forward/backward
    // A/D        move left/right
    // Q/E        bank left/right
    // Z/C        move up/down
    // UP/DOWN    turn up/down
    // LEFT/RIGHT turn left/right
    // R          ACTION 1
    // F          ACTION 2
    // SHIFT      SPEED SLOW/FAST
    // SPACEBAR   
    // 
    get w(): boolean { return this._buttons[12] > 0.25; }
    get s(): boolean { return this._buttons[13] > 0.25; }
    get a(): boolean { return this._buttons[14] > 0.25; }
    get d(): boolean { return this._buttons[15] > 0.25; }
    get c(): boolean { return this._buttons[0] > 0.25; }
    get q(): boolean { return this._buttons[1] > 0.25; }
    get e(): boolean { return this._buttons[2] > 0.25; }
    get z(): boolean { return this._buttons[3] > 0.25; }
    get r(): boolean { return this._buttons[4] > 0.25; }
    get f(): boolean { return this._buttons[5] > 0.25; }

    get upjoy(): boolean { return this.w || this._stick1.y > 0.25; }
    get downjoy(): boolean { return this.s || this._stick1.y < -0.25; }
    get leftjoy(): boolean { return this.a || this._stick1.x < -0.25; }
    get rightjoy(): boolean { return this.d || this._stick1.x > 0.25; }
    get wjoy(): boolean { return this.w || this._stick1.y > 0.25; }
    get sjoy(): boolean { return this.s || this._stick1.y < -0.25; }
    get ajoy(): boolean { return this.a || this._stick1.x < -0.25; }
    get djoy(): boolean { return this.d || this._stick1.x > 0.25; }
    get logo(): boolean { return this._buttons[16] > 0.25; }

    constructor() {
        this.reset();
    }

    update(gp: Gamepad) {
        this._stick1.x = gp.axes[0];
        this._stick1.y = gp.axes[1];
        this._stick2.x = gp.axes[2];
        this._stick2.y = gp.axes[3];
        for (let i = 0; i <= 16 && i < gp.buttons.length; i++) {
            this._buttons[i] = gp.buttons[i].value;
        }

        this._stick1.x += this.a ? -1.0 : 0.0;
        this._stick1.x += this.d ? 1.0 : 0.0;
        this._stick1.y += this.w ? -1.0 : 1.0;
        this._stick1.y += this.s ? 1.0 : 1.0;

        this._connected = true;
    }

    setButton(which: number, state: number) {
        if (which < 0 || which > 16) return;
        return this._buttons[which] = state;
    }

    getAxis(which: number): number {
        switch (which) {
            case 0:
                return this._stick1.x;
            case 1:
                return this._stick1.y;
            case 2:
                return this._stick2.x;
            case 3:
                return this._stick2.y;
        }
        return 0.0;
    }

    getButton(which: number): boolean {
        if (which < 0 || which > 16) return false;
        return this._buttons[which] > 0.25;
    }

    getAxisClear(which: number): number {
        let retval = 0;
        switch (which) {
            case 0:
                retval = this._stick1.x;
                this._stick1.x = 0;
                break;
            case 1:
                retval = this._stick1.y;
                this._stick1.y = 0;
                break;
            case 2:
                retval = this._stick2.x;
                this._stick2.x = 0;
                break;
            case 3:
                retval = this._stick2.y;
                this._stick2.y = 0;
                break;
        }
        return retval;
    }

    getButtonClear(which: number): boolean {
        if (which < 0 || which > 16) return false;
        let state = this._buttons[which] > 0.25;
        this._buttons[which] = 0;
        return state;
    }

    reset() {
        this._connected = false;
        this._stick1.reset(0, 0);
        this._stick2.reset(0, 0);
        for (let i = 0; i <= 16; i++) {
            this._buttons[i] = 0.0;
        }
    }
}

class KeyboardGamepadControl {
    gamepads: Array<SimpleGamepad> = [
        new SimpleGamepad(),
        new SimpleGamepad(),
        new SimpleGamepad(),
        new SimpleGamepad(),
        new SimpleGamepad()];
    keys: Map<string, boolean> = new Map<string, boolean>();

    constructor() {
        let self = this;
        window.addEventListener("keydown", (e) => { self.onkeydown(e); });
        window.addEventListener("keyup", (e) => { self.onkeyup(e); });

    }

    update(dtInSeconds: number) {
        let gamepads = navigator.getGamepads();
        if (!gamepads) {
            gamepads = [null, null, null, null];
        }
        else while (gamepads.length < 4) {
            gamepads.push(null);
        }

        for (let i = 1; i <= 4; i++) {
            let g = gamepads[i - 1];
            if (!g) {
                this.gamepads[i].reset();
            }
            else {
                this.gamepads[i].update(g);
            }
        }

        // update the keyboard
        let kb = this.gamepads[0];
        let stick1x = 0.0;
        let stick1y = 0.0;
        let stick2x = 0.0;
        let stick2y = 0.0;
        let cancelButton = 0.0;
        let okButton = 0.0;
        let fireButton = 0.0;
        let missileButton = 0.0;
        let equipButton = 0.0;
        let menuButton = 0.0;
        let speed = 1.0;
        let lshoulder = 0.0;
        let rshoulder = 0.0;
        let dpadLeft = 0.0;
        let dpadRight = 0.0;
        let dpadUp = 0.0;
        let dpadDown = 0.0;
        if (this.keys.get("Left") || this.keys.get("LeftArrow")) stick1x -= 1.0;
        if (this.keys.get("Right") || this.keys.get("RightArrow")) stick1x += 1.0;
        if (this.keys.get("Up") || this.keys.get("UpArrow")) stick1y += 1.0;
        if (this.keys.get("Down") || this.keys.get("DownArrow")) stick1y -= 1.0;
        if (this.keys.get("a") || this.keys.get("A")) stick2x -= 1.0;
        if (this.keys.get("d") || this.keys.get("D")) stick2x += 1.0;
        if (this.keys.get("w") || this.keys.get("W")) stick2y += 1.0;
        if (this.keys.get("s") || this.keys.get("S")) stick2y -= 1.0;
        if (this.keys.get("i") || this.keys.get("I")) dpadUp = 1.0;
        if (this.keys.get("k") || this.keys.get("K")) dpadDown = 1.0;
        if (this.keys.get("j") || this.keys.get("J")) dpadLeft = 1.0;
        if (this.keys.get("l") || this.keys.get("L")) dpadRight = 1.0;
        if (this.keys.get("Esc") || this.keys.get("Escape")) cancelButton = 1.0;
        if (this.keys.get("Return") || this.keys.get("Enter")) okButton = 1.0;
        if (this.keys.get("Space") || this.keys.get(" ")) missileButton = 1.0;
        if (this.keys.get("Shift")) speed = 2.0;
        if (this.keys.get("e") || this.keys.get("E")) equipButton = 1.0;
        if (this.keys.get("r") || this.keys.get("R")) menuButton = 1.0;
        kb.stick1x = stick1x;
        kb.stick1y = stick1y;
        kb.stick2x = stick2x;
        kb.stick2y = stick2y;
        kb.setButton(BUTTONA, okButton);
        kb.setButton(BUTTONB, cancelButton);
        kb.setButton(BUTTONX, equipButton);
        kb.setButton(BUTTONY, menuButton);
        kb.setButton(BUTTONLSHOULDER1, lshoulder);
        kb.setButton(BUTTONRSHOULDER1, rshoulder);
        kb.setButton(BUTTONSELECT, okButton);
        kb.setButton(BUTTONSTART, cancelButton);
        kb.setButton(BUTTONLEFT, dpadLeft);
        kb.setButton(BUTTONRIGHT, dpadRight);
        kb.setButton(BUTTONUP, dpadUp);
        kb.setButton(BUTTONDOWN, dpadDown);
    }

    getGamepad(which: number): SimpleGamepad | null {
        if (which < 0 || which >= this.gamepads.length)
            return null;
        return this.gamepads[which];
    }

    getKeyboard(): SimpleGamepad {
        return this.gamepads[0];
    }

    static MapButtonToAxis(negativeButton: boolean, positiveButton: boolean, magnitude: number): number {
        let x = 0.0;
        if (negativeButton) x -= magnitude;
        if (positiveButton) x += magnitude;
        return x;
    }

    private classifyKey(key: string): number {
        let button = -1;
        switch (key) {
            case "Left":
            case "ArrowLeft":
            case "a":
            case "A":
                button = 14;
                break;
            case "Right":
            case "ArrowRight":
            case "d":
            case "D":
                button = 15;
                break;
            case "Up":
            case "ArrowUp":
            case "w":
            case "W":
                button = 12;
                break;
            case "Down":
            case "ArrowDown":
            case "s":
            case "S":
                button = 13;
                break;
            case "Esc":
            case "Escape":
                button = 8;
                break;
            case "Return":
            case "Enter":
                button = 9;
                break;
            case "Space":
            case " ":
                button = 0;
                break;
            case "Shift":
            case "LeftShift":
                button = 2;
                break;
            case "e":
            case "E":
                button = 1;
                break;
            case "r":
            case "R":
                button = 3;
                break;
        }
        return button;
    }

    onkeydown(e: KeyboardEvent) {
        let button = this.classifyKey(e.key);
        if (button >= 0) {
            e.preventDefault();
            this.gamepads[0].setButton(button, 1.0);
            this.keys.set(e.key, true);
        }
    }

    onkeyup(e: KeyboardEvent) {
        let button = this.classifyKey(e.key);
        if (button >= 0) {
            e.preventDefault();
            this.gamepads[0].setButton(button, 0.0);
            this.keys.set(e.key, false);
        }
    }
}