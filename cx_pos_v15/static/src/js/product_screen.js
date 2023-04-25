odoo.define('cx_product_screen', function (require) {
  "use strict";

  const OrderWidget = require('point_of_sale.OrderWidget');
  const Registries = require('point_of_sale.Registries');
  const ProductScreen = require('point_of_sale.ProductScreen');
  const RefundButton = require('point_of_sale.RefundButton');
  const { useState } = owl.hooks;

  //Overriding OrderWidget to add total in $ to order in Product Screen
  const OrderDivisa = OrderWidget =>
    class extends OrderWidget {
      constructor() {
        super(...arguments)
        this.state = useState({
          total_divisa: 0
        });
      }
      _updateSummary() {
        const total = this.order ? this.order.get_total_with_tax() : 0;
        const tax = this.order ? total - this.order.get_total_without_tax() : 0;
        this.state.total = this.env.pos.format_currency(total);
        this.state.tax = this.env.pos.format_currency(tax);

        let domain = [['name', '=', 'USD'], ['active', '=', true]];
        try {
          this.rpc({
            model: 'res.currency',
            method: 'search_read',
            args: [domain, ['rate', 'symbol']],
            kwargs: { limit: 1 },

          }).then(result => {
            if (result.length) {
              let rate = result[0].rate;
              const symbol = result[0].symbol;
              let total_divisa = total / rate;
              this.state.total_divisa = `${this.env.pos.format_currency_no_symbol(total_divisa)} ${symbol}`;

            } else {
              console.error("ERROR MESSAGE");
            }

          });
        }
        catch (err) {
          console.error(err);
        }
        finally {
          this.render();
        }
      }
    };
  Registries.Component.extend(OrderWidget, OrderDivisa);
  
  //Overriding RefundButton to hide it from not allowed users.
  ProductScreen.addControlButton({
    component: RefundButton,
    condition: function () {
        let cashier = this.env.pos.get('cashier') || this.env.pos.get_cashier();
        if(this.env.pos.config.refund_allowed_employee_ids.includes(cashier.id)){
          return true;
        }
        return false;
    },
    position: ['replace', 'RefundButton'],
  });
});