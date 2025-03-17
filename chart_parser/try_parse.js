const { console } = require("inspector");
const fs = require("fs");


function parsePath(d, transform_matrix) {
    const commands = d.match(/[a-z][^a-z]*/gi);
    if (!commands) {
    return [];
    }

    let x = 0, y = 0;
    let startX = 0, startY = 0; // To handle 'Z' command
    const points = [];

    for (const command of commands) {
    const type = command[0];
    const args = command
        .slice(1)
        .trim()
        .split(/[\s,]+/)
        .map(Number);

    switch (type) {
        case "M":
        x = args[0];
        y = args[1];
        startX = x;
        startY = y;
        break;
        case "m":
        x += args[0];
        y += args[1];
        startX = x;
        startY = y;
        break;
        case "L":
        x = args[0];
        y = args[1];
        break;
        case "l":
        x += args[0];
        y += args[1];
        break;
        case "H":
        x = args[0];
        break;
        case "h":
        x += args[0];
        break;
        case "V":
        y = args[0];
        break;
        case "v":
        y += args[0];
        break;
        case "C":
        x = args[4];
        y = args[5];
        break;
        case "c":
        x += args[4];
        y += args[5];
        break;
        case "S":
        x = args[2];
        y = args[3];
        break;
        case "s":
        x += args[2];
        y += args[3];
        break;
        case "Q":
        x = args[2];
        y = args[3];
        break;
        case "q":
        x += args[2];
        y += args[3];
        break;
        case "T":
        x = args[0];
        y = args[1];
        break;
        case "t":
        x += args[0];
        y += args[1];
        break;
        case "A":
        x = args[5];
        y = args[6];
        break;
        case "a":
        x += args[5];
        y += args[6];
        break;
        case "Z":
        case "z":
        x = startX;
        y = startY;
        break;
        default:
        console.warn("Unknown command:", type);
    }

    // 确保每个命令处理后都添加当前点
    if (typeof x === 'number' && !isNaN(x) && typeof y === 'number' && !isNaN(y)) {
        // 可以选择是否检查重复点
        if (!points.length || points[points.length - 1].x !== x || points[points.length - 1].y !== y) {
        points.push({ x, y });
        }
    }
    }

    // 应用变换矩阵
    let absolute_points = points.map(point => {
    const { x, y } = point;
    const newX = transform_matrix[0][0] * x + transform_matrix[0][1] * y + transform_matrix[0][2];
    const newY = transform_matrix[1][0] * x + transform_matrix[1][1] * y + transform_matrix[1][2];
    return { x: newX, y: newY };
    });

    return absolute_points;
}

const d = "M38.1 472.1L47.6 479.5L57 472.1L66.4 457.3L75.8 464.7L85.2 464.7L94.6 464.7L104 464.7L113.4 472.1L122.8 486.9L132.2 501.7L141.6 494.3L151 486.9L160.5 494.3L169.9 479.5L179.3 479.5L188.7 479.5L198.1 479.5L207.5 486.9L216.9 486.9L226.3 486.9L235.7 486.9L245.1 486.9L254.5 486.9L263.9 494.3L273.4 509.1L282.8 509.1L292.2 509.1L301.6 509.1L311 509.1L320.4 509.1L329.8 509.1L339.2 509.1L348.6 509.1L358 509.1L367.4 509.1L376.8 509.1L386.3 509.1L395.7 509.1L405.1 509.1L414.5 509.1L423.9 509.1L433.3 509.1L442.7 509.1L452.1 509.1L461.5 509.1L470.9 509.1L480.3 509.1L489.7 509.1L499.2 509.1L508.6 509.1L518 509.1L527.4 509.1L536.8 509.1L546.2 509.1L555.6 509.1L565 509.1L574.4 509.1L583.8 509.1L593.2 509.1L602.6 509.1L612.1 509.1L621.5 509.1L630.9 509.1L640.3 509.1L649.7 509.1L659.1 509.1L668.5 509.1L677.9 509.1L687.3 509.1L696.7 509.1L696.725 509.08L38.144000000000005 509.08"

const matrixArray = [
    [2.1, 0, 285],
    [0, 2.1, 189],
    [0, 0, 1]
  ];


let points = parsePath(d, matrixArray)

console.log(points)

fs.writeFileSync(
    `tmp/points.json`,
    JSON.stringify({"points": points}, null, 2)
);

