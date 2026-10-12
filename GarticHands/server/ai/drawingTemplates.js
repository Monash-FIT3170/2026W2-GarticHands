/**
 * Hand-made fallback drawings for the AI drawer, in the same shape format the
 * LLM produces (100 x 75 grid, origin top-left, y down). Used when no LLM is
 * configured or the model's reply is unusable — see `drawer.js`.
 *
 * Each template is deliberately Pictionary-simple: an outline plus the one or
 * two features that make it guessable. Templates flagged as `accessory` are
 * worn by another subject ("a cat wearing a crown") and get drawn on top of it.
 */

function accessory(shapes) {
  shapes.accessory = true;
  return shapes;
}

const line = (x1, y1, x2, y2) => ({ type: 'line', x1, y1, x2, y2 });
const circle = (x, y, r) => ({ type: 'circle', x, y, r });
const ellipse = (x, y, rx, ry) => ({ type: 'ellipse', x, y, rx, ry });
const rect = (x, y, w, h) => ({ type: 'rect', x, y, w, h });
const arc = (x, y, r, start, end) => ({ type: 'arc', x, y, r, start, end });
const poly = (points, closed = false) => ({ type: 'polyline', points, closed });

const TEMPLATES = {
  cat: [
    circle(50, 40, 20),
    poly([
      [35, 28],
      [37, 10],
      [48, 21],
    ]),
    poly([
      [52, 21],
      [63, 10],
      [65, 28],
    ]),
    circle(43, 36, 2),
    circle(57, 36, 2),
    poly(
      [
        [48, 43],
        [52, 43],
        [50, 46],
      ],
      true,
    ),
    line(28, 44, 43, 46),
    line(28, 50, 43, 49),
    line(57, 46, 72, 44),
    line(57, 49, 72, 50),
  ],
  dog: [
    circle(50, 40, 17),
    ellipse(32, 40, 5, 13),
    ellipse(68, 40, 5, 13),
    circle(44, 36, 2),
    circle(56, 36, 2),
    ellipse(50, 45, 4, 3),
    arc(50, 47, 7, 20, 160),
    poly([
      [50, 54],
      [50, 60],
    ]),
  ],
  house: [
    rect(25, 36, 50, 34),
    poly([
      [19, 38],
      [50, 10],
      [81, 38],
    ]),
    rect(44, 51, 12, 19),
    rect(30, 43, 9, 9),
    rect(61, 43, 9, 9),
  ],
  sun: [
    circle(50, 37, 14),
    line(50, 17, 50, 9),
    line(50, 57, 50, 65),
    line(30, 37, 22, 37),
    line(70, 37, 78, 37),
    line(36, 23, 30, 17),
    line(64, 23, 70, 17),
    line(36, 51, 30, 57),
    line(64, 51, 70, 57),
  ],
  tree: [rect(45, 48, 10, 24), circle(50, 29, 21), line(10, 72, 90, 72)],
  car: [
    poly(
      [
        [12, 52],
        [12, 40],
        [28, 38],
        [37, 24],
        [64, 24],
        [74, 38],
        [88, 41],
        [88, 52],
      ],
      true,
    ),
    line(50, 24, 50, 38),
    line(32, 38, 72, 38),
    circle(30, 53, 8),
    circle(70, 53, 8),
  ],
  fish: [
    ellipse(44, 37, 26, 15),
    poly(
      [
        [68, 37],
        [88, 23],
        [88, 51],
      ],
      true,
    ),
    circle(29, 33, 2),
    arc(42, 37, 9, 300, 420),
    line(10, 68, 90, 68),
  ],
  flower: [
    circle(50, 24, 6),
    circle(50, 12, 6),
    circle(61, 20, 6),
    circle(58, 32, 6),
    circle(42, 32, 6),
    circle(39, 20, 6),
    line(50, 38, 50, 72),
    poly([
      [50, 58],
      [62, 50],
      [64, 56],
      [50, 60],
    ]),
  ],
  star: [
    poly(
      [
        [50, 8],
        [58, 29],
        [80, 29],
        [62, 42],
        [69, 64],
        [50, 51],
        [31, 64],
        [38, 42],
        [20, 29],
        [42, 29],
      ],
      true,
    ),
  ],
  heart: [
    arc(38, 28, 12, 150, 360),
    arc(62, 28, 12, 180, 390),
    poly([
      [27.6, 34],
      [50, 64],
      [72.4, 34],
    ]),
  ],
  robot: [
    rect(36, 8, 28, 20),
    rect(42, 14, 5, 5),
    rect(53, 14, 5, 5),
    line(45, 23, 55, 23),
    line(50, 8, 50, 3),
    circle(50, 2, 2),
    rect(32, 30, 36, 28),
    line(32, 36, 20, 48),
    line(68, 36, 80, 48),
    line(42, 58, 42, 72),
    line(58, 58, 58, 72),
  ],
  rocket: [
    poly(
      [
        [42, 58],
        [42, 24],
        [50, 6],
        [58, 24],
        [58, 58],
      ],
      true,
    ),
    circle(50, 30, 5),
    poly([
      [42, 46],
      [32, 60],
      [42, 58],
    ]),
    poly([
      [58, 46],
      [68, 60],
      [58, 58],
    ]),
    poly([
      [44, 60],
      [46, 70],
      [50, 64],
      [54, 70],
      [56, 60],
    ]),
  ],
  boat: [
    poly(
      [
        [15, 50],
        [85, 50],
        [72, 63],
        [28, 63],
      ],
      true,
    ),
    line(50, 50, 50, 10),
    poly(
      [
        [50, 12],
        [76, 46],
        [50, 46],
      ],
      true,
    ),
    poly([
      [8, 70],
      [20, 66],
      [32, 70],
      [44, 66],
      [56, 70],
      [68, 66],
      [80, 70],
      [92, 66],
    ]),
  ],
  cloud: [
    arc(32, 42, 12, 90, 270),
    arc(50, 32, 16, 180, 360),
    arc(68, 42, 12, 270, 450),
    line(32, 54, 68, 54),
    line(36, 60, 33, 68),
    line(50, 60, 47, 68),
    line(64, 60, 61, 68),
  ],
  moon: [
    arc(48, 37, 22, 60, 300),
    arc(66, 37, 20, 110, 250),
    poly(
      [
        [76, 14],
        [78, 19],
        [83, 20],
        [78, 22],
        [76, 27],
        [74, 22],
        [69, 20],
        [74, 19],
      ],
      true,
    ),
  ],
  apple: [
    ellipse(50, 44, 22, 21),
    line(50, 23, 53, 11),
    poly([
      [53, 15],
      [64, 9],
      [62, 17],
      [53, 15],
    ]),
  ],
  person: [
    circle(50, 15, 8),
    line(50, 23, 50, 48),
    line(35, 32, 65, 32),
    line(50, 48, 39, 68),
    line(50, 48, 61, 68),
  ],
  snowman: [
    circle(50, 58, 15),
    circle(50, 34, 11),
    circle(50, 16, 8),
    circle(47, 14, 1),
    circle(53, 14, 1),
    poly([
      [50, 17],
      [57, 18],
      [50, 19],
    ]),
    line(40, 33, 26, 25),
    line(60, 33, 74, 25),
  ],
  cup: [
    poly([
      [30, 25],
      [33, 65],
      [62, 65],
      [65, 25],
    ]),
    line(30, 25, 65, 25),
    arc(66, 42, 9, 270, 450),
    poly([
      [42, 18],
      [44, 12],
      [42, 6],
    ]),
    poly([
      [52, 18],
      [54, 12],
      [52, 6],
    ]),
  ],
  bird: [
    ellipse(48, 38, 18, 12),
    circle(66, 28, 7),
    circle(68, 27, 1),
    poly(
      [
        [72, 27],
        [80, 29],
        [72, 31],
      ],
      true,
    ),
    arc(46, 34, 10, 20, 160),
    poly([
      [30, 36],
      [20, 30],
      [22, 40],
      [30, 40],
    ]),
    line(44, 50, 42, 60),
    line(52, 50, 54, 60),
  ],
  mountain: [
    poly([
      [5, 68],
      [35, 18],
      [52, 46],
      [65, 28],
      [95, 68],
    ]),
    poly([
      [27, 31],
      [32, 34],
      [35, 30],
      [39, 34],
      [43, 31],
    ]),
    line(5, 68, 95, 68),
  ],
  umbrella: [
    arc(50, 36, 30, 180, 360),
    poly([
      [20, 36],
      [30, 32],
      [40, 36],
      [50, 32],
      [60, 36],
      [70, 32],
      [80, 36],
    ]),
    line(50, 32, 50, 64),
    arc(45, 64, 5, 0, 180),
  ],
  ball: [circle(50, 38, 22), arc(30, 38, 22, -50, 50), arc(70, 38, 22, 130, 230)],
  crown: accessory([
    poly(
      [
        [25, 60],
        [25, 30],
        [37, 45],
        [50, 25],
        [63, 45],
        [75, 30],
        [75, 60],
      ],
      true,
    ),
    circle(25, 27, 3),
    circle(50, 22, 3),
    circle(75, 27, 3),
  ]),
  hat: accessory([rect(36, 22, 28, 32), line(22, 54, 78, 54), line(36, 46, 64, 46)]),
};

/** Words (and close synonyms) that map onto a template. */
const KEYWORDS = {
  cat: 'cat',
  kitten: 'cat',
  kitty: 'cat',
  dog: 'dog',
  puppy: 'dog',
  house: 'house',
  home: 'house',
  cottage: 'house',
  sun: 'sun',
  sunny: 'sun',
  tree: 'tree',
  forest: 'tree',
  car: 'car',
  taxi: 'car',
  fish: 'fish',
  goldfish: 'fish',
  flower: 'flower',
  rose: 'flower',
  daisy: 'flower',
  star: 'star',
  heart: 'heart',
  love: 'heart',
  robot: 'robot',
  rocket: 'rocket',
  spaceship: 'rocket',
  boat: 'boat',
  ship: 'boat',
  sailboat: 'boat',
  cloud: 'cloud',
  rain: 'cloud',
  moon: 'moon',
  night: 'moon',
  apple: 'apple',
  person: 'person',
  man: 'person',
  woman: 'person',
  boy: 'person',
  girl: 'person',
  kid: 'person',
  snowman: 'snowman',
  cup: 'cup',
  mug: 'cup',
  coffee: 'cup',
  tea: 'cup',
  teapot: 'cup',
  bird: 'bird',
  mountain: 'mountain',
  hill: 'mountain',
  umbrella: 'umbrella',
  ball: 'ball',
  football: 'ball',
  crown: 'crown',
  king: 'crown',
  queen: 'crown',
  hat: 'hat',
};

module.exports = { TEMPLATES, KEYWORDS };
