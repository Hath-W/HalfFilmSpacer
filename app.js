const state = {
  left: { image: null, rotation: -90, name: "Sample 01" },
  right: { image: null, rotation: -90, name: "Sample 02" },
  library: new Map(),
  queues: { left: [], right: [] },
  nextId: 1,
};

const elements = {
  canvas: document.querySelector("#previewCanvas"),
  status: document.querySelector("#status"),
  gap: document.querySelector("#gapRange"),
  gapValue: document.querySelector("#gapValue"),
  grain: document.querySelector("#grainToggle"),
  quality: document.querySelector("#qualityRange"),
  qualityValue: document.querySelector("#qualityValue"),
  format: document.querySelector("#formatSelect"),
  export: document.querySelector("#exportButton"),
  exportCount: document.querySelector("#exportCount"),
  size: document.querySelector("#sizeReadout"),
  libraryGrid: document.querySelector("#libraryGrid"),
  libraryDrop: document.querySelector("#libraryDrop"),
  libraryInput: document.querySelector("#libraryInput"),
  queues: { left: document.querySelector("#leftQueue"), right: document.querySelector("#rightQueue") },
  queueCounts: { left: document.querySelector("#leftQueueCount"), right: document.querySelector("#rightQueueCount") },
};

function activeFrame(side) {
  const queued = state.queues[side][0];
  if (!queued) return null;
  const asset = state.library.get(queued.id);
  return asset && { ...asset, rotation: queued.rotation };
}

function activePair() {
  const left = activeFrame("left");
  const right = activeFrame("right");
  return left && right ? { left, right } : null;
}

function sourceSize(frame) {
  const turns = ((frame.rotation % 180) + 180) % 180;
  return turns ? { width: frame.image.height, height: frame.image.width } : { width: frame.image.width, height: frame.image.height };
}

function composition(pair = activePair()) {
  if (!pair) return null;
  const left = sourceSize(pair.left);
  const right = sourceSize(pair.right);
  const height = Math.max(left.height, right.height);
  const leftWidth = Math.round(left.width * height / left.height);
  const rightWidth = Math.round(right.width * height / right.height);
  const gap = Math.round(height * Number(elements.gap.value) / 100);
  return { height, leftWidth, rightWidth, gap, width: leftWidth + gap + rightWidth };
}

function drawRotated(context, frame, x, y, width, height) {
  const source = sourceSize(frame);
  context.save();
  context.translate(x + width / 2, y + height / 2);
  context.rotate(frame.rotation * Math.PI / 180);
  context.scale(width / source.width, height / source.height);
  context.drawImage(frame.image, -frame.image.width / 2, -frame.image.height / 2);
  context.restore();
}

function drawGap(context, layout) {
  const x = layout.leftWidth;
  context.fillStyle = "#080908";
  context.fillRect(x, 0, layout.gap, layout.height);
  if (!elements.grain.checked || !layout.gap) return;
  const imageData = context.getImageData(x, 0, layout.gap, layout.height);
  for (let index = 0; index < imageData.data.length; index += 4) {
    const tone = Math.random() > 0.975 ? 35 + Math.random() * 34 : Math.random() * 12;
    imageData.data[index] = tone;
    imageData.data[index + 1] = tone;
    imageData.data[index + 2] = tone;
    imageData.data[index + 3] = 255;
  }
  context.putImageData(imageData, x, 0);
}

function render(canvas = elements.canvas, pair = activePair(), updateReadout = canvas === elements.canvas) {
  const layout = composition(pair);
  if (!layout) return null;
  canvas.width = layout.width;
  canvas.height = layout.height;
  const context = canvas.getContext("2d", { alpha: false, willReadFrequently: true });
  context.fillStyle = "#080908";
  context.fillRect(0, 0, layout.width, layout.height);
  drawRotated(context, pair.left, 0, 0, layout.leftWidth, layout.height);
  drawGap(context, layout);
  drawRotated(context, pair.right, layout.leftWidth + layout.gap, 0, layout.rightWidth, layout.height);
  if (updateReadout) elements.size.textContent = `${layout.width} x ${layout.height} PX`;
  return layout;
}

function pairCount() {
  return Math.min(state.queues.left.length, state.queues.right.length);
}

function fileLabel(name) {
  return name.length > 17 ? `${name.slice(0, 14)}...` : name;
}

function renderLibrary() {
  elements.libraryGrid.replaceChildren();
  state.library.forEach((asset) => {
    const item = document.createElement("article");
    item.className = "library-item";
    item.innerHTML = `<img src="${asset.image.src}" alt="${asset.name}"><div class="library-hover-preview" aria-hidden="true"><img src="${asset.image.src}" alt=""></div><button class="library-remove" type="button" title="Remove ${asset.name} from library" aria-label="Remove ${asset.name} from library">×</button><div class="library-add"><button type="button" data-add="left" title="Add ${asset.name} to left queue" aria-label="Add ${asset.name} to left queue">L</button><button type="button" data-add="right" title="Add ${asset.name} to right queue" aria-label="Add ${asset.name} to right queue">R</button></div>`;
    item.querySelectorAll("[data-add]").forEach((button) => button.addEventListener("click", () => addToQueue(button.dataset.add, asset.id)));
    item.querySelector(".library-remove").addEventListener("click", () => removeFromLibrary(asset.id));
    elements.libraryGrid.append(item);
  });
}

function renderQueues() {
  ["left", "right"].forEach((side) => {
    const queue = state.queues[side];
    const list = elements.queues[side];
    elements.queueCounts[side].textContent = queue.length;
    list.replaceChildren();
    if (!queue.length) {
      list.innerHTML = '<li class="queue-empty">Add a scan</li>';
      return;
    }
    queue.forEach((entry, index) => {
      const asset = state.library.get(entry.id);
      const item = document.createElement("li");
      item.className = "queue-item";
      item.innerHTML = `<img class="queue-thumb" src="${asset.image.src}" alt=""><div><span class="queue-name">${fileLabel(asset.name)}</span><div class="queue-actions"><button type="button" data-action="up" title="Move earlier" aria-label="Move ${asset.name} earlier">↑</button><button type="button" data-action="down" title="Move later" aria-label="Move ${asset.name} later">↓</button><button type="button" data-action="rotate-left" title="Rotate counterclockwise" aria-label="Rotate ${asset.name} counterclockwise">↶</button><button type="button" data-action="rotate-right" title="Rotate clockwise" aria-label="Rotate ${asset.name} clockwise">↷</button><button type="button" data-action="remove" title="Remove from queue" aria-label="Remove ${asset.name} from queue">×</button></div></div>`;
      item.querySelectorAll("[data-action]").forEach((button) => button.addEventListener("click", () => changeQueueEntry(side, index, button.dataset.action)));
      list.append(item);
    });
  });
  const count = pairCount();
  elements.exportCount.textContent = `${count} ${count === 1 ? "pair" : "pairs"}`;
  elements.export.disabled = count === 0;
}

function refresh() {
  renderQueues();
  if (render()) elements.status.textContent = `Previewing pair 1 of ${pairCount()}`;
  else {
    elements.canvas.width = 0;
    elements.canvas.height = 0;
    elements.size.textContent = "--";
    elements.status.textContent = "Add one scan to each queue";
  }
}

function addToQueue(side, id) {
  state.queues[side].push({ id, rotation: -90 });
  refresh();
}

function removeFromLibrary(id) {
  const asset = state.library.get(id);
  if (!asset) return;
  ["left", "right"].forEach((side) => {
    state.queues[side] = state.queues[side].filter((entry) => entry.id !== id);
  });
  state.library.delete(id);
  if (asset.image.src.startsWith("blob:")) URL.revokeObjectURL(asset.image.src);
  renderLibrary();
  refresh();
}

function changeQueueEntry(side, index, action) {
  const queue = state.queues[side];
  if (action === "remove") queue.splice(index, 1);
  if (action === "rotate-left") queue[index].rotation -= 90;
  if (action === "rotate-right") queue[index].rotation += 90;
  if (action === "up" && index > 0) [queue[index - 1], queue[index]] = [queue[index], queue[index - 1]];
  if (action === "down" && index < queue.length - 1) [queue[index + 1], queue[index]] = [queue[index], queue[index + 1]];
  refresh();
}

async function loadImage(fileOrUrl) {
  const image = new Image();
  image.decoding = "async";
  image.src = typeof fileOrUrl === "string" ? fileOrUrl : URL.createObjectURL(fileOrUrl);
  await image.decode();
  return image;
}

async function addFiles(files) {
  const readableFiles = [...files].filter((file) => file.type.startsWith("image/"));
  if (!readableFiles.length) return;
  let added = 0;
  for (const file of readableFiles) {
    try {
      const image = await loadImage(file);
      const id = `image-${state.nextId++}`;
      state.library.set(id, { id, image, name: file.name });
      added += 1;
    } catch { /* Ignore unreadable files while continuing the batch. */ }
  }
  renderLibrary();
  elements.status.textContent = added ? `${added} image${added === 1 ? "" : "s"} added to the library` : "No readable images found";
}

function queuePair(index) {
  const leftEntry = state.queues.left[index];
  const rightEntry = state.queues.right[index];
  return {
    left: { ...state.library.get(leftEntry.id), rotation: leftEntry.rotation },
    right: { ...state.library.get(rightEntry.id), rotation: rightEntry.rotation },
  };
}

function exportQueue() {
  const count = pairCount();
  const isJpeg = elements.format.value === "image/jpeg";
  const extension = isJpeg ? "jpg" : "png";
  const quality = Number(elements.quality.value) / 100;
  for (let index = 0; index < count; index += 1) {
    const exportCanvas = document.createElement("canvas");
    render(exportCanvas, queuePair(index), false);
    exportCanvas.toBlob((blob) => {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `half-frame-merged-${String(index + 1).padStart(2, "0")}.${extension}`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    }, elements.format.value, quality);
  }
  elements.status.textContent = `Exporting ${count} merged ${count === 1 ? "frame" : "frames"}`;
}

elements.libraryDrop.addEventListener("click", () => elements.libraryInput.click());
elements.libraryInput.addEventListener("change", (event) => addFiles(event.target.files));
["dragenter", "dragover"].forEach((eventName) => elements.libraryDrop.addEventListener(eventName, (event) => { event.preventDefault(); elements.libraryDrop.classList.add("dragging"); }));
["dragleave", "drop"].forEach((eventName) => elements.libraryDrop.addEventListener(eventName, (event) => { event.preventDefault(); elements.libraryDrop.classList.remove("dragging"); }));
elements.libraryDrop.addEventListener("drop", (event) => addFiles(event.dataTransfer.files));
elements.gap.addEventListener("input", () => { elements.gapValue.value = `${elements.gap.value}%`; refresh(); });
elements.grain.addEventListener("change", refresh);
elements.quality.addEventListener("input", () => { elements.qualityValue.value = elements.quality.value; });
elements.export.addEventListener("click", exportQueue);

async function loadSamplePair() {
  const samples = [
    { name: "Sample 01", url: "SampleCropFrameFilm1.jpg", side: "left" },
    { name: "Sample 02", url: "SampleCropFrameFilm2.jpg", side: "right" },
  ];
  for (const sample of samples) {
    const image = await loadImage(sample.url);
    const id = `image-${state.nextId++}`;
    state.library.set(id, { id, image, name: sample.name });
    state.queues[sample.side].push({ id, rotation: -90 });
  }
  renderLibrary();
  refresh();
}

loadSamplePair().catch(() => { elements.status.textContent = "Unable to load sample images"; });
