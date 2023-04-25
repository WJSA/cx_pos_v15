# -*- coding: utf-8 -*-

from odoo import fields, models, api
from odoo.exceptions import UserError, ValidationError

class AccountTaxPrinterID(models.Model):
    _inherit = 'account.tax'

    printer_id = fields.Integer(string='Tax printer id', default=0, 
                                help="""Select the ID tax:
                                        1 : 16%
                                        2 : 8%
                                        3 : 31%
                                        """)

    @api.constrains('printer_id')
    def _check_printer_id(self):
        for record in self:
            if record.printer_id not in [1,2,3]:
                raise ValidationError("The id you provide is not valid: %s. Please provide a valid id." % record.printer_id)