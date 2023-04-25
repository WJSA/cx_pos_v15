# -*- coding: utf-8 -*-
from datetime import date, timedelta, datetime

from odoo import fields, models, api, _
from odoo.exceptions import UserError, ValidationError, AccessError


class PrintZReport(models.Model):
    _inherit = 'pos.session'

    DATE_SELECTION = [
        ('si', 'Si'),
        ('no', 'No')
    ]

    NUMBER_SELECTION = [
        ('si', 'Si'),
        ('no', 'No')
    ]

    MODE = [
        ('a', 'A'),
        ('s', 'S'),
        ('m', 'M')
    ]

    z_report_per_date = fields.Selection(DATE_SELECTION,
                                         string='Per Date',
                                         default='si')
    z_report_per_number = fields.Selection(NUMBER_SELECTION,
                                           string='Per Number',
                                           default='no')
    z_report_start_date = fields.Date(string='Start Time',
                                      required=True,
                                      default=date.today().strftime('%Y-%m-%d'))

    z_report_end_date = fields.Date(string='Finish Time',
                                    required=True,
                                    default=date.today().strftime('%Y-%m-%d'))

    z_report_start_number = fields.Integer(string="start number", default=0)
    z_report_end_number = fields.Integer(string="end number")

    z_report_mode = fields.Selection(MODE, string="mode", default="s")


class IGTFAccountMove(models.Model):
    _inherit = 'pos.session'

    def _create_account_move(self, balancing_account=False, amount_to_balance=0, bank_payment_method_diffs=None):
        res = super(IGTFAccountMove, self)._create_account_move(
            balancing_account, amount_to_balance, bank_payment_method_diffs)
        if res:
            self._create_IGTF_move()
        return res

    def _create_IGTF_move(self):
        # IGTF movements
        payment_methods = self.payment_method_ids
        for payment_method in payment_methods:
            if payment_method.is_divisa:
                payments = self.env['pos.payment'].search(
                    [('session_id', '=', self.id), ('payment_method_id', '=', payment_method.id)])
                for payment in payments:
                    amount_igtf = payment.amount * \
                        payment_method.IGTF_tax_percent
                    journal_igtf_id = payment_method.igtf_journal_id.id
                    company_id = self.env.company.id
                    currency_id = self.env.company.currency_id.id
                    account_igtf = payment_method.igtf_journal_id.default_account_id.id
                    ref_name = 'Retencion IGTF'
                    partner_id = payment.pos_order_id.partner_id.id
                    date = payment.payment_date
                    lines = []
                    l1 = {
                        'debit': 0,
                        'credit': amount_igtf,
                        'price_unit': 0,
                        'balance': -1 * amount_igtf,
                        'amount_residual': -1 * amount_igtf,
                        'account_id': account_igtf,
                        'journal_id': journal_igtf_id,
                        'partner_id': partner_id,
                        'company_id': company_id,
                        'account_internal_type': 'other',
                        'ref': ref_name,
                        'date': date,
                        'currency_id': False,
                        'name': ref_name,
                        'move_name': '/',
                        'parent_state': 'draft',
                        'quantity': 1,
                        'exclude_from_invoice_tab': False,
                    }
                    l2 = {
                        'debit': amount_igtf,
                        'credit': 0,
                        'price_unit': 0,
                        'balance': amount_igtf,
                        'amount_residual': amount_igtf,
                        'account_id': payment_method.receivable_account_id.id,
                        'journal_id': journal_igtf_id,
                        'partner_id': partner_id,
                        'company_id': company_id,
                        'account_internal_type': 'other',
                        'ref': ref_name,
                        'date': date,
                        'currency_id': False,
                        'name': ref_name,
                        'move_name': '/',
                        'parent_state': 'draft',
                        'quantity': 1,
                        'exclude_from_invoice_tab': False,
                    }
                    lines.append((0, None, l1))
                    lines.append((0, None, l2))
                    move = {
                        'name': '/',
                        'ref': ref_name,
                        'journal_id': journal_igtf_id,
                        'company_id': company_id,
                        'currency_id': currency_id,
                        'partner_id': partner_id,
                        'commercial_partner_id': partner_id,
                        'date': date,
                        'state': 'draft',
                        'move_type': 'entry',
                        'amount_total': amount_igtf,
                        'amount_total_signed': amount_igtf,
                        'line_ids': lines
                    }
                    move_obj = self.env['account.move']
                    try:
                        move_id = move_obj.create(move)
                        print("CREATED!!!")
                        move_id.action_post()
                    except:
                        print("An Error has ocurred")
                        pass


class SessionReportsEmail(models.Model):
    _inherit = 'pos.session'

    def send_email(self):

        def get_recipient_employee_emails(line):
            users = line.search([('id', '=', line.id)]
                                ).config_id.email_recipient_employee_ids.user_id
            return users

        _date = date.today().strftime('%Y-%m-%d')
        date_start = f'{_date} 00:00:00'
        date_end = f'{_date} 23:59:59'

        lines = self.env['pos.session'].search([
            ('stop_at', '>=', date_start),
            ('stop_at', '<=', date_end)
        ], limit=1)

        for rec in lines:
            users = get_recipient_employee_emails(rec)
            template_id = rec.env.ref('cx_pos_v15.payments_report_email')

            for user in users:
                template_id.write({'email_to': user.email})
                rec.message_post_with_template(template_id.id)


class EmailRecipientEmployees(models.Model):
    _inherit = 'pos.config'

    email_recipient_employee_ids = fields.Many2many(
        'hr.employee', relation='email_recipient_employees_rel', string='Destinatarios de Correo Electrónico')
