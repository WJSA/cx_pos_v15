# -*- coding: utf-8 -*-

from odoo import api, fields, models
from odoo.exceptions import UserError

class Cashier(models.Model):
    _name = 'pos.cashier'
    _description = 'Cashier code for register in fiscal printer'

    cashier_id =fields.Many2one(string='Employee',
                                required = True,
                                comodel_name ='hr.employee')

    def _compute_name(self):
        self.name = self.cashier_id.name

    name = fields.Char(string='Descriptor', compute='_compute_name', readonly=True)

    register_id = fields.Integer(string='Register id', default=0, required=True)

    cashier_code = fields.Integer(string='Cashier code', default=0, required=True)

class RefundAllowedEmployees(models.Model):
    _inherit = 'pos.config'

    refund_allowed_employee_ids = fields.Many2many('hr.employee', relation='refund_employees_rel', string='Empleados Permitidos')

