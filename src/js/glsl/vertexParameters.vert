uniform float uProgress;
uniform vec2 uSize;
uniform sampler2D map;
uniform sampler2D map2;
attribute vec4 aPosition;
attribute vec4 aEndPosition;
attribute vec4 aDelayDuration;
attribute vec4 aControl0;
attribute vec4 aControl1;
const float interval = 10.;
const float delay = 1.;
const float speed = 80.;
const float minWeight = 0.3;
const float fallSpeed = 4.;
const float xSpeed = 0.03;