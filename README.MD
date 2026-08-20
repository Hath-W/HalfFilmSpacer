# HalfFrameSpacer

A lightweight, browser-based tool for joining two half-frame film scans into one full-frame image. It runs locally in the browser: uploaded images never leave the computer.

## Use

Open `index.html` in a modern browser. Drag scans into the image library (or choose several in one file selection), then add each scan to the left or right queue. Use the previous and next arrows above the merged preview to inspect every complete pair. Queue entries outlined in orange match the pair on screen. Adjust order or orientation as needed, tune the center film gap, and select **Export queue** to download all complete pairs.

The tool defaults to the geometry of the provided `SampleFullFrameFilm.jpg`:

* each landscape crop is rotated 90 degrees counterclockwise into a portrait frame;
* the two portrait frames are placed side by side along their long edges;
* the black, fine-grained center gap is 9.8% of the long edge (196 px for the 2005 px sample height).

## Features

* Local multi-file JPEG, PNG, and WebP library with drag-and-drop loading
* Two ordered pairing queues with previous/next pair preview navigation
* Independent clockwise/counterclockwise rotation for every queued scan
* Proportional frame fitting for differently sized scans
* Adjustable black film gap with optional fine grain
* JPEG and PNG export for every complete queue pair
