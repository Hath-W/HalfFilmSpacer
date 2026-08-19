Open `index.html` in a modern browser. Drag several scans into the image library (or choose them in one file selection), then add each scan to the left or right queue. The first scan from each queue forms the preview. Adjust their order or rotate individual queued scans, tune the center film gap, and select **Export queue** to download every complete pair.
# HalfFrameSpacer

A lightweight, browser-based tool for joining two half-frame film scans into one full-frame image. It runs locally in the browser: uploaded images never leave the computer.

## Use

Open `index.html` in a modern browser. Replace either sample frame, rotate it when needed, tune the center film gap, and select **Export merged frame**.

The tool defaults to the geometry of the provided `SampleFullFrameFilm.jpg`:

* each landscape crop is rotated 90 degrees counterclockwise into a portrait frame;
* the two portrait frames are placed side by side along their long edges;
* the black, fine-grained center gap is 9.8% of the long edge (196 px for the 2005 px sample height).

## Features

* Local JPEG, PNG, and WebP loading
* Independent clockwise/counterclockwise frame rotation
* Proportional frame fitting for differently sized scans
* Adjustable black film gap with optional fine grain
* JPEG and PNG export
