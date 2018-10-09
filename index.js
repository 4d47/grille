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
 *   onAnsKeyUp
 *   onCompleteClick
 *
 * Operations
 *   redraw
 *   correct
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
    document.grid.reset();
    redraw(document.ctrl, document.grid);
    document.grid.ans[0].focus();
}

function onGridReset(e) {
    clearInterval(document.grid.dataset.chronoId);
    delete document.grid.dataset.chronoId;
}

function onAnsKeyUp(e) {
    var
      disabled = false,
      len = 0;
    document.grid.ans.forEach(function(n) {
        len += n.value.length;
        if (n.value === '') {
            disabled = true;
        }
    });
    if (len === 1 && !document.grid.dataset.chronoId) {
        document.grid.dataset.chronoSecs = 0;
        document.grid.dataset.chronoId = setInterval(function() {
            document.grid.dataset.chronoSecs++;
        }, 1000);
    }
    document.grid.complete.disabled = disabled;
}

function onCompleteClick(e) {
    e.preventDefault();
    clearInterval(document.grid.dataset.chronoId);
    delete document.grid.dataset.chronoId;
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
    grid.complete.disabled = true;
    grid.score.innerHTML = '';
    grid.timer.innerHTML = '';
    grid.dataset.currentSticker = pick(grid.dataset.stickers.split(' '));
    grid.dataset.currentAnimation = pick(grid.dataset.animations.split(' '));

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
    grid.timer.innerHTML = mmss(grid.dataset.chronoSecs);
    if (points === ops.length) {
        grid.score.innerHTML += '<br><span class="animated ' + grid.dataset.currentAnimation + ' emojis emojis--' + grid.dataset.currentSticker + '"></span>';
    }
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

