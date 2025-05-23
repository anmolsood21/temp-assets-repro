import { Editor, Tldraw, Vec, createShapeId } from "tldraw";
import "tldraw/tldraw.css";
import { useState } from "react";

export default function TldrawComponent() {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [largeRectId, setLargeRectId] = useState<any>(null);
  const [groupId, setGroupId] = useState<any>(null);
  const [shapesData, setShapesData] = useState<any[]>([]);

  const resize = (factor: number = 0.5) => {
    if (editor && largeRectId && groupId) {
      // Get current shapes
      const largeRect = editor.getShape(largeRectId);

      if (largeRect && largeRect.type === "geo") {
        const scaleOrigin = { x: largeRect.x, y: largeRect.y };

        // Resize the large rectangle
        editor.resizeShape(largeRectId, new Vec(factor, factor), {
          scaleOrigin: scaleOrigin,
        });

        // Resize the group
        editor.resizeShape(groupId, new Vec(factor, factor), {
          scaleOrigin: scaleOrigin,
        });
      }
    }
  };

  const resizeV2 = (factor: number = 0.5) => {
    if (editor && largeRectId && groupId) {
      // Get current shapes
      const largeRect = editor.getShape(largeRectId);

      if (largeRect && largeRect.type === "geo") {
        const scaleOrigin = { x: largeRect.x, y: largeRect.y };

        // First, get the children of the group (the small rectangles)
        const children = Array.from(editor.getShapeAndDescendantIds([groupId]));
        const smallRectIds = children.filter((id: any) => id !== groupId);

        // Ungroup the small rectangles
        editor.ungroupShapes([groupId]);

        // Resize the large rectangle
        editor.resizeShape(largeRectId, new Vec(factor, factor), {
          scaleOrigin: scaleOrigin,
        });

        // Resize each small rectangle individually
        smallRectIds.forEach((rectId: any) => {
          editor.resizeShape(rectId, new Vec(factor, factor), {
            scaleOrigin: scaleOrigin,
          });
        });
      }
    }
  };

  const resizeV3 = (factor: number = 0.5) => {
    if (editor && largeRectId && groupId) {
      // Get current shapes
      const largeRect = editor.getShape(largeRectId);

      if (largeRect && largeRect.type === "geo") {
        const scaleOrigin = { x: 0, y: 0 };

        // Group the big rectangle and the existing group into a new group
        editor.groupShapes([largeRectId, groupId]);

        // Find the new group ID by checking the parent of the large rectangle
        const updatedLargeRect = editor.getShape(largeRectId);
        const newGroupId = updatedLargeRect?.parentId;

        // Resize the new group
        if (
          newGroupId &&
          typeof newGroupId === "string" &&
          newGroupId !== editor.getCurrentPageId()
        ) {
          editor.resizeShape(newGroupId as any, new Vec(factor, factor), {
            scaleOrigin: scaleOrigin,
          });

          // Ungroup the newly created group
          editor.ungroupShapes([newGroupId as any]);
        }
      }
    }
  };

  const resizeV4 = (factor: number = 0.5) => {
    if (editor && largeRectId) {
      // Get current large rectangle shape
      const largeRect = editor.getShape(largeRectId);

      if (largeRect && largeRect.type === "geo") {
        const scaleOrigin = { x: largeRect.x, y: largeRect.y };

        // Resize only the large rectangle
        editor.resizeShape(largeRectId, new Vec(factor, factor), {
          scaleOrigin: scaleOrigin,
        });
      }
    }
  };

  const refreshShapes = () => {
    if (editor) {
      const currentShapes = editor.getCurrentPageShapes();
      const shapesInfo = currentShapes.map((shape) => ({
        id: shape.id,
        type: shape.type,
        x: shape.x,
        y: shape.y,
        width: shape.type === "geo" ? (shape.props as any).w : "N/A",
        height: shape.type === "geo" ? (shape.props as any).h : "N/A",
        parentId: shape.parentId,
      }));
      setShapesData(shapesInfo);
    }
  };

  return (
    <div style={{ display: "flex", width: "100vw", height: "100vh" }}>
      {/* Left side - Canvas */}
      <div style={{ flex: "1", position: "relative", minWidth: "0" }}>
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
          }}
        >
          <Tldraw
            hideUi={true}
            onMount={(editorInstance) => {
              setEditor(editorInstance);
              let cleanupFn: (() => void) | undefined;

              (async () => {
                try {
                  // Create rectangle shapes
                  const newLargeRectId = createShapeId();
                  const smallRect1Id = createShapeId();
                  const smallRect2Id = createShapeId();

                  setLargeRectId(newLargeRectId);

                  // Create large rectangle at 0,0 with size 400,400
                  editorInstance.createShape({
                    id: newLargeRectId,
                    type: "geo",
                    x: 0,
                    y: 0,
                    props: {
                      w: 400,
                      h: 400,
                      geo: "rectangle",
                    },
                  });

                  // Create first small rectangle at 50,50 with size 50,50
                  editorInstance.createShape({
                    id: smallRect1Id,
                    type: "geo",
                    x: 50,
                    y: 50,
                    props: {
                      w: 50,
                      h: 50,
                      geo: "rectangle",
                    },
                  });

                  // Create second small rectangle at 120,50 with size 50,50 (no overlap)
                  editorInstance.createShape({
                    id: smallRect2Id,
                    type: "geo",
                    x: 120,
                    y: 50,
                    props: {
                      w: 50,
                      h: 50,
                      geo: "rectangle",
                    },
                  });

                  // Group the two small rectangles
                  editorInstance.groupShapes([smallRect1Id, smallRect2Id]);

                  // Find the group ID by checking the parent of one of the small rectangles
                  const smallRect1 = editorInstance.getShape(smallRect1Id);
                  const detectedGroupId = smallRect1?.parentId;

                  if (
                    detectedGroupId &&
                    typeof detectedGroupId === "string" &&
                    detectedGroupId !== editorInstance.getCurrentPageId()
                  ) {
                    setGroupId(detectedGroupId);

                    // Make the group a child of the large rectangle
                    editorInstance.updateShape({
                      id: detectedGroupId as any,
                      type: "group",
                      parentId: newLargeRectId,
                    });
                  }

                  cleanupFn = () => {
                    editorInstance.deleteShape(newLargeRectId);
                    if (
                      detectedGroupId &&
                      typeof detectedGroupId === "string" &&
                      detectedGroupId !== editorInstance.getCurrentPageId()
                    ) {
                      editorInstance.deleteShape(detectedGroupId as any);
                    }
                  };
                } catch (error) {
                  console.error("Failed to create shapes:", error);
                }
              })();

              return () => {
                if (cleanupFn) cleanupFn();
              };
            }}
          />
        </div>
      </div>

      {/* Middle - Info Panel */}
      <div
        style={{
          width: "350px",
          padding: "20px",
          backgroundColor: "#f0f2f5",
          borderLeft: "1px solid #dee2e6",
          borderRight: "1px solid #dee2e6",
          overflow: "auto",
          fontSize: "14px",
          lineHeight: "1.5",
        }}
      >
        <h3 style={{ margin: "0 0 20px 0", color: "#333", fontSize: "18px" }}>
          Resize Tool Guide
        </h3>

        <div style={{ marginBottom: "25px" }}>
          <h4
            style={{ margin: "0 0 10px 0", color: "#495057", fontSize: "16px" }}
          >
            How to Use:
          </h4>
          <ul style={{ margin: "0", paddingLeft: "20px", color: "#6c757d" }}>
            <li>Click any resize button to apply 0.5x scaling</li>
            <li>Use "Refresh Shapes" to see updated shape data</li>
            <li>
              <strong>Important:</strong> Refresh the page to remount the canvas
              before trying different resize options
            </li>
            <li>Each method demonstrates different grouping behaviors</li>
            <li>Scale origin is always at (0, 0)</li>
          </ul>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <div
            style={{
              padding: "12px",
              backgroundColor: "#d4edda",
              borderRadius: "6px",
              border: "1px solid #c3e6cb",
              marginBottom: "12px",
            }}
          >
            <h5
              style={{
                margin: "0 0 8px 0",
                color: "#155724",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              🟢 Resize (0.5x)
            </h5>
            <p style={{ margin: "0", color: "#155724", fontSize: "13px" }}>
              <strong>Group-based resize:</strong> Scales the group as a
              container. The group's transform changes but individual children
              maintain their relative positions within the group space. Most
              predictable for maintaining hierarchy.
            </p>
          </div>

          <div
            style={{
              padding: "12px",
              backgroundColor: "#fff3cd",
              borderRadius: "6px",
              border: "1px solid #ffeaa7",
              marginBottom: "12px",
            }}
          >
            <h5
              style={{
                margin: "0 0 8px 0",
                color: "#856404",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              🟠 Resize V2 (0.5x)
            </h5>
            <p style={{ margin: "0", color: "#856404", fontSize: "13px" }}>
              <strong>Individual resize:</strong> Ungroups small rectangles
              first, then resizes each shape independently. Gives direct control
              over individual shape properties but breaks the original grouping.
            </p>
          </div>

          <div
            style={{
              padding: "12px",
              backgroundColor: "#e1bee7",
              borderRadius: "6px",
              border: "1px solid #ce93d8",
              marginBottom: "12px",
            }}
          >
            <h5
              style={{
                margin: "0 0 8px 0",
                color: "#4a148c",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              🟣 Resize V3 (0.5x)
            </h5>
            <p style={{ margin: "0", color: "#4a148c", fontSize: "13px" }}>
              <strong>Super-group resize:</strong> Groups everything (large
              rectangle + existing group) into one master group, resizes that,
              then ungroups. Treats all shapes as one unified object during
              resize.
            </p>
          </div>

          <div
            style={{
              padding: "12px",
              backgroundColor: "#d7ccc8",
              borderRadius: "6px",
              border: "1px solid #bcaaa4",
              marginBottom: "12px",
            }}
          >
            <h5
              style={{
                margin: "0 0 8px 0",
                color: "#3e2723",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              🟤 Resize V4 (0.5x)
            </h5>
            <p style={{ margin: "0", color: "#3e2723", fontSize: "13px" }}>
              <strong>Container-only resize:</strong> Resizes only the large
              rectangle (container), leaving small rectangles unchanged. Useful
              for adjusting container size while preserving child element
              dimensions.
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Shapes View */}
      <div
        style={{
          width: "300px",
          padding: "20px",
          backgroundColor: "#f8f9fa",
          borderLeft: "1px solid #dee2e6",
          overflow: "auto",
        }}
      >
        <h3 style={{ margin: "0 0 20px 0", color: "#333" }}>Canvas Shapes</h3>

        <div
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "20px",
            flexDirection: "column",
          }}
        >
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => resize(0.5)}
              style={{
                padding: "8px 16px",
                backgroundColor: "#4CAF50",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                flex: "1",
              }}
            >
              Resize (0.5x)
            </button>
            <button
              onClick={refreshShapes}
              style={{
                padding: "8px 16px",
                backgroundColor: "#2196F3",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                flex: "1",
              }}
            >
              Refresh Shapes
            </button>
          </div>
          <button
            onClick={() => resizeV2(0.5)}
            style={{
              padding: "8px 16px",
              backgroundColor: "#FF9800",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              width: "100%",
            }}
          >
            Resize V2 (0.5x)
          </button>
          <button
            onClick={() => resizeV3(0.5)}
            style={{
              padding: "8px 16px",
              backgroundColor: "#9C27B0",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              width: "100%",
            }}
          >
            Resize V3 (0.5x)
          </button>
          <button
            onClick={() => resizeV4(0.5)}
            style={{
              padding: "8px 16px",
              backgroundColor: "#795548",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              width: "100%",
            }}
          >
            Resize V4 (0.5x)
          </button>
        </div>

        {shapesData.length > 0 ? (
          <div>
            {shapesData.map((shape, index) => (
              <div
                key={shape.id}
                style={{
                  marginBottom: "12px",
                  padding: "12px",
                  backgroundColor: "white",
                  borderRadius: "6px",
                  border: "1px solid #e9ecef",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                }}
              >
                <div
                  style={{
                    fontWeight: "bold",
                    marginBottom: "6px",
                    color: "#495057",
                  }}
                >
                  Shape {index + 1}: {shape.type}
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    color: "#6c757d",
                    lineHeight: "1.4",
                  }}
                >
                  <div>ID: {shape.id.slice(-8)}...</div>
                  <div>
                    Position: ({shape.x}, {shape.y})
                  </div>
                  <div>
                    Size: {shape.width} x {shape.height}
                  </div>
                  <div>
                    Parent:{" "}
                    {shape.parentId ? shape.parentId.slice(-8) + "..." : "Page"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              padding: "20px",
              textAlign: "center",
              color: "#6c757d",
              backgroundColor: "white",
              borderRadius: "6px",
              border: "1px solid #e9ecef",
            }}
          >
            Click "Refresh Shapes" to view canvas shapes
          </div>
        )}
      </div>
    </div>
  );
}
