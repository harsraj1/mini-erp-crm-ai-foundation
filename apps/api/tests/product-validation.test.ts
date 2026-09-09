import { it, expect } from 'vitest';
import { productCreateSchema } from '../src/validators/product.validator.js';
it.each(['', 'Infinity', '1.234', -1, 10000000000])('rejects invalid or out-of-range price %s',price=>{
 expect(productCreateSchema.safeParse({productName:'Test',sku:'SKU',category:'Test',unitPrice:price,warehouseLocation:'Test'}).success).toBe(false);
});
it('accepts precise decimal price',()=>{
 expect(productCreateSchema.parse({productName:'Test',sku:'SKU',category:'Test',unitPrice:'12.50',warehouseLocation:'Test'}).unitPrice).toBe('12.50');
});
