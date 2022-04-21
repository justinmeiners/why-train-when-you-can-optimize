// Created by Justin Meiners (2022)
// License: MIT
"use strict";

function lerp(a, b, t) {
    return (1 - t) * a + t * b;
};

function clamp(low, high, t) {
    if (t < low) {
        return low; 
    } else if (t > high) {
        return high;
    } else {
        return t;
    }
};
function Vec(x, y) {
    this.x = x;
    this.y = y;
};

Vec.fromAngle = function(angle) {
    return new Vec(Math.cos(angle), Math.sin(angle));
};

Vec.zero = function() {
    return new Vec(0, 0);
};

Vec.prototype.copy = function() {
    return new Vec(this.x, this.y);
};

Vec.prototype.dot = function(b) {
    return this.x * b.x + this.y * b.y;
};

Vec.prototype.lenSqr = function() {
    return this.dot(this);
};

Vec.prototype.len = function() {
    return Math.sqrt(this.lenSqr());
};

Vec.prototype.orthogonal = function() {
    return new Vec(-this.y, this.x);
};

Vec.prototype.add = function(b) {
    this.x += b.x;
    this.y += b.y;
    return this;
};

Vec.prototype.negate = function() {
    this.x = -this.x;
    this.y = -this.y;
    return this;
};

Vec.prototype.sub = function(b) {
    this.x -= b.x;
    this.y -= b.y;
    return this;
};

Vec.prototype.normalized = function() {
    return Vec.scale(this, 1 / this.len())
};

Vec.add = function(a, b) {
    return a.copy().add(b);
};

Vec.sub = function(a, b) {
    return a.copy().sub(b);
};

Vec.scale = function(a, s) {
    return new Vec(a.x * s, a.y * s);
};

Vec.distSqr = function(a, b) {
    return Vec.sub(a, b).lenSqr();
};

Vec.dist = function(a, b) {
    return Math.sqrt(Vec.distSqr(a, b));
};

Vec.negate = function(v) {
    return v.copy().negate();
};

Vec.min = function(a, b) {  
    return new Vec(Math.min(a.x, b.x), Math.min(a.y, b.y));
};

Vec.max = function(a, b) {
    return new Vec(Math.max(a.x, b.x), Math.max(a.y, b.y));
};

Vec.prototype.inBounds = function(min, max) {
    return this.x >= min.x && this.y >= min.y &&
           this.x <= max.x && this.y <= max.y;
};

Vec.prototype.inCircle = function(o, r) {
    return Vec.distSqr(this, o) < r * r;
};

Vec.lerp = function(a, b, t) {
    return new Vec(lerp(a.x, b.x, t), lerp(a.y, b.y, t));
};

Vec.centroid = function(points) {
    var sum = points.reduce(function(acc, x) {
        return Vec.add(acc, x);
    });

    return Vec.scale(sum, 1 / points.length);
};

Vec.pathLen = function(path) {
    var sum = 0;
    var i;
    for (i = 1; i < path.length; ++i) {
        sum += Vec.dist(path[i], path[i-1]);
    }
    return sum;
};

Vec.bounds = function(points) {
    return [points.reduce(Vec.min), points.reduce(Vec.max)];
};
function Matrix() {
    this.m = new Float64Array(2 * 2);
};

Matrix.from = function(a, b, c, d) {
    var A = new Matrix();
    A.m[0] = a; A.m[1] = b;
    A.m[2] = c; A.m[3] = d;
    return A;
};

Matrix.fromScale = function(sx, sy) {
    return Matrix.from(sx, 0, 0, sy);
};

Matrix.fromAngle = function(angle) {
    var x = Math.cos(angle);
    var y = Math.sin(angle);
    return Matrix.from(x, -y, y, x);
};

Matrix.prototype.index = function(row, col) {
    return row * 2 + col;
};

Matrix.prototype.get = function(row, col) {
    return this.m[this.index(row, col)];
};

Matrix.prototype.set = function(row, col, x) {
    this.m[this.index(row, col)] = x;
};

Matrix.prototype.transform = function(v) {
    return new Vec(
        this.m[0] * v.x + this.m[1] * v.y, 
        this.m[2] * v.x + this.m[3] * v.y
    );
};

Matrix.prototype.add = function(other) {
    for (var i = 0; i < 4; ++i) {
        this.m[i] += other.m[i];
    };
    return this;
};

Matrix.prototype.scale = function(scale) {
    for (var i = 0; i < 4; ++i) {
        this.m[i] *= scale;
    };
    return this;
};

Matrix.mul = function(A, B) {
    return Matrix.from(
        A.m[0] * B.m[0] + A.m[1] * B.m[2],
        A.m[0] * B.m[1] + A.m[1] * B.m[3],
        A.m[2] * B.m[0] + A.m[3] * B.m[2],
        A.m[2] * B.m[1] + A.m[3] * B.m[3]
    )
};

Matrix.prototype.det = function() {
    return this.m[0] * this.m[3] - this.m[1] * this.m[2];
};

Matrix.inverse = function(A) {
    var s = 1.0 / A.det();
    return Matrix.from(A.m[3], -A.m[1], -A.m[2], A.m[0]).scale(s);
};

Matrix.prototype.copy = function() {
    var copy = new Matrix();
    copy.m.set(this.m);
    return copy;
};
function AffineTransform() {
    this.m = Matrix.from(1, 0, 0, 1);
    this.t = new Vec(0, 0);
};

AffineTransform.prototype.transform = function(v) {
    return this.m.transform(v).add(this.t);
};

AffineTransform.inverse = function(a) {
    var b = new AffineTransform();
    b.m = Matrix.inverse(a.m);
    b.t = b.m.transform( a.t.copy().negate());
    return b;
};

function makeAckley(a, b, c) {
    return function(vars) {
        var sumSquares = vars.reduce(function(total, x) {
            return total + x * x;
        }, 0);

        var sumCos = vars.reduce(function(total, x) {
            return total + Math.cos(x * c);
        }, 0);

        var n = vars.length;
        return -a * Math.exp(-b * Math.sqrt(sumSquares /  n)) - Math.exp(sumCos / n) + a + Math.exp(1);
    };
};

function testOptimizer() {
    var f = makeAckley(20.0, 0.2, 2.0 * Math.PI);

    var options = {
        debug: true,
        maxIterations: 100,
        tolerance: 0.001
    };

    console.log(multivarOptimize([-2.1, -3.04, 4.5], f, options));
};

function multivarOptimize(initial, costFunc, options) {
    var maxIterations = options.maxIterations || 10000;
    var tolerance = options.tolerance || 0.001;

    function predicate(iterations, image) {
        return iterations > maxIterations || image < tolerance;
    };

    var n = initial.length;

    function guessSizes(initial) {
        var sizes = new Float64Array(n);
        for (var j = 0; j < n; ++j) {
            sizes[j] = (0.05 * Math.abs(initial[j])) + 0.00025;
        }
        return sizes;
    };

    var simplex = new Simplex(n);
    simplex.positionAround(initial, guessSizes(initial));
    return simplex.optimize(costFunc, predicate, options);
};

function Simplex(n) {
    this.dimension = n;
    this.vertices = []
    for (var i = 0; i < (n + 1); ++i) {
        this.vertices.push(new SimplexVertex(n));
    }
};

function SimplexVertex(n) {
    this.point = new Float64Array(n);
    this.image = 0;
};

SimplexVertex.prototype.swap = function(other) {
    var ptemp = this.point;
    var itemp = this.image;

    this.point = other.point;
    this.image = other.image;

    other.point = ptemp;
    other.image = itemp;
};

SimplexVertex.prototype.copyFrom = function(other) {
    this.point.set(other.point);
    this.image = other.image;
};

SimplexVertex.prototype.swapWith = function(other) {
    var ptemp = this.point;
    var itemp = this.image;

    this.point = other.point;
    this.image = other.image;
    other.point = ptemp;
    other.image = itemp;
};

Simplex.prototype.positionAround = function(point, sizes) {
    var n = this.dimension;
    for (var i = 0; i < (n + 1); ++i) {
        for (var j = 0; j < n; ++j) {
            this.vertices[i].point[j] = point[j] + ((i - 1 == j) ? sizes[j] : 0.0);
        }
    }
};

Simplex.prototype.sort = function() {
    this.vertices.sort(function(a, b) {
        return a.image - b.image;
    });
};

Simplex.prototype.getCentroid = function(output) {
    var n = this.dimension;
    // last point is not included
    for (var j = 0; j < n; ++j) {
        var x = this.vertices[0].point[j];
        for (var i = 1; i < n; ++i) {
            x += this.vertices[i].point[j];
        }
        output.point[j] = x / n;
    }
};

Simplex.prototype.getNewPoint = function(centroid, lambda, output) {
    var n = this.dimension;
    for (var j = 0; j < n; ++j) {
        output.point[j] = (1.0 + lambda) * centroid.point[j] - lambda * this.vertices[n].point[j];
    };
};

Simplex.prototype.shrink = function(sigma) {
    var n = this.dimension;
    for (var i = 1; i < (n + 1); ++i) {
        for (var j = 0; j < n; ++j) {
            var x = this.vertices[0].point[j];
            this.vertices[i].point[j] = x + sigma * (this.vertices[i].point[j] - x);
        }
    }
};

Simplex.prototype.computeVertexImages = function(costFunc) {
    for (var i = 0; i < (this.dimension + 1); ++i) {
        this.vertices[i].image = costFunc(this.vertices[i].point);
    }
    this.sort();
};

Simplex.prototype.optimize = function(costFunc, stopPredicate, options) {
    var rho = options.rho || 1.0;
    var chi = options.chi || 2.0;
    var gamma = options.gamma || 0.5;
    var sigma = options.sigma || 0.5;
    var debug = options.debug == undefined ? false : options.debug;

    var n = this.dimension;

    var pointR = new SimplexVertex(n); 
    var pointE = new SimplexVertex(n); 
    var pointC = new SimplexVertex(n); 
    var centroid = new SimplexVertex(n); 

    this.computeVertexImages(costFunc);
    this.getCentroid(centroid);

    var iterations = 1;

    while (!stopPredicate(iterations, this.vertices[0].image)) {
        var shrink = false;        
        this.getNewPoint(centroid, rho, pointR);
        pointR.image = costFunc(pointR.point);

        if (pointR.image < this.vertices[0].image) {
            this.getNewPoint(centroid, rho * chi, pointE);
            pointE.image = costFunc(pointE.point);

            if (pointE.image < pointR.image) {
                if (debug) console.log("expand");
                this.vertices[n].copyFrom(pointE);
            } else {
                if (debug) console.log("reflect");
                this.vertices[n].copyFrom(pointR);
            }
        } else {
            if (pointR.image < this.vertices[n - 1].image) {
                if (debug) console.log("reflect");
                this.vertices[n].copyFrom(pointR);
            } else {
                if (pointR.image < this.vertices[n].image) {
                    this.getNewPoint(centroid, rho * gamma, pointC);
                    pointC.image = costFunc(pointC.point);

                    if (pointC.image <= pointR.image) {
                        if (debug) console.log("contract out");
                        this.vertices[n].copyFrom(pointC);
                    } else {
                        if (debug) console.log("shrink");
                        shrink = true;
                    }
                } else {
                    this.getNewPoint(centroid, -gamma, pointC);
                    pointC.image = costFunc(pointC.point);

                    if (pointC.image < this.vertices[n].image) {
                        if (debug) console.log("contract inside");
                        this.vertices[n].copyFrom(pointC);
                    } else {
                        if (debug) console.log("shrink");
                        shrink = true;
                    }
                }
            }
        }

        if (shrink) {
            this.shrink(sigma);
            this.computeVertexImages(costFunc);
        } else {
            for (var i = n - 1; i >= 0 && this.vertices[i + 1].image < this.vertices[i].image; i--) {
                this.vertices[i + 1].swapWith(this.vertices[i]);
            }

        }
        this.getCentroid(centroid);
        ++iterations;

        if (debug) console.log("best: ", this.vertices[0].point.join(", "), "score: ", this.vertices[0].image);
    };

    return {
        vars: this.vertices[0].point,
        cost: this.vertices[0].image,
        iterations: iterations
    };
};
