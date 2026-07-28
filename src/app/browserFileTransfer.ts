export interface TextFileTransfer {
  readText(file: File): Promise<string>;
  downloadText(filename: string, content: string, mimeType: string): void;
}

export function createBrowserTextFileTransfer(): TextFileTransfer {
  return {
    readText: (file) => {
      if (typeof file.text === "function") return file.text();
      return new Promise<string>((resolve, reject) => {
        if (typeof FileReader !== "function") {
          reject(new Error("Neither File.text nor FileReader is available."));
          return;
        }
        const reader = new FileReader();
        let settled = false;
        const fail = (message: string): void => {
          if (settled) return;
          settled = true;
          reject(new Error(message));
        };
        reader.onload = () => {
          if (settled) return;
          if (typeof reader.result !== "string") {
            fail("FileReader did not return text.");
            return;
          }
          settled = true;
          resolve(reader.result);
        };
        reader.onerror = () => fail("FileReader failed to read the file.");
        reader.onabort = () => fail("FileReader was aborted.");
        try {
          reader.readAsText(file, "UTF-8");
        } catch {
          fail("FileReader could not start reading the file.");
        }
      });
    },
    downloadText: (filename, content, mimeType) => {
      if (
        typeof Blob !== "function" ||
        typeof URL === "undefined" ||
        typeof URL.createObjectURL !== "function" ||
        typeof URL.revokeObjectURL !== "function" ||
        typeof document === "undefined" ||
        typeof document.createElement !== "function"
      ) {
        throw new Error("Browser download APIs are unavailable.");
      }
      const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      try {
        document.body.append(link);
        link.click();
      } finally {
        link.remove();
        URL.revokeObjectURL(url);
      }
    },
  };
}
