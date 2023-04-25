odoo.define('cx_pos_commentary', function (require) {
    "use strict";

    const { Gui } = require('point_of_sale.Gui');
    const Registries = require('point_of_sale.Registries');
    const PaymentScreen = require('point_of_sale.PaymentScreen');

    //Override order model
    var models = require('point_of_sale.models');
    var _super_order = models.Order.prototype;
    models.Order = models.Order.extend({
        set_comment: function (comment) {
            this.comment = comment;
        },
        export_as_JSON: function () {
            var json = _super_order.export_as_JSON.apply(this, arguments);
            var order = this.pos.get('selectedOrder');
            if (order) {
                json.input_value = this.comment;
            }
            return json
        },

    })

    //Commentary popup
    const ReceiptCommentary = (PaymentScreen) =>
        class extends PaymentScreen {
            constructor() {
                super(...arguments);
            }
            async receiptComentary() {
                const { confirmed, payload } = await this.showPopup('TextInputPopup', {
                    title: this.env._t('Write a comment'),
                });
                if (confirmed) {
                    let order = this.env.pos.get_order();
                    order.set_comment(payload);
                }
            };
        };
    Registries.Component.extend(PaymentScreen, ReceiptCommentary);
    return ReceiptCommentary;

});