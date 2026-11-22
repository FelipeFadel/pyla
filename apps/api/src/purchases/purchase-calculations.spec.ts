import {
  itemFullValueCents,
  itemValueCents,
  sumItemsCents,
} from './purchase-calculations.js';

describe('purchase-calculations', () => {
  describe('itemFullValueCents', () => {
    it('multiplica preço por quantidade inteira', () => {
      expect(itemFullValueCents({ fullPriceCents: 599, quantity: 3 })).toBe(
        1797,
      );
    });

    it('arredonda meio-centavo para cima', () => {
      // 333 × 1,5 = 499,5 → 500
      expect(itemFullValueCents({ fullPriceCents: 333, quantity: 1.5 })).toBe(
        500,
      );
    });

    it('arredonda para baixo abaixo do meio-centavo', () => {
      // 999 × 0,333 = 332,667 → 333; 100 × 0,004 = 0,4 → 0
      expect(itemFullValueCents({ fullPriceCents: 999, quantity: 0.333 })).toBe(
        333,
      );
      expect(itemFullValueCents({ fullPriceCents: 100, quantity: 0.004 })).toBe(
        0,
      );
    });

    it('não sofre com ponto flutuante em quantidade decimal', () => {
      // 1,005 em float é 1,00499999...; o valor correto é 100,5 → 101
      expect(itemFullValueCents({ fullPriceCents: 100, quantity: 1.005 })).toBe(
        101,
      );
    });
  });

  describe('itemValueCents', () => {
    it('subtrai o desconto do valor cheio', () => {
      expect(
        itemValueCents({
          fullPriceCents: 500,
          quantity: 2,
          discountCents: 150,
        }),
      ).toBe(850);
    });
  });

  describe('sumItemsCents', () => {
    it('soma o valor com desconto de todos os itens', () => {
      expect(
        sumItemsCents([
          { fullPriceCents: 500, quantity: 2, discountCents: 150 },
          { fullPriceCents: 333, quantity: 1.5, discountCents: 0 },
        ]),
      ).toBe(850 + 500);
    });

    it('é zero para lista vazia', () => {
      expect(sumItemsCents([])).toBe(0);
    });
  });
});
