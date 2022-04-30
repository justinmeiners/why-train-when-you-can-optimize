// Created by: Justin Meiners (2022)
function sumOfSquares(distances) {
    return distances.reduce((total, term) => total + term * term, 0);
};

function lineDistance2(points, line) {
    const normal = line.direction.orthogonal();
    const distances = points.map(p => Vec.sub(p, line.origin).dot(normal));
    return sumOfSquares(distances);
};
function varsToLine(vars) {
    return {
        origin: new Vec(vars[0], vars[1]),
        direction: Vec.fromAngle(vars[2])
    }
}

function makeLineCost(points) {
    return vars => lineDistance2(points, varsToLine(vars));
};

function tryLineFit(points) {
    const centroid = Vec.centroid(points);

    const initial = [ centroid.x, centroid.y, 0 ];
    const result = multivarOptimize(initial, makeLineCost(points), {
        maxIterations: 1000
    });

    return {
        cost: result.cost,
        path: lineToDrawing(points, varsToLine(result.vars))
    };
};

function lineToDrawing(points, line) {
    const distances = points.map(p => Vec.sub(p, line.origin).dot(line.direction));
    const start = Math.min.apply(Math, distances);
    const end = Math.max.apply(Math, distances);

    return [
        Vec.add(line.origin, Vec.scale(line.direction, start)),
        Vec.add(line.origin, Vec.scale(line.direction, end))
    ];
};
function circleDistance(point, circle) {
    var v = Vec.sub(point, circle.origin);
    return Math.abs(v.len() - circle.radius);
};

function circleDistance2(points, circle) {
    return sumOfSquares(points.map(p => circleDistance(p, circle)));
};

function varsToCircle(vars) {
    return {
        origin: new Vec(vars[0], vars[1]),
        radius: vars[2]
    }
};

function makeCircleCost(points) {
    return vars => circleDistance2(points, varsToCircle(vars));
};

function tryCircleFit(points) {
    const centroid = Vec.centroid(points);
    const [minPoint, maxPoint] = Vec.bounds(points);

    const initial = [
        centroid.x, centroid.y,
        Math.max(maxPoint.x - minPoint.x, maxPoint.y - minPoint.y)
    ];
    const result = multivarOptimize(initial, makeCircleCost(points), {
        maxIterations: 1000
    });

    const circle = varsToCircle(result.vars);
    if (!circleMatches(points, circle)) return null;

    return {
        cost: result.cost,
        circle: circle
    };
};

function circleMatches(path, circle) {
    const circumference = 2.0 * Math.PI * circle.radius;
    if (circumference < 10) return false;

    const ratio = Vec.pathLen(path) / circumference;
    return Math.abs(ratio - 1.0) < 0.15;
};
function simpleRectDistance(point, size) {
    function classify(x, min, max) {
        if (x < min) {
            return -1;
        } else if (x > max) {
            return 1;
        } else {
            return 0;
        }
    }
    const sideX = classify(point.x, 0, size.x);
    const sideY = classify(point.y, 0, size.y);
    switch (sideX) {
    case -1:
        switch (sideY) {
        case -1: return point.len();
        case 0:  return -point.x;
        case 1:  return Vec.dist(point, new Vec(0, size.y));
        }
    case 0:
        switch (sideY) {
        case -1: return -point.y;
        case 0:  return Math.min(point.x, point.y, size.x - point.x, size.y - point.y);
        case 1:  return point.y - size.y;
        }
    case 1:
        switch (sideY) {
        case -1: return Vec.dist(point, new Vec(size.x, 0));
        case 0:  return point.x - size.x;
        case 1:  return Vec.dist(point, size);
        }
    }
};
function simpleRectDistances2(points, size) {
    return sumOfSquares(points.map(p => simpleRectDistance(p, size)));
};

function buildTransform(translate, angle) {
    const A = new AffineTransform();
    A.t = translate;
    A.m = Matrix.fromAngle(angle);
    return A;
};

function orientedRectDistances2(points, rect) {
    const A = buildTransform(rect.translate, rect.angle);
    const B = AffineTransform.inverse(A);

    const localPoints = points.map(p => B.transform(p));
    return simpleRectDistances2(localPoints, rect.size);
};

function varsToRect(vars) {
    return {
        translate: new Vec(vars[0], vars[1]),
        size: new Vec(vars[2], vars[3]),
        angle: vars[4]
    };
};

function makeRectCost(points) {
    return vars => orientedRectDistances2(points, varsToRect(vars));
};

function tryRectFit(points) {
    const [ minPoint, maxPoint ] = Vec.bounds(points);

    const initial = [
        minPoint.x, minPoint.y,
        maxPoint.x - minPoint.x, maxPoint.y - minPoint.y,
        0
    ];

    const result = multivarOptimize(initial, makeRectCost(points), {
        maxIterations: 1000
    });

    const rect = varsToRect(result.vars);
    if (!rectMatches(points, rect)) return null;

    return {
        cost: result.cost,
        path: rectToDrawing(rect)
    };
};
function rectMatches(path, rect) {
    if (rect.size.x < 6 || rect.size.y < 6) {
        return false;
    }

    const length = rect.size.x * 2 + rect.size.y * 2;
    const ratio = Vec.pathLen(path) / length;
    return Math.abs(ratio - 1.0) < 0.15;
};
function rectToDrawing(rect) {
    const points = [
        new Vec(0, 0),
        new Vec(rect.size.x, 0),
        new Vec(rect.size.x, rect.size.y),
        new Vec(0, rect.size.y),
        new Vec(0, 0)
    ];

    const A = buildTransform(rect.translate, rect.angle);
    return points.map(p => A.transform(p));
};

var fitFunctions = [
    tryLineFit,
    tryCircleFit,
    tryRectFit
];

function tryShapeFit(path) {
    const results = fitFunctions.map(f => f(path)).filter(x => x);
    const best = results.reduce((a, b) => b.cost < a.cost ? b : a);

    function acceptableTolerance(path) {
        const perPointTolerance = 6.0;
        return path.length * perPointTolerance * perPointTolerance;
    }

    if (best.cost < acceptableTolerance(path)) {
        return best;
    }
};
