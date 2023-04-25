from odoo import models, api, fields

class PosOrderIGTFTax(models.Model):
    _inherit = 'pos.order'

    IGTF_tax = fields.Float(string='IGTF', digits=0, readonly=True)

    @api.model
    def _order_fields(self, ui_order):
        res = super(PosOrderIGTFTax, self)._order_fields(ui_order)
        res['IGTF_tax'] = ui_order['IGTF_tax'] if ui_order['IGTF_tax'] else 0
        return res

    @api.model
    def _payment_fields(self, order, ui_paymentline):
        res = super(PosOrderIGTFTax, self)._payment_fields(
            order, ui_paymentline)
        res['tax_IGTF'] = ui_paymentline['tax_IGTF'] if ui_paymentline['tax_IGTF'] else 0
        res['divisa_amount'] = ui_paymentline['field_divisa_amount'] if ui_paymentline['field_divisa_amount'] else 0
        return res


class PosPaymentIGTFTax(models.Model):
    _inherit = 'pos.payment'

    tax_IGTF = fields.Monetary(
        string='IGTF Tax', currency_field='currency_id', readonly=True)
    divisa_amount = fields.Float(
        string='Divisa Amount', digits=0, readonly=True)
