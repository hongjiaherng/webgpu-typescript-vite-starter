import "./style.css";
import triangleShader from "./shaders/triangle.wgsl";

async function init(): Promise<{
  device: GPUDevice;
  context: GPUCanvasContext;
}> {
  if (!navigator.gpu) {
    document.getElementById("adapter-info")!.textContent =
      "WebGPU not supported.";
    throw Error("WebGPU not supported.");
  }

  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    document.getElementById("adapter-info")!.textContent =
      "Couldn't request WebGPU adapter.";
    throw Error("Couldn't request WebGPU adapter.");
  }

  const device = await adapter.requestDevice();

  // Get extra info
  const {
    architecture,
    description,
    device: adapterDevice,
    vendor,
  } = await adapter.requestAdapterInfo();
  document.getElementById("adapter-info")!.textContent = JSON.stringify({
    architecture,
    description,
    device: adapterDevice,
    vendor,
  });

  const canvas = document.getElementById("webgpu-canvas") as HTMLCanvasElement;
  const context = canvas.getContext("webgpu") as GPUCanvasContext;
  context.configure({
    device,
    format: navigator.gpu.getPreferredCanvasFormat(),
    alphaMode: "premultiplied",
  });

  return { device, context };
}

function renderTriangle(device: GPUDevice, context: GPUCanvasContext) {
  // Create a buffer and write our triangle data into it
  const vertices = new Float32Array([
    0.0, 0.6, 0, 1, 1, 0, 0, 1, -0.5, -0.6, 0, 1, 0, 1, 0, 1, 0.5, -0.6, 0, 1,
    0, 0, 1, 1,
  ]);

  const vertexBuffer = device.createBuffer({
    size: vertices.byteLength, // make it big enough to store vertices in
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });

  device.queue.writeBuffer(vertexBuffer, 0, vertices, 0, vertices.length);

  // Define and create the render pipeline
  const shaderModule = device.createShaderModule({
    code: triangleShader,
  });
  const renderPipeline = device.createRenderPipeline({
    vertex: {
      module: shaderModule,
      entryPoint: "vertex_main",
      buffers: [
        {
          attributes: [
            {
              shaderLocation: 0,
              offset: 0,
              format: "float32x4",
            },
            {
              shaderLocation: 1,
              offset: 4 * 4,
              format: "float32x4",
            },
          ],
          arrayStride: 4 * 8,
          stepMode: "vertex",
        },
      ],
    },
    fragment: {
      module: shaderModule,
      entryPoint: "fragment_main",
      targets: [
        {
          format: navigator.gpu.getPreferredCanvasFormat(),
        },
      ],
    },
    primitive: {
      topology: "triangle-list",
    },
    layout: "auto",
  });

  // Running a rendering pass
  const commandEncoder = device.createCommandEncoder();
  const passEncoder = commandEncoder.beginRenderPass({
    colorAttachments: [
      {
        clearValue: { r: 0.0, g: 0.5, b: 1.0, a: 1.0 },
        loadOp: "clear",
        storeOp: "store",
        view: context.getCurrentTexture().createView(),
      },
    ],
  });
  passEncoder.setPipeline(renderPipeline);
  passEncoder.setVertexBuffer(0, vertexBuffer);
  passEncoder.draw(3);
  passEncoder.end();
  device.queue.submit([commandEncoder.finish()]);
}

await init().then(({ device, context }) => {
  renderTriangle(device, context);
});
