// Created by Justin Meiners (2022)
// License: MIT

"use strict";
function Sim() {
    this.canvas = document.getElementById('main-canvas');
    this.ctx = this.canvas.getContext('2d', { alpha: false });

    this.canvas.onmousedown = this.mouseDown.bind(this);
    this.canvas.onmouseup = this.mouseUp.bind(this);
    this.canvas.onmouseout = this.mouseOut.bind(this);
    this.canvas.onmousemove = this.mouseMove.bind(this);

    this.shapes = [];
};


document.getElementById("clear-button").onclick = function() {
    sim.shapes = [];
    drawSim();
};

function getMousePos(canvas, e) {
    var rect = canvas.getBoundingClientRect();
    return new Vec(e.clientX - rect.left, e.clientY - rect.top);
}

Sim.prototype.mouseDown = function(e) {
    var mp = getMousePos(this.canvas, e);
    this.path = [];
    this.path.push(mp);
    this.dragging = true;

    e.preventDefault();
};

Sim.prototype.mouseMove = function(e) {
    var mp = getMousePos(this.canvas, e);

    if (this.dragging) {
        var lp = this.path[this.path.length - 1];

        if (!mp.inCircle(lp, 6)) {
            this.path.push(mp);
            drawSim();
        }
    }
}

Sim.prototype.mouseUp = function(e) {
    if (!this.dragging) return;
    var mp = getMousePos(this.canvas, e);
    this.path.push(mp);
    this.endDrag(e);
}

Sim.prototype.mouseOut = function(e) {
    if (!this.dragging) return;
    this.endDrag(e);
}

Sim.prototype.endDrag = function(e) {
    var corrected = tryShapeFit(this.path);
    if (corrected) {
        this.shapes.push(corrected);
    } else {
        this.shapes.push({
            path: this.path
        });
    }

    this.path = [];
    this.dragging = false;
    drawSim();
}
function drawSim() {
    var ctx = sim.ctx;
    ctx.lineWidth = 1;
    clearCanvas(ctx, sim.canvas);

    ctx.lineWidth = 2;
    ctx.strokeStyle = "#000000";
    for (var i = 0; i < sim.shapes.length; ++i) {
        var s = sim.shapes[i];
        if (s.path) {
            drawPath(ctx, s.path);
        } else if (s.circle) {
            ctx.beginPath();
            ctx.arc(s.circle.origin.x, s.circle.origin.y, s.circle.radius, 0.0, Math.PI * 2.0);
            ctx.closePath();
            ctx.stroke();
        } else if (s.ellipse) {
            ctx.beginPath();
            ctx.ellipse(s.ellipse.origin.x, s.ellipse.origin.y, s.ellipse.size.x, s.ellipse.size.y, 0, 0.0, Math.PI * 2.0);
            ctx.closePath();
            ctx.stroke();
        }
    }

    ctx.lineWidth = 3;
    ctx.strokeStyle = "#FF0000";
    if (sim.path) {
        drawPath(ctx, sim.path);
    }
}

function clearCanvas(ctx, canvas) {
    ctx.fillStyle = '#C1FFC9';
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.closePath();
    return ctx.fill();
}

function drawPath(ctx, path) {
    if (path.length === 0) return;
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (var i = 1; i < path.length; ++i) {
        ctx.lineTo(path[i].x, path[i].y);
    }
    ctx.stroke();
}

var sim = new Sim();
drawSim();
