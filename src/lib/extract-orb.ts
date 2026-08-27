import { loadOpenCV } from "./opencv";
import { MATCH_CONFIG, type OrbFeaturePayloadV1 } from "./feature-schema";
import { uint8ArrayToBase64 } from "./feature-codec";

export async function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(new Error("无法解码图片文件: " + err));
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(new Error("读取文件失败: " + err));
    reader.readAsDataURL(file);
  });
}

export function resizeToCanvas(img: HTMLImageElement, maxEdge: number = MATCH_CONFIG.TARGET_LONG_EDGE): HTMLCanvasElement {
  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;

  if (width > maxEdge || height > maxEdge) {
    if (width >= height) {
      height = Math.round((height * maxEdge) / width);
      width = maxEdge;
    } else {
      width = Math.round((width * maxEdge) / height);
      height = maxEdge;
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("无法创建 2D Canvas 上下文");
  }
  ctx.drawImage(img, 0, 0, width, height);
  return canvas;
}

export async function extractOrbFeatures(
  file: File,
  onProgress?: (msg: string) => void
): Promise<{ payload: OrbFeaturePayloadV1; previewUrl: string }> {
  onProgress?.("正在加载 OpenCV 图像处理引擎...");
  const cv = await loadOpenCV();

  onProgress?.("正在读取并缩放图片...");
  const img = await loadImageElement(file);
  const canvas = resizeToCanvas(img, MATCH_CONFIG.TARGET_LONG_EDGE);
  const previewUrl = canvas.toDataURL("image/jpeg", 0.85);

  onProgress?.("正在提取 ORB 关键点与描述子...");
  
  let src: any = null;
  let gray: any = null;
  let keypoints: any = null;
  let descriptors: any = null;
  let mask: any = null;
  let orb: any = null;

  try {
    src = cv.imread(canvas);
    gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

    keypoints = new cv.KeyPointVector();
    descriptors = new cv.Mat();
    mask = new cv.Mat();

    // OpenCV.js ORB detector
    orb = new cv.ORB(MATCH_CONFIG.ORB_MAX_FEATURES);
    orb.detectAndCompute(gray, mask, keypoints, descriptors);

    const numPoints = keypoints.size();
    if (numPoints < MATCH_CONFIG.MIN_KEYPOINTS_CLIENT) {
      throw new Error(`图片纹理不足（仅检测到 ${numPoints} 个特征点，需要至少 ${MATCH_CONFIG.MIN_KEYPOINTS_CLIENT} 个），请换一张纹理丰富、清晰的图片。`);
    }

    const pointsArray: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < numPoints; i++) {
      const kp = keypoints.get(i);
      pointsArray.push({
        x: Math.round(kp.pt.x * 10) / 10,
        y: Math.round(kp.pt.y * 10) / 10,
      });
    }

    // descriptors is a CV_8UC1 Mat with rows = numPoints, cols = 32
    if (descriptors.rows !== numPoints || descriptors.cols !== MATCH_CONFIG.DESCRIPTOR_SIZE) {
      throw new Error("描述子矩阵维度异常");
    }

    const descriptorsBytes = new Uint8Array(descriptors.data);
    const descriptorsBase64 = uint8ArrayToBase64(descriptorsBytes);

    const payload: OrbFeaturePayloadV1 = {
      version: 1,
      algorithm: "orb",
      imageWidth: gray.cols,
      imageHeight: gray.rows,
      descriptorSize: 32,
      keypoints: pointsArray,
      descriptorsBase64,
    };

    return { payload, previewUrl };
  } finally {
    if (src) src.delete();
    if (gray) gray.delete();
    if (keypoints) keypoints.delete();
    if (descriptors) descriptors.delete();
    if (mask) mask.delete();
    if (orb) orb.delete();
  }
}
