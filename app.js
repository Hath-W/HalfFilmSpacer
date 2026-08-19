const state = {
  left: { image: null, rotation: -90, name: "Sample 01" },
  right: { image: null, rotation: -90, name: "Sample 02" },
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
  size: document.querySelector("#sizeReadout"),
};

function sourceSize(frame) {
  const turns = ((frame.rotation % 180) + 180) % 180;
  return turns ? { width: frame.image.height, height: frame.image.width } : { width: frame.image.width, height: frame.image.height };
}

function composition() {
  if (!state.left.image || !state.right.image) return null;
  const left = sourceSize(state.left);
  const right = sourceSize(state.right);
  const height = Math.max(left.height, right.height);
  const leftWidth = Math.round(left.width * height / left.height);
  const rightWidth = Math.round(right.width * height / right.height);
  const gap = Math.round(height * Number(elements.gap.value) / 100);
  return { height, leftWidth, rightWidth, gap, width: leftWidth + gap + rightWidth };
}

function drawRotated(context, frame, x, y, width, height) {
  const angle = frame.rotation * Math.PI / 180;
  context.save();
  context.translate(x + width / 2, y + height / 2);
  context.rotate(angle);
  context.drawImage(frame.image, -frame.image.width / 2, -frame.image.height / 2, frame.image.width, frame.image.height);
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

function render(canvas = elements.canvas) {
  const layout = composition();
  if (!layout) return null;
  canvas.width = layout.width;
  canvas.height = layout.height;
  const context = canvas.getContext("2d", { alpha: false });
  context.fillStyle = "#080908";
  context.fillRect(0, 0, layout.width, layout.height);
  drawRotated(context, state.left, 0, 0, layout.leftWidth, layout.height);
  drawGap(context, layout);
  drawRotated(context, state.right, layout.leftWidth + layout.gap, 0, layout.rightWidth, layout.height);
  elements.size.textContent = `${layout.width} x ${layout.height} PX`;
  return layout;
}

function refresh() {
  if (render()) elements.status.textContent = "Ready to export";
}

async function loadImage(fileOrUrl) {
  const image = new Image();
  image.decoding = "async";
  image.src = typeof fileOrUrl === "string" ? fileOrUrl : URL.createObjectURL(fileOrUrl);
  await image.decode();
  return image;
}

async function setFrame(slot, file) {
  try {
    const frame = state[slot];
    frame.image = await loadImage(file);
    frame.name = typeof file === "string" ? (slot === "left" ? "Sample 01" : "Sample 02") : file.name;
    document.querySelector(`#${slot}Thumb`).src = frame.image.src;
    document.querySelector(`#${slot}Meta`).textContent = frame.name.length > 15 ? `${frame.name.slice(0, 12)}...` : frame.name;
    refresh();
  } catch {
    elements.status.textContent = "That image could not be read";
  }
}

document.querySelectorAll("[data-open-file]").forEach((button) => {
  button.addEventListener("click", () => document.querySelector(`#${button.dataset.openFile}Input`).click());
});

document.querySelectorAll('input[type="file"]').forEach((input) => {
  input.addEventListener("change", (event) => {
    if (event.target.files[0]) setFrame(event.target.id.replace("Input", ""), event.target.files[0]);
  });
});

document.querySelectorAll("[data-rotate]").forEach((button) => {
  button.addEventListener("click", () => {
    const frame = state[button.dataset.rotate];
    frame.rotation += Number(button.dataset.amount);
    refresh();
  });
});

elements.gap.addEventListener("input", () => { elements.gapValue.value = `${elements.gap.value}%`; refresh(); });
elements.grain.addEventListener("change", refresh);
elements.quality.addEventListener("input", () => { elements.qualityValue.value = elements.quality.value; });

elements.export.addEventListener("click", () => {
  const exportCanvas = document.createElement("canvas");
  render(exportCanvas);
  const isJpeg = elements.format.value === "image/jpeg";
  const extension = isJpeg ? "jpg" : "png";
  exportCanvas.toBlob((blob) => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `half-frame-merged.${extension}`;
    link.click();
    URL.revokeObjectURL(link.href);
    elements.status.textContent = "Export complete";
  }, elements.format.value, Number(elements.quality.value) / 100);
});

Promise.all([setFrame("left", "SampleCropFrameFilm1.jpg"), setFrame("right", "SampleCropFrameFilm2.jpg")]);