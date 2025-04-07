import {
  AssetRecordType,
  TLAssetId,
  Tldraw,
  createShapeId,
  getHashForBuffer,
} from "tldraw";
import "tldraw/tldraw.css";

export default function TldrawComponent() {
  return (
    <div style={{ position: "fixed", width: "50vh", height: "50vh" }}>
      <Tldraw
        hideUi={true}
        onMount={(editor) => {
          let cleanupFn: (() => void) | undefined;

          (async () => {
            try {
              // Images in the public folder are available at the root URL
              const response = await fetch("/apple.png");
              const blob = await response.blob();
              const file = new File([blob], "apple.png", { type: "image/png" });

              const hash = getHashForBuffer(await file.arrayBuffer());
              const assetId: TLAssetId = AssetRecordType.createId(hash);
              editor.createTemporaryAssetPreview(assetId, file);
              const imageShapeId = createShapeId();
              editor.createShape({
                id: imageShapeId,
                type: "image",
                x: 50,
                y: 50,
                props: {
                  assetId: assetId,
                  w: 200,
                  h: 300,
                },
              });

              cleanupFn = () => {
                editor.deleteShape(imageShapeId);
              };
            } catch (error) {
              console.error("Failed to load apple.png:", error);
            }
          })();

          return () => {
            if (cleanupFn) cleanupFn();
          };
        }}
      />
    </div>
  );
}
