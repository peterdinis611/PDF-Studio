/**
 * @jest-environment jsdom
 */
import { jest } from "@jest/globals";

const drive = jest.fn();
const destroy = jest.fn();
const isActive = jest.fn(() => false);

jest.unstable_mockModule("driver.js", () => ({
  driver: jest.fn(() => ({
    drive,
    destroy,
    isActive,
  })),
}));

const {
  TOUR_SEEN_KEY,
  hasSeenEditorTour,
  scheduleEditorTour,
  startEditorTour,
  resetTourStateForTests,
} = await import("../tour.js");

describe("editor tour", () => {
  beforeEach(() => {
    resetTourStateForTests();
    drive.mockClear();
    destroy.mockClear();
    isActive.mockReset();
    isActive.mockReturnValue(false);
    localStorage.clear();
    document.body.innerHTML = "";
  });

  afterEach(() => {
    resetTourStateForTests();
  });

  describe("hasSeenEditorTour", () => {
    it("is false until marked", () => {
      expect(hasSeenEditorTour()).toBe(false);
    });

    it("is true after localStorage flag is set", () => {
      localStorage.setItem(TOUR_SEEN_KEY, "1");
      expect(hasSeenEditorTour()).toBe(true);
    });
  });

  describe("startEditorTour", () => {
    it("starts a single driver instance", () => {
      startEditorTour();
      expect(drive).toHaveBeenCalledTimes(1);
    });

    it("destroys previous tour before starting another", () => {
      isActive.mockReturnValue(true);
      startEditorTour();
      startEditorTour();
      expect(destroy).toHaveBeenCalled();
      expect(drive).toHaveBeenCalledTimes(2);
    });
  });

  describe("scheduleEditorTour", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("does nothing when the tour was already seen", () => {
      localStorage.setItem(TOUR_SEEN_KEY, "1");
      scheduleEditorTour();
      jest.runAllTimers();
      expect(drive).not.toHaveBeenCalled();
    });

    it("starts only once even if schedule is called twice", () => {
      scheduleEditorTour({ force: true });
      scheduleEditorTour({ force: true });
      jest.runAllTimers();
      expect(drive).toHaveBeenCalledTimes(1);
    });
  });
});
