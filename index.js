
var
    timer = document.querySelector('#timer'),
    secs = document.querySelector('#secs'),
    score = document.querySelector('#score'),
    chronoId,
    chronoSecs;


// parse a `s` comma separated list of numbers
// and ranges to an array of integers.
function parseNumbers(s) {
    xs = s.split(',').map(function(x) {
        if (m = x.match(/(\d+)\-(\d+)/)) {
            var r = [];
            for (i = parseInt(m[1]); i <= m[2]; i++) {
                r.push(i);
            }
            return r;
        } else {
            return parseInt(x);
        }
    });
    return _.uniq(_.flatten(xs));
}

// perform elementry arithmetic
function calc(a, o, b) {
    if (o == '×') return a * b;
    if (o == '÷') return a / b;
    if (o == '+') return a + b;
    if (o == '-') return a - b;
    throw 'Unsupported operation';
}

// check every operations and toggle err class for unequal values
function correct() {
    var
        i,
        ops = document.querySelectorAll('.op');

    for (i = 0; i < ops.length; i++) {
        var
        a = parseInt(ops[i].querySelector('.a').innerHTML),
            o = ops[i].querySelector('.o').innerHTML,
            b = parseInt(ops[i].querySelector('.b').innerHTML),
            ans = parseInt(ops[i].querySelector('input').value);
        ops[i].classList.toggle('err', calc(a, o, b) != ans);
    }

    score.innerHTML = (ops.length - document.querySelectorAll('.err').length) + '/' + ops.length;

}

// give uneasy number four chances to sample
function weight(xs) {
    return xs.reduce(function (acc, value, index, array) {
        return acc.concat([0,1,10].includes(value) ? [value] : [value, value, value, value]);
    }, []);
}

// redraw operations based on user form input
function redraw() {
    var
        i, node,
        main = document.querySelector('main'),
        o = document.querySelector('#o').value,
        q = document.querySelector('#q').value,
        n = document.querySelector('#n').value,
        xs = parseNumbers(n),
        ten = weight(parseNumbers('0-10')),
        ab,
        end = document.querySelector('.end'),
        ops = document.querySelectorAll('.op'),
        op = ops[0];

    score.innerHTML = '';

    for (i = 0; i < ops.length; i++) {
        main.removeChild(ops[i]);
    }
    for (i = 0; i < q; i++) {
        node = op.cloneNode(true),
            node.querySelector('.o').innerHTML = o;
        // Add weight to lower chances of 0,1,2,10
        ab = _.shuffle([_.sample(xs), _.sample(ten)]);
        node.querySelector('.a').innerHTML = ab[0];
        node.querySelector('.b').innerHTML = ab[1];
        node.querySelector('input').value = '';
        node.classList.remove('err');
        main.insertBefore(node, end);
    }
}

// format `secs` to mm:ss
function mmss(secs) {
    return new Date(1000 * secs).toISOString().substr(14, 5);
}

function chronoStop() {
    timer.className = 'play';
    clearInterval(chronoId);
    chronoId = null;
}

function chronoStart() {
    timer.className = 'stop';
    chronoSecs = 0;
    chronoId = setInterval(function() {
        secs.innerHTML = mmss(++chronoSecs);
    }, 1000);
}

// toggle chronometer state
function chronoClick() {
    chronoId ? chronoStop() : chronoStart();
}

function endClick() {
    chronoStop();
    correct();
}


// initialize event handlers
document.querySelector('#timer button').addEventListener('click', chronoClick); 
document.querySelector('#ctrl button').addEventListener('click', redraw); 
document.querySelector('.end button').addEventListener('click', endClick); 
document.onload = redraw;
document.addEventListener('DOMContentLoaded', redraw);
