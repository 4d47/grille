/*
 * This script is written in plain (and hopefully simple) JavaScript.
 * The guiding principles are:
 *
 * - JavaScript only contains function definitions
 * - HTML declares data and bind the events
 *
 * This makes:
 *
 * - The JavaScript file side-effect free.
 *   eg. does not use global data.
 * - The HTML more readable, just looking at the 
 *   source gives you a lot about whats going on.
 *
 * The functions are grouped top down:
 *
 * 1. Event handlers
 * 2. DOM manipulating
 * 3. Purish functions
 */


/*
 * 1. Event handlers
 */

function onChangeStopLastUncheck(e) {
    if (!e.target.form.querySelectorAll('[name="' + e.target.name + '"]:checked').length) {
        e.target.checked = true;
    }
}

function onSubmit(e) {
    e.preventDefault();
    if (!e.target.checkValidity()) {
        return;
    }
    redraw(e.target, document.grid);
    document.grid.ans[0].focus();
}

function onAnsKeyUp(e) {
    var
        form = e.target.form,
        incomplete = false,
        digits = 0;

    // update complete button availability
    form.ans.forEach(n => {
        digits += n.value.length;
        if (n.value === '') {
            incomplete = true;
        }
    });
    form.complete.disabled = incomplete;

    // start chrono on first digit entered
    if (digits === 1 && !form.dataset.chronoId) {
        form.dataset.chronoSecs = 0;
        form.dataset.chronoId = setInterval(() => {
            form.dataset.chronoSecs++;
        }, 1000);
    }
}

function onCompleteClick(e) {
    e.preventDefault();
    clearInterval(e.target.form.dataset.chronoId);
    delete e.target.form.dataset.chronoId;
    correct(e.target.form);
}


/*
 * 2. DOM manipulating
 */

// Redraw grid operation nodes based on user ctrl input
function redraw(ctrl, grid) {
    var
        qty = parseInt(ctrl.elements.qty.value),
        nos = parseNumbers(ctrl.elements.nos.value),
        weighted = weights(parseNumbers('0-10')),
        i,
        node,
        ab, // [a, b]
        prevAb = [],
        opr,
        ops = grid.querySelectorAll('.op'),
        op = document.getElementById('grid-op').content.firstElementChild;

    clearInterval(grid.dataset.chronoId);
    delete grid.dataset.chronoId;

    grid.dataset.currentSticker = pick(grid.dataset.stickers.split(' '));
    grid.dataset.currentAnimation = pick(grid.dataset.animations.split(' '));
    grid.innerHTML = '';

    for (i = 0; i < qty; i++) {
        // pick two numbers, different from previous selection
        do {
            ab =  [pick(weighted), pick(nos)];
        } while (ab.every(v => prevAb.includes(v)));
        prevAb = ab;
        // pick a random operator
        opr = pick(ctrl.querySelectorAll('[name="opr"]:checked')).value;
        // adjust ab based on operation
        if (opr === '÷') {
            // make `weighted` the answer
            ab[0] *= ab[1];
        } else if (opr === '-') {
            // largest number first to never go negative
            ab.sort((a, b) => b - a);
        }
        let node = op.cloneNode(true);
        node.querySelector('.o').innerText = opr;
        node.querySelector('.a').innerText = ab[0];
        node.querySelector('.b').innerText = ab[1];
        node.querySelector('input').value = '';
        node.classList.remove('err');
        grid.appendChild(node);

        // fade in tumble effect
        setTimeout(() => {
            node.style.opacity = 1;
        }, 100 * i);
    }
    grid.appendChild(document.getElementById('grid-footer').content.cloneNode(true));
    setTimeout(() => {
        grid.lastElementChild.style.opacity = 1;
    }, 100 * i);
}

// Mark invalid operations and show score
function correct(grid) {
    var
        ops = grid.querySelectorAll('.op'),
        erroredInput,
        points = 0;

    ops.forEach(op => {
        var
            a = parseInt(op.querySelector('.a').innerText),
            b = parseInt(op.querySelector('.b').innerText),
            ans = parseInt(op.querySelector('input').value),
            opr = op.querySelector('.o').innerText;
        if (calc(a, opr, b) !== ans) {
            op.classList.add('err');
            op.querySelector('input').value = '';
        } else {
            op.classList.remove('err');
            points++;
        }
    });
    if (erroredInput = grid.querySelector('.op.err input')) {
        erroredInput.focus();
    }
    grid.score.innerHTML = points + '/' + ops.length;
    grid.timer.innerText = mmss(grid.dataset.chronoSecs);
    if (points === ops.length) {
        grid.score.innerHTML += '<br><span class="animated ' + grid.dataset.currentAnimation + ' emojis emojis--' + grid.dataset.currentSticker + '"></span>';
    }
}


/*
 * 3. Purish functions
 */

// Parse a `s` comma separated list of numbers
// and ranges to an array of integers.
function parseNumbers(s) {
    var result = [];
    s.split(',').forEach(x => {
        let m = x.match(/(\d+)\s*\-\s*(\d+)/);
        if (m) {
            for (let i = parseInt(m[1]); i <= m[2]; i++) {
                result.push(i);
            }
        } else {
            result.push(parseInt(x));
        }
    });
    // return without duplicates
    return result.filter(indexAt);
}

// Test that the first `v` in `s` is at index `i`
function indexAt(v, i, s) {
    return s.indexOf(v) === i;
}

// Perform elementry arithmetic
function calc(a, opr, b) {
    switch (opr) {
        case '×': return a * b;
        case '÷': return a / b;
        case '+': return a + b;
        case '-': return a - b;
        default: throw 'Unsupported operation';
    }
}

// Weight out easy numbers so they appear 1/4
function weights(nos) {
    return nos.flatMap(v => new Array([0,1,10].includes(v) ? 1 : 4).fill(v));
}

// Pick a random value out of an array
function pick(a) {
    return a[Math.floor(Math.random() * a.length)];
}

// Randomize array element in place
function shuffle(a) {
  var currentIndex = a.length, temporaryValue, randomIndex;

  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    temporaryValue = a[currentIndex];
    a[currentIndex] = a[randomIndex];
    a[randomIndex] = temporaryValue;
  }
}

// Format `secs` to mm:ss
function mmss(secs) {
    return new Date(1000 * secs).toISOString().substr(14, 5);
}

