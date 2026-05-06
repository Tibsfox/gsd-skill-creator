export interface Scale<D, R> {
  (value: D): R;
  invert(value: R): D;
  domain(): [D, D];
  domain(d: [D, D]): this;
  range(): [R, R];
  range(r: [R, R]): this;
  clamp(): boolean;
  clamp(c: boolean): this;
  ticks(count?: number): D[];
}

export type Orientation = 'top' | 'bottom' | 'left' | 'right';
