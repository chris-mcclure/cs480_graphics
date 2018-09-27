/// <reference path="../library/gte/GTE.ts"/>

class MyEntity {
    transform = Matrix4.makeIdentity();
    name: string = "unknown";
    sprites: number[] = [];
    alive = 0;

    constructor() { }
}