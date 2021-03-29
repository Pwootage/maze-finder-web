export class CRandom16 {
  constructor(seed) {
    this.seed = seed;
  }

  next() {
    this.seed = (Math.imul(this.seed, 0x41c64e6d) + 0x00003039) & 0xFFFF_FFFF;
    return (this.seed >> 16) & 0xffff;
  }

  float() {
    return this.next() * 0.000015259022;
  }

  rangeFloat(min, max) {
    return min + this.float() * (max - min);
  }

  rangeInt(min, max) {
    return min + (this.next() % ((max - min) + 1));
  }
}
