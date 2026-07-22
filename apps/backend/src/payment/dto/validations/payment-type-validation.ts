import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'PaymentTypeConstraint', async: false })
export class PaymentTypeConstraint implements ValidatorConstraintInterface {
  validate(_: any, args: ValidationArguments): boolean {
    const { type, shop_id, ad_id, worker_id } = args.object as any;

    switch (type) {
      case 'SHOP':
        return !!shop_id && !ad_id && !worker_id;
      case 'AD':
        return !!ad_id && !shop_id && !worker_id;
      case 'WORKER':
        return !!worker_id && !shop_id && !ad_id;
      default:
        return false;
    }
  }

  defaultMessage(args: ValidationArguments): string {
    return `If type is ${args.value}, only the corresponding ID field (shop_id, ad_id, or worker_id) must be provided.`;
  }
}
