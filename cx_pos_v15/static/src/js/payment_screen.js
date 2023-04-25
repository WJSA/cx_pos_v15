odoo.define('cx_payment_screen', function (require) {
    "use strict";

    const models = require('point_of_sale.models');
    const PaymentScreen = require('point_of_sale.PaymentScreen');
    const PaymentScreenStatus = require('point_of_sale.PaymentScreenStatus');
    const NumberBuffer = require('point_of_sale.NumberBuffer');
    const Registries = require('point_of_sale.Registries');
    const field_utils = require('web.field_utils');
    const utils = require('web.utils');
    const round_pr = utils.round_precision;

    const PaymentScreenIGTF = PaymentScreen =>
        class extends PaymentScreen {
            _updateSelectedPaymentline() {
                if (this.paymentLines.every((line) => line.paid)) {
                    this.currentOrder.add_paymentline(this.payment_methods_from_config[0]);
                }
                if (!this.selectedPaymentLine) return; // do nothing if no selected payment line
                // disable changing amount on paymentlines with running or done payments on a payment terminal
                const payment_terminal = this.selectedPaymentLine.payment_method.payment_terminal;
                if (
                    payment_terminal &&
                    !['pending', 'retry'].includes(this.selectedPaymentLine.get_payment_status())
                ) {
                    return;
                }
                if (NumberBuffer.get() === null) {
                    this.deletePaymentLine({ detail: { cid: this.selectedPaymentLine.cid } });
                } else {
                    if (this.selectedPaymentLine.payment_method.is_divisa) {
                        let amount = field_utils.parse.float(NumberBuffer.get());
                        let divisa_name = this.selectedPaymentLine.payment_method.divisa_name[1];
                        let domain = [['name', '=', divisa_name], ['active', '=', true]];
                        this.rpc({
                            model: 'res.currency',
                            method: 'search_read',
                            args: [domain, ['rate', 'symbol']],
                            kwargs: { limit: 1 },

                        }).then(result => {
                            let rate = result[0].rate;
                            let symbol = result[0].symbol;
                            this.selectedPaymentLine.set_divisa_symbol(symbol);
                            this.selectedPaymentLine.set_divisa_amount(amount);
                            amount = amount * rate;
                            this.selectedPaymentLine.set_amount(amount);
                        })

                    } else {
                        this.selectedPaymentLine.set_amount(NumberBuffer.getFloat());
                    }

                }
            }
        };
    Registries.Component.extend(PaymentScreen, PaymentScreenIGTF);

    const PaymentScreenStatusIGTF = PaymentScreenStatus =>
        class extends PaymentScreenStatus {
            get totalIGTF() {
                return this.env.pos.format_currency(this.currentOrder.get_IGTF_tax_for_order());
            }
        };
    Registries.Component.extend(PaymentScreenStatus, PaymentScreenStatusIGTF);

    //Override Paymentline model to add divisa_amount
    var _super_paymentline = models.Paymentline.prototype;
    models.Paymentline = models.Paymentline.extend({
        initialize: function (attr, options) {
            this.divisa_amount = 0;
            this.tax_IGTF = 0;
            this.divisa_symbol = "";
            _super_paymentline.initialize.apply(this, arguments);
        },
        set_divisa_amount: function (divisa_amount) {
            this.divisa_amount = divisa_amount;
        },
        get_divisa_amount: function () {
            return this.divisa_amount;
        },
        set_tax_IGTF: function (tax_IGTF) {
            this.tax_IGTF = tax_IGTF;
        },
        get_tax_IGTF: function () {
            return this.tax_IGTF;
        },
        set_divisa_symbol: function (divisa_symbol) {
            this.divisa_symbol = divisa_symbol;
        },
        get_divisa_symbol: function () {
            return this.divisa_symbol;
        },
        export_as_JSON: function () {
            var json = _super_paymentline.export_as_JSON.apply(this, arguments);
            json.field_divisa_amount = this.divisa_amount;
            json.tax_IGTF = this.tax_IGTF;
            return json
        },
    });

    //Override Order model to add IGTF tax
    var _super_order = models.Order.prototype;
    models.Order = models.Order.extend({
        initialize: function (attr, options) {
            this.IGTF_tax = 0;
            _super_order.initialize.apply(this, arguments);
        },
        set_IGTF_tax: function (IGTF_tax) {
            this.IGTF_tax = IGTF_tax;
        },
        get_IGTF_tax_for_order: function () {
            return this.IGTF_tax;
        },
        get_IGTF_tax: function (paymentline) {
            if (paymentline) {
                if (paymentline.payment_method.is_divisa) {
                    let tax = paymentline.payment_method.IGTF_tax_percent;
                    let IGTF_tax = paymentline.get_amount() * tax;
                    paymentline.set_tax_IGTF(IGTF_tax);
                    return round_pr(IGTF_tax, this.pos.currency.rounding)
                }
            }
            return 0;
        },
        get_total_IGTF_tax: function () {
            let lines = this.paymentlines.models;
            let sum = 0;
            if (lines) {
                for (let l = 0; l < lines.length; l++) {
                    if (lines[l].payment_method.is_divisa) {
                        sum += this.get_IGTF_tax(lines[l]);
                    }
                }
                this.set_IGTF_tax(sum)
                return round_pr(sum, this.pos.currency.rounding);
            }
            this.set_IGTF_tax(sum)
            return 0;
        },
        get_due: function (paymentline) {
            let due = _super_order.get_due.apply(this, arguments);
            if (paymentline) {
                let lines = this.paymentlines.models;
                if (lines) {
                    for (let i = 0; i < lines.length; i++) {
                        if (lines[i] === paymentline) {
                            break;
                        } else {
                            if (lines[i].payment_method.is_divisa) {
                                due += this.get_IGTF_tax(lines[i]);
                            }
                        }
                    }
                }
            } else {
                due += this.get_total_IGTF_tax();
            }
            return round_pr(due, this.pos.currency.rounding);
        },
        get_change: function (paymentline) {
            debugger;
            let change = _super_order.get_change.apply(this, arguments);
            if (paymentline) {
                let lines = this.paymentlines.models;
                for (let i = 0; i < lines.length; i++) {
                    if (lines[i].payment_method.is_divisa) {
                        change -= this.get_IGTF_tax(lines[i])
                        if (lines[i] == paymentline) {
                            break;
                        }
                    }

                }
            }
            else {
                if (this.is_paid() === true) {
                    change -= this.get_IGTF_tax_for_order();
                    return round_pr(change, this.pos.currency.rounding)
                }
                if (this.get_due() > 0) {
                    change = 0;
                    return round_pr(change, this.pos.currency.rounding)
                }
            }
            return round_pr(change, this.pos.currency.rounding)
        },
        export_as_JSON: function () {
            var json = _super_order.export_as_JSON.apply(this, arguments);
            json.IGTF_tax = this.IGTF_tax;
            json.amount_total = this.get_total_with_tax() + this.get_IGTF_tax_for_order()
            return json
        },
        add_paymentline: function (payment_method) {
            let newPaymentline = _super_order.add_paymentline.apply(this, arguments);
            if (newPaymentline && payment_method.is_divisa) {
                this.selected_paymentline.set_amount(0);
            }
            return newPaymentline;
        }

    });
});