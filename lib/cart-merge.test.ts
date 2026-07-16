import { describe, expect, it } from "vitest";
import { mergeCarts } from "./cart-merge";

describe("mergeCarts", () => {
  it("sums quantities for products in both carts", () => {
    const result = mergeCarts(
      [{ id: 1, qty: 2 }],
      [{ id: 1, qty: 3 }]
    );
    expect(result).toEqual([{ id: 1, qty: 5 }]);
  });

  it("keeps products unique to each cart", () => {
    const result = mergeCarts(
      [{ id: 1, qty: 1 }],
      [{ id: 2, qty: 4 }]
    );
    expect(result).toEqual(
      expect.arrayContaining([
        { id: 1, qty: 1 },
        { id: 2, qty: 4 },
      ])
    );
    expect(result).toHaveLength(2);
  });

  it("returns db cart unchanged when guest cart is empty", () => {
    expect(mergeCarts([], [{ id: 9, qty: 2 }])).toEqual([{ id: 9, qty: 2 }]);
  });
});
