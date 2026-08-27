// OpenCV.js loader singleton

declare global {
  interface Window {
    cv: any;
    Module: any;
    __opencv_runtime_ready__?: boolean;
  }
}

let loadPromise: Promise<any> | null = null;

function getReadyCvInstance(): any | null {
  if (typeof window === "undefined") return null;

  // 1. Check window.cv directly
  if (window.cv && typeof window.cv.Mat === "function" && typeof window.cv.ORB === "function") {
    return window.cv;
  }

  // 2. Check window.Module if it is populated with opencv symbols
  if (window.Module && typeof window.Module.Mat === "function" && typeof window.Module.ORB === "function") {
    window.cv = window.Module;
    return window.Module;
  }

  return null;
}

export function loadOpenCV(): Promise<any> {
  const ready = getReadyCvInstance();
  if (ready) {
    return Promise.resolve(ready);
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise((resolve, reject) => {
    let resolved = false;

    const cleanup = () => {
      window.removeEventListener("opencv-ready", onEventReady);
      clearInterval(interval);
      clearTimeout(timeout);
    };

    const markSuccess = (instance: any) => {
      if (resolved) return;
      resolved = true;
      cleanup();
      window.cv = instance;
      console.log("[OpenCV.js] OpenCV engine ready!");
      resolve(instance);
    };

    const onEventReady = () => {
      const inst = getReadyCvInstance();
      if (inst) {
        markSuccess(inst);
      }
    };

    window.addEventListener("opencv-ready", onEventReady);

    // Immediate check
    const current = getReadyCvInstance();
    if (current) {
      return markSuccess(current);
    }

    // Safety timeout: 40 seconds
    const timeout = setTimeout(() => {
      cleanup();
      loadPromise = null;
      console.error("[OpenCV.js] Loading timeout. window.cv state:", window.cv, "window.Module state:", window.Module);
      reject(new Error("OpenCV.js 加载/初始化超时，请检查网络连接并刷新页面"));
    }, 40000);

    // Polling check every 40ms
    const interval = setInterval(() => {
      // If cv is a promise returned by modern emscripten
      if (window.cv && typeof window.cv.then === "function" && typeof window.cv.Mat !== "function") {
        window.cv.then((resolvedCv: any) => {
          if (resolvedCv && typeof resolvedCv.Mat === "function") {
            markSuccess(resolvedCv);
          }
        }).catch((err: any) => {
          console.error("[OpenCV.js] cv promise rejected:", err);
        });
      }

      const inst = getReadyCvInstance();
      if (inst) {
        markSuccess(inst);
      }
    }, 40);

    // If neither script nor CDN loaded
    const existingScript = document.querySelector('script[src*="opencv.js"]');
    if (!existingScript) {
      const script = document.createElement("script");
      script.src = "/opencv/opencv.js";
      script.async = true;
      script.type = "text/javascript";
      script.onerror = () => {
        cleanup();
        loadPromise = null;
        reject(new Error("无法加载 OpenCV.js 脚本文件"));
      };
      document.head.appendChild(script);
    }
  });

  return loadPromise;
}

// Preload immediately on page start
if (typeof window !== "undefined") {
  loadOpenCV().catch((e) => {
    console.debug("[OpenCV.js] Background pre-warm status:", e?.message);
  });
}
