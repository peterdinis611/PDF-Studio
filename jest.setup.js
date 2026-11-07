process.env.LOG_LEVEL = "silent";
process.env.NODE_ENV = process.env.NODE_ENV || "test";

// pdf.js 5+ touches DOMMatrix at module load; Node's test env lacks it.
if (typeof globalThis.DOMMatrix === "undefined") {
  class DOMMatrixPolyfill {
    constructor(init) {
      this.a = 1;
      this.b = 0;
      this.c = 0;
      this.d = 1;
      this.e = 0;
      this.f = 0;
      if (Array.isArray(init) && init.length >= 6) {
        [this.a, this.b, this.c, this.d, this.e, this.f] = init;
      }
    }
    multiplySelf() {
      return this;
    }
    invertSelf() {
      return this;
    }
    translateSelf(tx = 0, ty = 0) {
      this.e += tx;
      this.f += ty;
      return this;
    }
    scaleSelf(sx = 1, sy = sx) {
      this.a *= sx;
      this.d *= sy;
      return this;
    }
  }
  globalThis.DOMMatrix = DOMMatrixPolyfill;
}
