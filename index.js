
var
    main = document.querySelector('main'),
    footer = document.querySelector('footer'),
    timer = document.querySelector('#timer'),
    secs = document.querySelector('#secs'),
    score = document.querySelector('#score');


// initialize event handlers
timer.querySelector('button').addEventListener('click', onChronoClick); 
footer.querySelector('button').addEventListener('click', onCompleteClick); 
document.addEventListener('DOMContentLoaded', redraw);
document.form.addEventListener('submit', onFormSubmit);
document.form.querySelector('.print').addEventListener('click', onPrintClick);
document.form.opr.forEach(function(el) {
    // prevent last checkbox to be unchecked
    el.addEventListener('change', function(e) {
        if (document.form.querySelectorAll(':checked').length === 0) {
            el.checked = true;
        }
    });
});

// redraw operation nodes based on user form input
function redraw() {
    var
        qty = parseInt(document.form.elements.qty.value),
        nos = parseNumbers(document.form.elements.nos.value),
        xs  = weight(parseNumbers('0-10')),
        i,
        node,
        ab,
        prevAb = '',
        opr,
        ops = main.querySelectorAll('.op'),
        op = ops[0];

    op.style.opacity = 0;
    score.innerHTML = '';
    main.dataset.sticker = pick(main.dataset.stickers.split(','));
    ops.forEach(main.removeChild.bind(main));

    for (i = 0; i < qty; i++) {
        do {
            ab =  [pick(xs), pick(nos)];
        } while (ab.toString() === prevAb.toString());
        prevAb = ab.toString();
        opr = pick(document.form.querySelectorAll(':checked')).value;
        // opr = pick(oprSelector.selected).value;
        if (opr === '÷') {
            // make `xs` the answer
            ab[0] *= ab[1];
        } else if (opr === '-') {
            // largest number first to never go negative
            ab.sort(function (a, b) {
                return b - a;
            });
        } else {
            ab = shuffle(ab);
        }
        node = op.cloneNode(true);
        node.querySelector('.o').innerHTML = opr;
        node.querySelector('.a').innerHTML = ab[0];
        node.querySelector('.b').innerHTML = ab[1];
        node.querySelector('input').value = '';
        node.classList.remove('err');
        main.insertBefore(node, footer);
        (function(node) {
            // fade in tumble effect
            setTimeout(function() {
                node.style.opacity = 1;
            }, 100 * i);
        })(node);
    }
}

// mark invalid operations and show score
function correct() {
    var
        ops = main.querySelectorAll('.op'),
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
    if (input = main.querySelector('.op.err input')) {
        input.focus();
    }
    score.innerHTML = points + '/' + ops.length;
    if (points === ops.length) {
        score.innerHTML += '<br><span class="emojis emojis--' + main.dataset.sticker + '"></span>';
    }
}

// parse a `s` comma separated list of numbers
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

// test that the first `v` in `s` is at index `i`
function indexAt(v, i, s) {
    return s.indexOf(v) === i;
}

// perform elementry arithmetic
function calc(a, opr, b) {
    switch (opr) {
        case '×': return a * b;
        case '÷': return a / b;
        case '+': return a + b;
        case '-': return a - b;
        default: throw 'Unsupported operation';
    }
}

// weight out easy numbers so they dont appear so often
function weight(nos) {
    return nos.reduce(function (acc, value, index, array) {
        return acc.concat([0,1,10].includes(value) ? [value] : [value, value, value, value]);
    }, []);
}

// pick a random value out of an array
function pick(a) {
    return a[Math.floor(Math.random() * a.length)];
}

// randomize array element
function shuffle(a) {
  var currentIndex = a.length, temporaryValue, randomIndex;

  while (0 !== currentIndex) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    temporaryValue = a[currentIndex];
    a[currentIndex] = a[randomIndex];
    a[randomIndex] = temporaryValue;
  }

  return a;
}

// format `secs` to mm:ss
function mmss(secs) {
    return new Date(1000 * secs).toISOString().substr(14, 5);
}

// puts the chrono widget in stop state
function chronoStop() {
    timer.className = 'play';
    clearInterval(timer.dataset.chronoId);
    delete timer.dataset.chronoId;
}

// puts the chrono widget in start state
function chronoStart() {
    var
      chronoSecs = 0,
      tick = function() {
        secs.innerHTML = mmss(chronoSecs++);
      };
    tick();
    timer.className = 'stop';
    timer.dataset.chronoId = setInterval(tick, 1000);
}

function onChronoClick() {
    timer.dataset.chronoId ? chronoStop() : chronoStart();
}

function onCompleteClick() {
    chronoStop();
    correct();
}

function onPrintClick(e) {
    e.preventDefault();
    window.print();
}

function onFormSubmit(e) {
    e.preventDefault();
    if (!document.form.checkValidity()) {
        return;
    }
    chronoStop();
    redraw();
}
