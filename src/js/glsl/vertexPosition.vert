transformed = rotateVector(rotate, transformed);
transformed.xyz += cubicBezier(aPosition.xyz, aControl0.xyz, aControl1.xyz, aPosition.xyz, tProgress);
