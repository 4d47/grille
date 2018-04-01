/*
 * This script only defines functions.
 *
 * First the event handlers (using the globals),
 * then the primary operations (manipulating the DOM)
 * and finally the utilities (purish functions).
 *
 * # Concepts:
 *
 * - Readable document
 * - Persisting state in the DOM
 * - Avoid selectors when possible and favor named HTML elements
 *
 * see: [Stimulus](https://stimulusjs.org)
 *
 * # TOC
 *
 * Event handlers
 *   onChangeStopLastUncheck
 *   onCtrlSubmit
 *   onPrintClick
 *   onChronoClick
 *   onCompleteClick
 *
 * Operations
 *   redraw
 *   correct
 *   chronoStop
 *   chronoStart
 *
 * Utilities
 *   parseNumbers
 *   indexAt
 *   calc
 *   weight
 *   pick
 *   shuffle
 *   mmss
 */


/*
 * Event handlers
 */

// Reset target checked when checked count goes to zero
function onChangeStopLastUncheck(e) {
    if (e.target.form.querySelectorAll('[name="' + e.target.name + '"]:checked').length == 0) {
        e.target.checked = true;
    }
}

function onCtrlSubmit(e) {
    e.preventDefault();
    if (!document.ctrl.checkValidity()) {
        return;
    }
    chronoStop(document.ctrl.lastElementChild);
    redraw(document.ctrl, document.grid);
}

function onPrintClick(e) {
    e.preventDefault();
    window.print();
}

function onChronoClick(e) {
    var timer = document.ctrl.lastElementChild;
    e.preventDefault();
    if (timer.dataset.chronoId) {
        chronoStop(timer);
    } else {
        chronoStart(timer, document.ctrl.secs);
    }
}

function onCompleteClick(e) {
    e.preventDefault();
    chronoStop(document.ctrl.lastElementChild);
    correct(document.grid);
}


/*
 * Operations
 */

// Redraw grid operation nodes based on user ctrl input
function redraw(ctrl, grid) {
    var
        qty = parseInt(ctrl.elements.qty.value),
        nos = parseNumbers(ctrl.elements.nos.value),
        xs  = weight(parseNumbers('0-10')),
        i,
        node,
        ab,
        prevAb = '',
        opr,
        ops = grid.querySelectorAll('.op'),
        op = ops[0];

    op.style.opacity = 0;
    grid.score.innerHTML = '';
    grid.dataset.currentSticker = pick(grid.dataset.stickers.split(' '));
    ops.forEach(grid.removeChild.bind(grid));

    for (i = 0; i < qty; i++) {
        // pick two numbers, different from previous selection
        do {
            ab =  [pick(xs), pick(nos)];
        } while (ab.toString() === prevAb.toString());
        prevAb = ab.toString();
        // pick a random
        opr = pick(ctrl.querySelectorAll('[name="opr"]:checked')).value;
        // adjust ab based on operation
        if (opr === '÷') {
            // make `xs` the answer
            ab[0] *= ab[1];
        } else if (opr === '-') {
            // largest number first to never go negative
            ab.sort(function (a, b) {
                return b - a;
            });
        } else {
            shuffle(ab);
        }
        node = op.cloneNode(true);
        node.querySelector('.o').innerHTML = opr;
        node.querySelector('.a').innerHTML = ab[0];
        node.querySelector('.b').innerHTML = ab[1];
        node.querySelector('input').value = '';
        node.classList.remove('err');
        grid.insertBefore(node, grid.lastElementChild);
        (function(node) {
            // fade in tumble effect
            setTimeout(function() {
                node.style.opacity = 1;
            }, 100 * i);
        })(node);
    }
}

// Mark invalid operations and show score
function correct(grid) {
    var
        ops = grid.querySelectorAll('.op'),
        input,
        points = 0;

    ops.forEach(function(op) {
        var
            a = parseInt(op.querySelector('.a').innerHTML),
            b = parseInt(op.querySelector('.b').innerHTML),
            ans = parseInt(op.querySelector('input').value),
            opr = op.querySelector('.o').innerHTML;
        if (calc(a, opr, b) !== ans) {
            op.classList.add('err');
            op.querySelector('input').value = '';
        } else {
            points++;
            op.classList.remove('err');
        }
    });
    if (input = grid.querySelector('.op.err input')) {
        input.focus();
    }
    grid.score.innerHTML = points + '/' + ops.length;
    if (points === ops.length) {
        grid.score.innerHTML += '<br><span class="emojis emojis--' + grid.dataset.currentSticker + '"></span>';
    }
}

// Puts the timer in stop state
function chronoStop(timer) {
    timer.className = 'play';
    clearInterval(timer.dataset.chronoId);
    delete timer.dataset.chronoId;
}

// Puts the timer in start state
function chronoStart(timer, secs) {
    var
        chronoSecs = 0,
        tick = function() {
            secs.innerHTML = mmss(chronoSecs++);
        };
    tick();
    timer.className = 'stop';
    timer.dataset.chronoId = setInterval(tick, 1000);
}


/*
 * Utilities
 */

// Parse a `s` comma separated list of numbers
// and ranges to an array of integers.
function parseNumbers(s) {
    result = [];
    s.split(',').forEach(function(x) {
        if (m = x.match(/(\d+)\s*\-\s*(\d+)/)) {
            for (i = parseInt(m[1]); i <= m[2]; i++) {
                result.push(i);
            }
        } else {
            result.push(parseInt(x));
        }
    });
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

// Weight out easy numbers so they dont appear so often
function weight(nos) {
    return nos.reduce(function (acc, value, index, array) {
        return acc.concat([0,1,10].includes(value) ? [value] : [value, value, value, value]);
    }, []);
}

// Pick a random value out of an array
function pick(a) {
    return a[Math.floor(Math.random() * a.length)];
}

// Randomize array element in place
function shuffle(a) {
  var currentIndex = a.length, temporaryValue, randomIndex;

  while (0 !== currentIndex) {
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
