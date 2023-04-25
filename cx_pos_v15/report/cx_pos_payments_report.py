# -*- coding: utf-8 -*-
import datetime

from odoo import models, fields, api
from odoo.exceptions import UserError


class PosPaymentsReport(models.AbstractModel):
    _name = 'report.cx_pos_v15.cx_pos_payments_report'

    def _get_payments(self, date):
        date_start = f'{date} 00:00:00'
        date_end = f'{date} 23:59:59'

        lines = self.env['pos.payment'].search([
            ('payment_date', '>=', date_start),
            ('payment_date', '<=', date_end)
        ])

        if lines:
            return lines
        return None

    @api.model
    def _get_report_values(self, docids, data=None):

        def format_date(date):
            date_parts = date.split('-')
            return f'{date_parts[2]}/{date_parts[1]}/{date_parts[0]}'

        def get_payment_methods(lines):
            payment_methods = list()
            if lines:
                for line in lines:
                    payment_methods.append(line.payment_method_id)

                return list(set(payment_methods))
            return payment_methods

        if 'form' not in data.keys():
            data['form'] = dict()
            date = datetime.date.today().strftime('%Y-%m-%d')
            data['form']['date'] = date

        lines = self._get_payments(data['form']['date'])
        date = format_date(data['form']['date'])

        if lines:
            payment_method_ids = get_payment_methods(lines)
            return {
                # 'doc_ids': data['ids'],
                # 'doc_model': data['model'],
                'docs': lines,
                # 'data': data,
                'payment_method_ids': payment_method_ids,
                'company': self.env.user.company_id,
                'currency': self.env.user.currency_id,
                'date': date
            }
        raise UserError(
            'No existe ningún pago relacionado a esta fecha. Por favor verifique!')
