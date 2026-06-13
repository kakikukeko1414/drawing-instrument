let artX, artY, artW, artH;

let currentColorName = "red";
let currentColor;

let strokes = [];
let points = [];

let synths = {};
let noiseSynth;

// drum synths
let kickOsc, kickEnv;
let snareNoise, snareEnv;
let hatNoise, hatEnv;

let bpm = 82;
let step = 0;
let lastStepTime = 0;
let stepInterval;

let rhythmOn = true;
let audioStarted = false;

let pentatonic = [0, 3, 5, 7, 10];
let rootFreq = 110;

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);

  setArtboardSize();

  currentColor = color(255, 40, 40);

  stepInterval = (60 / bpm / 4) * 1000;

  createSoundPalette();
  createDrums();
  createPitchPoints();

  background(235);
}

function draw() {
  background(230);

  drawUI();
  drawArtboard();
  drawStrokes();
  drawPitchPoints();

  if (audioStarted && rhythmOn) {
    runDrumLoop();
  }

  if (mouseIsPressed && insideArtboard(mouseX, mouseY)) {
    drawLineAndTrigger();
  }
}

function setArtboardSize() {
  artW = min(width * 0.78, 900);
  artH = min(height * 0.72, 620);
  artX = (width - artW) / 2;
  artY = (height - artH) / 2 + 45;
}

function createSoundPalette() {
  synths.red = new p5.Oscillator("square");
  synths.red.start();
  synths.red.amp(0);

  synths.yellow = new p5.Oscillator("triangle");
  synths.yellow.start();
  synths.yellow.amp(0);

  synths.blue = new p5.Oscillator("sawtooth");
  synths.blue.start();
  synths.blue.amp(0);

  synths.black = new p5.Oscillator("sine");
  synths.black.start();
  synths.black.amp(0);

  noiseSynth = new p5.Noise("white");
  noiseSynth.start();
  noiseSynth.amp(0);
}

function createDrums() {
  kickOsc = new p5.Oscillator("sine");
  kickOsc.start();
  kickOsc.amp(0);

  kickEnv = new p5.Envelope();
  kickEnv.setADSR(0.001, 0.08, 0.0, 0.08);
  kickEnv.setRange(0.16, 0);

  snareNoise = new p5.Noise("white");
  snareNoise.start();
  snareNoise.amp(0);

  snareEnv = new p5.Envelope();
  snareEnv.setADSR(0.001, 0.04, 0.0, 0.08);
  snareEnv.setRange(0.045, 0);

  hatNoise = new p5.Noise("white");
  hatNoise.start();
  hatNoise.amp(0);

  hatEnv = new p5.Envelope();
  hatEnv.setADSR(0.001, 0.02, 0.0, 0.025);
  hatEnv.setRange(0.018, 0);
}

function runDrumLoop() {
  if (millis() - lastStepTime > stepInterval) {
    lastStepTime = millis();

    // 16 step pattern at BPM 82
    // kick: small electronic pulse
    if (step === 0 || step === 7 || step === 10) {
      playKick();
    }

    // snare / clap-like noise
    if (step === 4 || step === 12) {
      playSnare();
    }

    // quiet hi-hat
    if (step % 2 === 0) {
      playHat();
    }

    // tiny glitch hats
    if (step === 3 || step === 11 || step === 15) {
      playHatTiny();
    }

    step = (step + 1) % 16;
  }
}

function playKick() {
  kickOsc.freq(78);
  kickEnv.play(kickOsc);

  setTimeout(() => {
    kickOsc.freq(44);
  }, 25);
}

function playSnare() {
  snareEnv.play(snareNoise);
}

function playHat() {
  hatEnv.setRange(0.018, 0);
  hatEnv.play(hatNoise);
}

function playHatTiny() {
  hatEnv.setRange(0.009, 0);
  hatEnv.play(hatNoise);
}

function createPitchPoints() {
  points = [];

  for (let i = 0; i < 240; i++) {
    let x = random(artX + 20, artX + artW - 20);
    let y = random(artY + 20, artY + artH - 20);

    let scaleIndex = floor(map(y, artY, artY + artH, 24, 0));
    let octave = floor(scaleIndex / pentatonic.length);
    let note = pentatonic[scaleIndex % pentatonic.length];

    let freq = rootFreq * pow(2, octave + note / 12);

    points.push({
      x: x,
      y: y,
      r: random(4, 11),
      freq: freq,
      lastHit: 0,
      alpha: random(22, 95)
    });
  }
}

function drawUI() {
  noStroke();
  fill(20);
  textSize(18);
  text("DRAWING INSTRUMENT", artX, 38);

  textSize(12);
  fill(70);

  let rhythmText = rhythmOn ? "ON" : "OFF";

  text(
    "Click to start audio / 1 Red / 2 Yellow / 3 Blue / 4 White Noise / 5 Black Bass / C Clear / P Randomize Notes / R Rhythm " + rhythmText,
    artX,
    61
  );

  text("BPM " + bpm + " / small electronic drum loop", artX, 79);

  let swatches = [
    ["red", color(255, 40, 40)],
    ["yellow", color(255, 220, 20)],
    ["blue", color(40, 100, 255)],
    ["white", color(255)],
    ["black", color(0)]
  ];

  for (let i = 0; i < swatches.length; i++) {
    let sx = artX + i * 48;
    let sy = 95;

    stroke(0);
    strokeWeight(currentColorName === swatches[i][0] ? 4 : 1);
    fill(swatches[i][1]);
    rect(sx, sy, 32, 32);
  }

  noStroke();
  fill(70);
  textSize(10);
  text("1", artX + 10, 142);
  text("2", artX + 58, 142);
  text("3", artX + 106, 142);
  text("4", artX + 154, 142);
  text("5", artX + 202, 142);

  drawRhythmIndicator(rhythmText);
}

function drawRhythmIndicator(rhythmText) {
  let x = artX + artW - 120;
  let y = 95;

  noStroke();
  fill(rhythmOn ? 20 : 150);
  rect(x, y, 120, 32);

  fill(255);
  textSize(12);
  textAlign(CENTER, CENTER);
  text("RHYTHM " + rhythmText, x + 60, y + 16);
  textAlign(LEFT, BASELINE);
}

function drawArtboard() {
  noStroke();
  fill(245);
  rect(artX, artY, artW, artH);

  noFill();
  stroke(20);
  strokeWeight(1);
  rect(artX, artY, artW, artH);
}

function drawStrokes() {
  for (let s of strokes) {
    stroke(s.col);
    strokeWeight(s.weight);
    line(s.x1, s.y1, s.x2, s.y2);
  }
}

function drawPitchPoints() {
  for (let p of points) {
    let glow = max(0, 255 - (millis() - p.lastHit) * 2);

    noStroke();
    fill(0, p.alpha);
    ellipse(p.x, p.y, p.r * 0.55);

    if (glow > 0) {
      noFill();
      stroke(0, glow);
      strokeWeight(1);
      ellipse(p.x, p.y, p.r * 2.5);
    }
  }
}

function drawLineAndTrigger() {
  if (!insideArtboard(pmouseX, pmouseY)) return;

  let speed = dist(mouseX, mouseY, pmouseX, pmouseY);
  let weight = map(speed, 0, 40, 1, 8, true);

  strokes.push({
    x1: pmouseX,
    y1: pmouseY,
    x2: mouseX,
    y2: mouseY,
    col: currentColor,
    colorName: currentColorName,
    weight: weight
  });

  checkPitchPoints(speed);
}

function checkPitchPoints(speed) {
  for (let p of points) {
    let d = dist(mouseX, mouseY, p.x, p.y);

    if (d < p.r && millis() - p.lastHit > 80) {
      p.lastHit = millis();

      let freq = p.freq;
      let vol = map(speed, 0, 45, 0.035, 0.24, true);

      playColorSound(currentColorName, freq, vol);
    }
  }
}

function playColorSound(name, freq, vol) {
  if (name === "white") {
    noiseSynth.amp(vol * 0.75, 0.01);
    noiseSynth.amp(0, 0.12);
    return;
  }

  let osc = synths[name];

  if (name === "black") {
    osc.freq(freq * 0.45);
    osc.amp(vol * 1.1, 0.01);
    osc.amp(0, 0.24);
  }

  if (name === "red") {
    osc.freq(freq * 2.0);
    osc.amp(vol, 0.005);
    osc.amp(0, 0.08);
  }

  if (name === "yellow") {
    osc.freq(freq * 3.0);
    osc.amp(vol * 0.65, 0.005);
    osc.amp(0, 0.13);
  }

  if (name === "blue") {
    osc.freq(freq * 1.5);
    osc.amp(vol * 0.75, 0.02);
    osc.amp(0, 0.18);
  }
}

function keyPressed() {
  if (key === "1") {
    currentColorName = "red";
    currentColor = color(255, 40, 40);
  }

  if (key === "2") {
    currentColorName = "yellow";
    currentColor = color(255, 220, 20);
  }

  if (key === "3") {
    currentColorName = "blue";
    currentColor = color(40, 100, 255);
  }

  if (key === "4") {
    currentColorName = "white";
    currentColor = color(255);
  }

  if (key === "5") {
    currentColorName = "black";
    currentColor = color(0);
  }

  if (key === "c" || key === "C") {
    strokes = [];
  }

  // P = pitch points randomize
  if (key === "p" || key === "P") {
    createPitchPoints();
  }

  // R = rhythm on / off
  if (key === "r" || key === "R") {
    rhythmOn = !rhythmOn;

    if (rhythmOn) {
      step = 0;
      lastStepTime = millis();
    }
  }
}

function mousePressed() {
  userStartAudio();
  audioStarted = true;
}

function insideArtboard(x, y) {
  return x > artX && x < artX + artW && y > artY && y < artY + artH;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  setArtboardSize();
  createPitchPoints();
}