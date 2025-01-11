const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
context.scale(20, 20); // масштабируем всё для удобства работы

const arena = createMatrix(10, 20); // создаём игровое поле
let score = 0;
let level = 1;
let dropCounter = 0;
let dropInterval = 1000; // начальная скорость падения

let lastTime = 0;

// Матрица для игрового поля
function createMatrix(width, height) {
    const matrix = [];
    while (height--) {
        matrix.push(new Array(width).fill(0));
    }
    return matrix;
}

// Генерация фигур
function createPiece(type) {
    switch (type) {
        case 'T': return [[0, 1, 0], [1, 1, 1], [0, 0, 0]];
        case 'O': return [[1, 1], [1, 1]];
        case 'L': return [[0, 0, 1], [1, 1, 1], [0, 0, 0]];
        case 'J': return [[1, 0, 0], [1, 1, 1], [0, 0, 0]];
        case 'I': return [[0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0]];
        case 'S': return [[0, 1, 1], [1, 1, 0], [0, 0, 0]];
        case 'Z': return [[1, 1, 0], [0, 1, 1], [0, 0, 0]];
    }
}

// Отображение матрицы на экране
function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = 'hsl(' + (value * 50) + ', 70%, 50%)'; // цвета в зависимости от значения
                context.fillRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
}

// Объединение матрицы игрока с игровым полем
function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

// Проверка столкновений
function collide(arena, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; y++) {
        for (let x = 0; x < m[y].length; x++) {
            if (m[y][x] !== 0 &&
                (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

// Перемещение игрока
function playerMove(offset) {
    player.pos.x += offset;
    if (collide(arena, player)) {
        player.pos.x -= offset;
    }
}

// Поворот фигуры
function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; y++) {
        for (let x = 0; x < y; x++) {
            [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
        }
    }
    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

// Поворот фигуры игрока
function playerRotate(dir) {
    rotate(player.matrix, dir);
    if (collide(arena, player)) {
        rotate(player.matrix, -dir);
    }
}

// Сброс позиции и генерация новой фигуры
function resetPlayer() {
    const pieces = 'ILJOTSZ';
    player.matrix = createPiece(pieces[Math.floor(pieces.length * Math.random())]);
    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);
    if (collide(arena, player)) {
        alert('Игра окончена! Очки: ' + score);
        arena.forEach(row => row.fill(0)); // очищаем поле
        score = 0;
        level = 1;
        document.getElementById('score').innerText = score;
        document.getElementById('level').innerText = level;
    }
}

// Удаление линий и увеличение очков
function arenaSweep() {
    let rowCount = 1;
    outer: for (let y = arena.length - 1; y >= 0; y--) {
        for (let x = 0; x < arena[y].length; x++) {
            if (arena[y][x] === 0) {
                continue outer;
            }
        }

        // Анимация исчезновения линии
        for (let i = 0; i < arena[y].length; i++) {
            arena[y][i] = 0;
            context.clearRect(i * 20, y * 20, 20, 20);  // очистка линии
        }

        setTimeout(() => {
            const row = arena.splice(y, 1)[0].fill(0);
            arena.unshift(row);
            score += rowCount * 10; // начисляем очки за линию
            rowCount *= 2;
            document.getElementById('score').innerText = score;
        }, 100); // задержка для анимации исчезновения линии

        y++; // чтобы не пропустить строку
    }
}

// Игровой цикл
function update(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if (dropCounter > dropInterval - level * 50) {
        playerDrop();
    }

    draw(); // отрисовка
    requestAnimationFrame(update); // обновление кадра
}

// Падение фигуры
function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player); // фигура сливается с полем
        resetPlayer();
        arenaSweep();
    }
}

// Рисование поля и фигур
function draw() {
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height); // очищаем экран
    drawMatrix(arena, { x: 0, y: 0 });
    drawMatrix(player.matrix, player.pos); // рисуем фигуру
}

const player = {
    pos: { x: 0, y: 0 },
    matrix: createPiece('T'),
};

// Управление клавишами
document.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') {
        playerMove(-1);
    } else if (event.key === 'ArrowRight') {
        playerMove(1);
    } else if (event.key === 'ArrowDown') {
        playerDrop();
    } else if (event.key === 'ArrowUp') {
        playerRotate(1);
    }
});

resetPlayer();

function start() {
    // Сброс состояния игры
    score = 0;
    level = 1;
    //dropInterval = 1000; // сброс скорости падения
    arena.forEach(row => row.fill(0)); // очищаем поле
    document.getElementById('score').innerText = score;
    document.getElementById('level').innerText = level;

    resetPlayer(); // начинаем с новой фигуры
    lastTime = 0;  // сброс времени
    update(); // запускаем игровой цикл
}

// Привязываем кнопку "Старт" к функции
document.getElementById('startButton').addEventListener('click', start);

//update(); // запуск игры
