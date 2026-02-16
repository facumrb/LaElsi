import { IApiProduct } from './product.model';

export interface ICartItem {
    product: IApiProduct;
    quantity: number;
}
