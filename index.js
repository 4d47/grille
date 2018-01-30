//
// - onclick selection le nombre (pour corriger plus facilement)
// - dans les moins ne pas aller sous zero
// - remember from value to reload (always work on addition)
// - mettre chrono automatiquement sous le score (en petit)
// 

var
    form = document.querySelector('form'),
    timer = document.querySelector('#timer'),
    secs = document.querySelector('#secs'),
    score = document.querySelector('#score'),
    stickers = ['😏', '😎', '😉', '😊', '😋', '😺', '★', '✿'],
    stickersColors = ['#FF851B', '#0074D9', '#FF4136', '#F012BE',
                      '#B10DC9', '#2ECC40', '#3D9970', '#FFDC00'],
    chronoId,
    chronoSecs;



// parse a `s` comma separated list of numbers
// and ranges to an array of integers.
function parseNumbers(s) {
    result = [];
    s.split(',').forEach(function(x) {
        if (m = x.match(/(\d+)\-(\d+)/)) {
            for (i = parseInt(m[1]); i <= m[2]; i++) {
                result.push(i);
            }
        } else {
            result.push(parseInt(x));
        }
    });
    return result.filter(function(v, i, s) { return s.indexOf(v) === i; });
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
        good,
        ops = document.querySelectorAll('.op');

    for (i = 0; i < ops.length; i++) {
        var
            a = parseInt(ops[i].querySelector('.a').innerHTML),
            o = ops[i].querySelector('.o').innerHTML,
            b = parseInt(ops[i].querySelector('.b').innerHTML),
            ans = parseInt(ops[i].querySelector('input').value);
        if (calc(a, o, b) != ans) {
            ops[i].classList.add('err');
            ops[i].querySelector('input').value = '';
        } else {
            ops[i].classList.remove('err');
        }
    }

    good = ops.length - document.querySelectorAll('.err').length;
    score.innerHTML = good + '/' + ops.length;
    if (good === ops.length) {
        score.innerHTML += '<span style="font-size:1.8em;vertical-align:text-top;color:' + pick(stickersColors) + '">' + pick(stickers) + '</span>';
    }

}

// weight out easy numbers so they dont appear so often
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
        footer = document.querySelector('footer'),
        o = document.querySelector('#o').value,
        q = parseInt(document.querySelector('#q').value),
        xs = parseNumbers(document.querySelector('#n').value),
        ten = weight(parseNumbers(o == '÷' ? '0-12' : '0-10')),
        ab,
        prev = '',
        ops = document.querySelectorAll('.op'),
        op = ops[0];

    op.style.opacity = 0;
    score.innerHTML = '';

    for (i = 0; i < ops.length; i++) {
        main.removeChild(ops[i]);
    }
    for (i = 0; i < q; i++) {
        do {
            ab =  [pick(ten), pick(xs)];
        } while (ab.toString() == prev.toString());
        prev = ab.toString();
        if (o == '÷') {
            ab[0] *= ab[1];
        } else if (o == '-') {
            ab.sort(function (a, b) {
            });
        } else {
            ab = shuffle(ab);
        }
        node = op.cloneNode(true);
        node.querySelector('.o').innerHTML = o;
        node.querySelector('.a').innerHTML = ab[0];
        node.querySelector('.b').innerHTML = ab[1];
        node.querySelector('input').value = '';
        node.classList.remove('err');
        main.insertBefore(node, footer);
        (function(node) {
            setTimeout(function() {
                node.style.opacity = 1;
            }, 100 * i);
        })(node);
    }
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

function onChronoClick() {
    chronoId ? chronoStop() : chronoStart();
}

function onCompleteClick() {
    chronoStop();
    correct();
}

function onPrint(e) {
    e.preventDefault();
    window.print();
}

function onSubmit(e) {
    e.preventDefault();
    if (!form.checkValidity()) {
        return;
    }
    chronoStop();
    redraw();
}

// initialize event handlers
form.addEventListener('submit', onSubmit);
document.querySelector('#timer button').addEventListener('click', onChronoClick); 
document.querySelector('form .print').addEventListener('click', onPrint);
document.querySelector('footer button').addEventListener('click', onCompleteClick); 
document.addEventListener('DOMContentLoaded', redraw);
