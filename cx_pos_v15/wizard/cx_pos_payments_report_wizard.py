# -*- coding: utf-8 -*-
from datetime import date, datetime

from odoo import models, fields, api
import json


class PosPaymentsReportWizard(models.TransientModel):
    _name = 'cx_pos_v15.wizard'
    _description = 'POS payments report wizard'

    date = fields.Date(string='Fecha', 
                       required=True, 
                       default=date.today().strftime('%Y-%m-%d'))

    def get_report(self):
        data = {
            'model': self._name,
            'ids': self.ids,
            'form': {
                'date': self.date
            }
        }
        return self.env.ref('cx_pos_v15.pos_payments_report_cx').report_action(self, data=data)
