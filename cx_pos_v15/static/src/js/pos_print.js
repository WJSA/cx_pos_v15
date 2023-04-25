odoo.define('cx_pos_v15.print', function (require) {
  "use strict";

  const PosComponent = require('point_of_sale.PosComponent');
  const ProductScreen = require('point_of_sale.ProductScreen');
  const ReceiptScreen = require('point_of_sale.ReceiptScreen');
  const Registries = require('point_of_sale.Registries');
  const pos_model = require('point_of_sale.models');

  //Load printer_id and register_id fields
  pos_model.load_fields('account.tax', ['printer_id']);
  pos_model.load_fields('pos.payment.method', ['register_id', 'is_divisa', 'divisa_name', 'IGTF_tax_percent', 'divisa_rate']);

  //Start cashier in Fiscal Printer Machine
  class StartCashier extends PosComponent {
    async onClick() {
      let domain = [['cashier_id.name', '=', this.env.pos.employee.name]];

      this.rpc({
        model: "pos.cashier",
        method: 'search_read',
        args: [domain, ['cashier_code']],
        kwargs: { limit: 1 },

      }).then(result => {
        const url = 'http://localhost:12376/orders/cashier_init/';
        const json = {
          code: Number(result[0].cashier_code)
        };

        const options = {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(json),
        };

        fetch(url, options)
          .then(data => {
            if (!data.ok) {
              throw Error(data.status);
            }

            return data.json();

          }).then(json => {
            let response = JSON.parse(json);
            let message = response['Printer status'].split(',')[2].trim().replace(/[)]/g, '').replace(/["']/g, '')

            if (message === 'Sin error') {
              alert(`Printer status: ${response['Printer status']}\nSession started!`);

            } else {
              alert(`Printer status: ${response['Printer status']}`);
            }

          }).catch(e => {
            console.log(e);
          });
      })
    }
  }
  StartCashier.template = 'StartCashier';
  ProductScreen.addControlButton({
    component: StartCashier,
    condition: function () {
      return true;
    },
  });
  Registries.Component.add(StartCashier);


  //Print Receipt By API Button
  const PrintByApi = (ReceiptScreen) =>
    class extends ReceiptScreen {
      constructor() {
        super(...arguments);
      }
      printByApi() {
        let order = this.env.pos.get_order();
        let order_for_print = order.export_for_printing();
        let payment_methods = this.env.pos.payment_methods;

        // console.log(order_for_print);
        // console.log(order);

        //Set client data
        let ID = false;
        let bussinessName = false;
        let address = false;
        let mobile = false;

        //Check if client exists
        if (order_for_print.client) {
          ID = order_for_print.client.vat;
          bussinessName = order_for_print.client.name;
          address = order_for_print.client.address;
          mobile = order_for_print.client.mobile;
        }

        //Make receipt json object
        const receipt = {};
        receipt.client = {
          ID: ID || "",
          bussinessName: bussinessName || "",
          additionalInfo: `${address || ""}, ${mobile || ""}`
        };

        let invoiceNumber = order.uid;
        let commentary = order.comment;
        let date = order.formatted_validation_date;
        let products = [];

        //Get product data from order lines
        for (let index = 0; index < order_for_print.orderlines.length; index++) {
          let { product_name, price, quantity, price_with_tax_before_discount, discount } = order_for_print.orderlines[index];

          //PerAmount set false by default. Not implemented in Odoo yet.
          if (discount > 0) {
            let size = discount * 100;
            discount = {
              PerAmount: false,
              size: size
            };
          } else {
            discount = {
              PerAmount: false,
              size: 0
            };
          }

          //Convert price and quantity to values fiscal printer can accept
          if (quantity < 0) quantity *= -1;
          if (price_with_tax_before_discount < 0) price_with_tax_before_discount *= -1;

          let tax = Math.round(((price_with_tax_before_discount / quantity) / price - 1) * 100);
          price *= 100;
          quantity *= 1000;
          products.push({
            tax: tax,
            price: price,
            quantity: quantity,
            // code:code,
            description: product_name,
            discount: discount,
            // surcharge: surcharge
          });
        }

        //Set tax index registered in fiscal printed
        let taxes = order_for_print.tax_details;
        for (let t_index = 0; t_index < taxes.length; t_index++) {
          for (let p_index = 0; p_index < products.length; p_index++) {

            if (products[p_index].tax === taxes[t_index].tax.amount) {
              products[p_index].tax = taxes[t_index].tax.printer_id;
            }
          }
        }

        //set payment methods
        let paymentlines = order_for_print.paymentlines;
        let partialPay = [];
        let isChange = true;
        let totalPay = false;

        for (let pm_index = 0; pm_index < payment_methods.length; pm_index++) {
          for (let pl_index = 0; pl_index < paymentlines.length; pl_index++) {
            if (paymentlines[pl_index].name === payment_methods[pm_index].name) {
              partialPay.push(
                {
                  ID: payment_methods[pm_index].register_id,
                  amount: Math.trunc(paymentlines[pl_index].amount * 100),
                  name: paymentlines[pl_index].name
                }
              )
            }
          }
        }

        for (let pm_index = 0; pm_index < partialPay.length; pm_index++) {
          if (partialPay[pm_index].amount < 0) partialPay[pm_index].amount *= -1;
        }

        //Checking if set last paymentlines method as totalPay
        if (!order_for_print.change) {
          totalPay = partialPay.filter(el => el.name === paymentlines[paymentlines.length - 1].name)[0].ID;
          //partialPay = partialPay.filter(el => el.ID !== totalPay);
          isChange = false;
        }

        //deleting name from partialPay objects
        partialPay.forEach(el => delete el.name);

        //fetch options
        const options = {};
        options.method = 'POST';
        options.headers = {
          'Access-Control-Allow-Origin': '*',
          'accept': 'application/json',
          'Content-Type': 'application/json'
        };

        let url = "";
        let end_point = "";

        //fetching receipt data
        this.rpc({
          model: 'pos.order',
          method: 'search_read',
          args: [
            [['pos_reference', '=', order.name]],
            ['name']
          ],
          kwargs: { limit: 1 },

        }).then(res => {
          let receipt_name = res[0].name;

          //check if credit note
          if ((/REEMBOLSO/).test(receipt_name)) {
            let refund = receipt_name.trim().split('REEMBOLSO')[0];
            end_point = "/orders/post_creditnote/";
            this.rpc({
              model: 'pos.order',
              method: 'search_read',
              args: [
                [['name', '=', refund]],
                ['date_order', 'pos_reference']
              ],
              kwargs: { limit: 1 },

              //print credit note
            }).then(result => {
              // console.log(result);

              invoiceNumber = Number(result[0].pos_reference.split(' ')[1].split('-').join(''));
              date = result[0].date_order.split(' ')[0].split('-').reverse().join('-');

              const code_url = 'http://localhost:12376/orders/fiscal_printer_code/';

              fetch(code_url, { method: 'GET' })
                .then(data => {
                  if (!data.ok) {
                    throw Error(data.status);
                  }
                  return data.json();

                }).then(data => {
                  let response = JSON.parse(data);
                  let fiscalPrinter = response['code'];
                  //setting receipt json
                  receipt.invoiceNumber = invoiceNumber;
                  receipt.fiscalPrinter = fiscalPrinter;
                  receipt.date = date;
                  receipt.invoiceComment = commentary || "";
                  receipt.products = products;

                  if (!isChange && !partialPay.length) {
                    receipt.totalPay = totalPay;

                  } else if (!isChange && partialPay.length) {
                    receipt.partialPay = partialPay;
                    receipt.totalPay = totalPay;

                  } else {
                    receipt.partialPay = partialPay;
                  }

                  options.body = JSON.stringify(receipt);
                  url = `http://127.0.0.1:12376${end_point}`;

                  fetch(url, options)
                    .then(data => {
                      if (!data.ok) {
                        throw Error(data.status);
                      }

                      return data.json();

                    }).then(receipt => {
                      let response = JSON.parse(receipt);
                      let message = response['Printer status'].split(',')[2].trim().replace(/[)]/g, '').replace(/["']/g, '')

                      if (message === 'Sin error') {
                        alert(`Printer status: ${response['Printer status']}\nCredit note was printed!`);

                      } else {
                        alert(`Printer status: ${response['Printer status']}`);
                      }

                    }).catch(e => {
                      console.log(e);
                    });

                })

            }).catch(e => {
              console.log(e);
            });

            //print receipt
          } else {

            //setting receipt json
            receipt.invoiceComment = commentary || "";
            receipt.products = products;

            if (!isChange && !partialPay.length) {
              receipt.totalPay = totalPay;

            } else if (!isChange && partialPay.length) {
              receipt.partialPay = partialPay;
              receipt.totalPay = totalPay;

            } else {
              receipt.partialPay = partialPay;
            }

            end_point = "/orders/post_invoice/";
            url = `http://127.0.0.1:12376${end_point}`;

            options.body = JSON.stringify(receipt);

            fetch(url, options)
              .then(data => {
                if (!data.ok) {
                  throw Error(data.status);
                }

                return data.json();

              }).then(receipt => {
                let response = JSON.parse(receipt);
                let message = response['Printer status'].split(',')[2].trim().replace(/[)]/g, '').replace(/["']/g, '')

                if (message === 'Sin error') {
                  alert(`Printer status: ${response['Printer status']}\nReceipt was printed!`);

                } else {
                  alert(`Printer status: ${response['Printer status']}`);
                }

              }).catch(e => {
                console.log(e);
              });
          }

        });

      }
    }
  Registries.Component.extend(ReceiptScreen, PrintByApi);

});