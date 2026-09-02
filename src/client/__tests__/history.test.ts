import { defaultDoc } from "../factories.js";
import { HistoryStack } from "../history.js";

describe("HistoryStack", () => {
  const make = () => {
    const stack = new HistoryStack();
    const doc = defaultDoc();
    stack.reset(doc);
    return { stack, doc };
  };

  describe("positive", () => {
    it("undoes and redoes document changes", () => {
      const { stack, doc } = make();
      const next = { ...doc, name: "Renamed" };
      stack.push(next);

      expect(stack.canUndo).toBe(true);
      const undone = stack.undo(next);
      expect(undone?.name).toBe("Untitled document");
      expect(stack.canRedo).toBe(true);

      const redone = stack.redo(undone!);
      expect(redone?.name).toBe("Renamed");
    });

    it("clears redo stack after a new push", () => {
      const { stack, doc } = make();
      const a = { ...doc, name: "A" };
      const b = { ...doc, name: "B" };
      stack.push(a);
      stack.undo(a);
      stack.push(b);
      expect(stack.canRedo).toBe(false);
    });
  });

  describe("negative", () => {
    it("returns null when nothing to undo or redo", () => {
      const { stack, doc } = make();
      expect(stack.canUndo).toBe(false);
      expect(stack.canRedo).toBe(false);
      expect(stack.undo(doc)).toBeNull();
      expect(stack.redo(doc)).toBeNull();
    });

    it("ignores duplicate push of the same snapshot", () => {
      const { stack, doc } = make();
      stack.push(doc);
      expect(stack.canUndo).toBe(false);
    });
  });
});
